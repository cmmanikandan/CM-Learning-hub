import os
from datetime import timedelta
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
from models import db, User
import firebase_admin
from firebase_admin import credentials

load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Initialize Firebase status variables for diagnostics
    app.config['FIREBASE_INIT_STATUS'] = 'Not started'
    app.config['FIREBASE_INIT_ERROR'] = None
    app.config['FIREBASE_INIT_KEYS'] = []
    app.config['FIREBASE_JSON_LEN'] = 0
    
    # Configure app settings
    app.config['DB_CONNECTION_ERROR'] = None
    db_uri = os.getenv('DATABASE_URL')
    if not db_uri:
        is_render = os.getenv('RENDER') == 'true'
        is_prod = os.getenv('FLASK_ENV') == 'production'
        if is_render or is_prod:
            app.logger.error("FATAL: DATABASE_URL not set in production/Render environment.")
            raise RuntimeError("DATABASE_URL environment variable is required in production.")
        db_uri = 'sqlite:///cm_learning_hub.db'
        app.logger.info("DATABASE_URL not set. Using local SQLite database: cm_learning_hub.db")

    app.config['SQLALCHEMY_DATABASE_URI'] = db_uri
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'super-secret-key-cm-hub')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)
    
    # Connection pool settings for remote PostgreSQL (critical for performance)
    if db_uri.startswith('postgresql'):
        # Detect if using Transaction pooler (port 6543) vs Session pooler (port 5432)
        is_transaction_pooler = ':6543/' in db_uri
        app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
            'pool_size': 5,           # maintain 5 persistent connections
            'max_overflow': 10,       # allow up to 10 extra temporary connections
            'pool_pre_ping': True,    # auto-reconnect if connection dropped
            'pool_recycle': 180,      # recycle connections every 3 minutes
            'connect_args': {
                'connect_timeout': 10,
                # Required for Transaction pooler (PgBouncer port 6543)
                # Without this, SQLAlchemy prepared statements break randomly
                **({"options": "-c statement_timeout=30000"} if is_transaction_pooler else {})
            },
            # Disable prepared statement cache for Transaction pooler compatibility
            **({"execution_options": {"no_parameters": True}} if is_transaction_pooler else {})
        }
    
    # Enable CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Initialize DB & JWT
    db.init_app(app)
    jwt = JWTManager(app)
    
    # Initialize Firebase Admin SDK
    firebase_cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH')
    if firebase_cred_path and not os.path.isabs(firebase_cred_path):
        app_dir = os.path.dirname(os.path.abspath(__file__))
        firebase_cred_path = os.path.join(app_dir, firebase_cred_path)

    firebase_json = os.getenv('FIREBASE_CREDENTIALS_JSON')
    app.config['FIREBASE_JSON_LEN'] = len(firebase_json) if firebase_json else 0
    
    if not firebase_admin._apps:
        initialized = False
        try:
            if firebase_cred_path and os.path.exists(firebase_cred_path):
                app.logger.info(f"Attempting to initialize Firebase from path: {firebase_cred_path}")
                cred = credentials.Certificate(firebase_cred_path)
                firebase_admin.initialize_app(cred)
                app.logger.info("Firebase Admin SDK initialized from file.")
                app.config['FIREBASE_INIT_STATUS'] = 'Initialized from file'
                initialized = True
            elif firebase_json:
                app.logger.info(f"Attempting to initialize Firebase from FIREBASE_CREDENTIALS_JSON (len: {len(firebase_json)}).")
                # Strip wrapping quotes if any (common copy-paste issue in env vars)
                clean_json = firebase_json.strip()
                if (clean_json.startswith("'") and clean_json.endswith("'")) or \
                   (clean_json.startswith('"') and clean_json.endswith('"')):
                    app.logger.info("Detected wrapping quotes in FIREBASE_CREDENTIALS_JSON. Removing them.")
                    clean_json = clean_json[1:-1].strip()
                
                # Check JSON structure
                if not (clean_json.startswith('{') and clean_json.endswith('}')):
                    app.logger.warning(f"FIREBASE_CREDENTIALS_JSON does not seem to be a valid JSON object structure: starts with '{clean_json[:5]}' and ends with '{clean_json[-5:]}'")
                
                import json
                try:
                    cred_dict = json.loads(clean_json)
                    app.config['FIREBASE_INIT_KEYS'] = list(cred_dict.keys())
                    app.logger.info(f"Successfully parsed FIREBASE_CREDENTIALS_JSON. Keys present: {list(cred_dict.keys())}")
                    
                    if 'project_id' not in cred_dict:
                        app.logger.warning("WARNING: 'project_id' is missing from the parsed credential JSON!")
                    
                    cred = credentials.Certificate(cred_dict)
                    firebase_admin.initialize_app(cred)
                    app.logger.info("Firebase Admin SDK initialized from env JSON.")
                    app.config['FIREBASE_INIT_STATUS'] = 'Initialized from env JSON'
                    initialized = True
                except json.JSONDecodeError as jde:
                    app.config['FIREBASE_INIT_STATUS'] = 'Failed to parse JSON'
                    app.config['FIREBASE_INIT_ERROR'] = f"JSONDecodeError: {jde}"
                    app.logger.error(f"JSONDecodeError parsing FIREBASE_CREDENTIALS_JSON: {jde}")
                    app.logger.error(f"Raw FIREBASE_CREDENTIALS_JSON prefix: {clean_json[:50]}...")
                    raise
            else:
                app.logger.info("No explicit credentials path or JSON env set. Trying default credentials.")
                firebase_admin.initialize_app()
                app.logger.info("Firebase Admin SDK initialized with default credentials.")
                app.config['FIREBASE_INIT_STATUS'] = 'Initialized with default credentials'
                initialized = True
        except Exception as e:
            import traceback
            err_msg = f"{e}\n{traceback.format_exc()}"
            app.logger.error(f"Firebase Admin SDK initialization failed: {e}")
            app.logger.error(traceback.format_exc())
            app.config['FIREBASE_INIT_STATUS'] = 'Failed during initialization'
            app.config['FIREBASE_INIT_ERROR'] = err_msg
            
        # Verify if initialization was successful and has project ID
        if initialized:
            try:
                fb_app = firebase_admin.get_app()
                proj_id = fb_app.project_id
                if not proj_id:
                    app.logger.warning("WARNING: Firebase App initialized, but project_id is None. ID token verification WILL fail.")
                else:
                    app.logger.info(f"Firebase App initialized with project_id: {proj_id}")
            except Exception as e:
                app.logger.error(f"Error checking initialized Firebase App details: {e}")
    
    # Import and register blueprints
    from routes.auth import auth_bp
    from routes.homework import homework_bp
    from routes.library import library_bp
    from routes.quiz import quiz_bp
    from routes.tests import tests_bp
    from routes.users import users_bp
    from routes.admin import admin_bp
    from routes.notifications import notifications_bp
    from routes.achievements import achievements_bp
    from routes.chat import chat_bp
    from routes.attendance import attendance_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(homework_bp, url_prefix='/api/homework')
    app.register_blueprint(library_bp, url_prefix='/api/library')
    app.register_blueprint(quiz_bp, url_prefix='/api/quiz')
    app.register_blueprint(tests_bp, url_prefix='/api/tests')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    app.register_blueprint(achievements_bp, url_prefix='/api/achievements')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(attendance_bp, url_prefix='/api/attendance')
    
    # Health check route
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "healthy",
            "message": "CM Learning Hub Backend API is running",
            "version": "1.0.0"
        }), 200

    # Lightweight ping endpoint (used by keep-alive thread)
    @app.route('/api/ping', methods=['GET'])
    def ping():
        return jsonify({"pong": True}), 200

    # Keep-alive: ping self every 10 minutes to prevent Render free plan cold starts
    import threading
    import time
    import urllib.request

    def _keep_alive():
        # Wait 60s after startup before first ping
        time.sleep(60)
        render_url = os.getenv('RENDER_EXTERNAL_URL', '')
        if not render_url:
            return  # Not on Render, don't ping
        ping_url = f"{render_url}/api/ping"
        app.logger.info(f"Keep-alive thread started. Will ping {ping_url} every 10 minutes.")
        while True:
            try:
                with urllib.request.urlopen(ping_url, timeout=10) as resp:
                    app.logger.debug(f"Keep-alive ping OK: {resp.status}")
            except Exception as e:
                app.logger.warning(f"Keep-alive ping failed: {e}")
            time.sleep(600)  # 10 minutes

    _ka_thread = threading.Thread(target=_keep_alive, daemon=True, name="keep-alive")
    _ka_thread.start()
        
    @app.route('/api/config/cloudinary', methods=['GET'])
    def cloudinary_config():
        import os
        return jsonify({
            "cloud_name": os.getenv('VITE_CLOUDINARY_CLOUD_NAME') or os.getenv('CLOUDINARY_CLOUD_NAME'),
            "upload_preset": os.getenv('VITE_CLOUDINARY_UPLOAD_PRESET') or os.getenv('CLOUDINARY_UPLOAD_PRESET')
        }), 200
        
    @app.after_request
    def add_cache_control_headers(response):
        # Disable caching for all API responses to prevent session/state leak
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response
        
    @app.route('/api/firebase-debug', methods=['GET'])
    def firebase_debug():
        import firebase_admin
        import os
        import re
        fb_apps = [a.name for a in firebase_admin._apps.values()] if firebase_admin._apps else []
        proj_id = None
        if firebase_admin._apps:
            try:
                proj_id = firebase_admin.get_app().project_id
            except Exception as e:
                proj_id = f"Error: {e}"
        
        firebase_json = os.getenv('FIREBASE_CREDENTIALS_JSON', '')
        clean_json = firebase_json.strip()
        if (clean_json.startswith("'") and clean_json.endswith("'")) or \
           (clean_json.startswith('"') and clean_json.endswith('"')):
            clean_json = clean_json[1:-1].strip()
            
        prefix_chars = [ord(c) for c in clean_json[:20]]
        prefix_str = clean_json[:20]
        
        # Mask database password
        db_url = os.getenv('DATABASE_URL', '')
        masked_db_url = re.sub(r':([^@]+)@', ':***@', db_url) if db_url else 'None (defaulting to local SQLite)'
        
        config_db_url = app.config.get('SQLALCHEMY_DATABASE_URI', '')
        masked_config_db_url = re.sub(r':([^@]+)@', ':***@', config_db_url) if config_db_url else 'None'
        
        # Get users list for debugging
        from models import User
        users_list = []
        try:
            users = User.query.all()
            users_list = [{"id": u.id, "email": u.email, "role": u.role, "username": u.username, "name": u.name} for u in users]
        except Exception as ue:
            users_list = [f"Error querying users: {ue}"]
        
        return jsonify({
            "status": app.config.get('FIREBASE_INIT_STATUS'),
            "error": app.config.get('FIREBASE_INIT_ERROR'),
            "keys_present": app.config.get('FIREBASE_INIT_KEYS'),
            "env_json_length": app.config.get('FIREBASE_JSON_LEN'),
            "firebase_apps": fb_apps,
            "project_id": proj_id,
            "prefix_char_codes": prefix_chars,
            "prefix_str_safe": prefix_str.replace('\n', '\\n').replace('\r', '\\r'),
            "env_database_url": masked_db_url,
            "config_database_url": masked_config_db_url,
            "db_connection_error": app.config.get('DB_CONNECTION_ERROR'),
            "users": users_list
        }), 200
        
    @app.route('/')
    def index():
        return "CM Learning Hub Backend API - Please use /api/health or frontend client.", 200

    # Ensure tables exist
    with app.app_context():
        try:
            db.create_all()
            
            from werkzeug.security import generate_password_hash
            
            # Only run seeding/failsafe if admin is missing (avoids slow queries on every restart)
            admin = User.query.filter_by(email="admin@cmlearninghub.com").first()
            if not admin:
                app.logger.info("Admin user missing — running first-time setup...")
                
                # Ensure default mentor exists
                mentor = User.query.filter_by(email="mentor@cmlearninghub.com").first()
                if not mentor:
                    mentor = User(
                        username="mentor_test",
                        email="mentor@cmlearninghub.com",
                        password_hash=generate_password_hash("MentorPassword123!"),
                        role="mentor",
                        name="Test Mentor",
                        tid="TID-MENTOR1"
                    )
                    db.session.add(mentor)
                    db.session.flush()

                admin = User(
                    username="admin",
                    email="admin@cmlearninghub.com",
                    password_hash=generate_password_hash("AdminPassword123!"),
                    role="admin",
                    name="System Admin"
                )
                db.session.add(admin)
                db.session.commit()
                app.logger.info("First-time setup: Created admin user.")
            
            # Ensure Google account has admin role (lightweight single query)
            google_admin = User.query.filter_by(email="manikandanprabhu37@gmail.com").first()
            if google_admin and google_admin.role != "admin":
                google_admin.role = "admin"
                db.session.commit()
                app.logger.info("Promoted manikandanprabhu37@gmail.com to admin role.")
                
        except Exception as e:
            db.session.rollback()
            app.logger.warning(f"Could not automatically create/seed database tables: {e}")

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
