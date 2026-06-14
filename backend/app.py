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
    if db_uri:
        from sqlalchemy import create_engine
        try:
            # Try to connect with a short timeout
            connect_args = {"connect_timeout": 3} if db_uri.startswith("postgresql") else {}
            engine = create_engine(db_uri, connect_args=connect_args)
            with engine.connect() as conn:
                app.logger.info("Successfully connected to the remote database.")
        except Exception as e:
            app.logger.warning(f"Could not connect to database specified in DATABASE_URL: {e}")
            app.config['DB_CONNECTION_ERROR'] = str(e)
            app.logger.info("Falling back to local SQLite database: cm_learning_hub.db")
            db_uri = 'sqlite:///cm_learning_hub.db'
    else:
        db_uri = 'sqlite:///cm_learning_hub.db'
        app.logger.info("DATABASE_URL not set. Using local SQLite database: cm_learning_hub.db")

    app.config['SQLALCHEMY_DATABASE_URI'] = db_uri
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'super-secret-key-cm-hub')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)
    
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

    # Ensure tables exist in dev environment
    with app.app_context():
        try:
            db.create_all()
            
            # Failsafe: check and fix admin credentials/role on startup
            from werkzeug.security import generate_password_hash
            
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

            admin = User.query.filter_by(email="admin@cmlearninghub.com").first()
            if admin:
                # Always ensure correct admin role and credentials
                admin.role = "admin"
                admin.username = "admin"
                admin.name = "System Admin"
                admin.password_hash = generate_password_hash("AdminPassword123!")
                admin.tid = None
                
                # Reassign admin's students to the mentor
                students = User.query.filter_by(mentor_id=admin.id).all()
                for s in students:
                    s.mentor_id = mentor.id
                
                db.session.commit()
                app.logger.info("Failsafe: Verified and updated admin@cmlearninghub.com to admin role & password.")
            else:
                # Create default admin if missing
                admin = User(
                    username="admin",
                    email="admin@cmlearninghub.com",
                    password_hash=generate_password_hash("AdminPassword123!"),
                    role="admin",
                    name="System Admin"
                )
                db.session.add(admin)
                db.session.commit()
                app.logger.info("Failsafe: Created admin@cmlearninghub.com user.")

            # Failsafe for user's Google account
            google_admin = User.query.filter_by(email="manikandanprabhu37@gmail.com").first()
            if google_admin and google_admin.role != "admin":
                google_admin.role = "admin"
                db.session.commit()
                app.logger.info("Failsafe: Promoted Google account manikandanprabhu37@gmail.com to admin role.")

            if User.query.count() <= 2: # only admin and mentor exist
                app.logger.info("SQLite database is empty, auto-seeding default students...")
                
                # Create default student (no mentor)
                student = User(
                    username="studenttest",
                    email="student@cmlearninghub.com",
                    password_hash=generate_password_hash("student123"),
                    role="student",
                    name="Student Test",
                    school="Westside Academy",
                    class_name="Grade 10",
                    section="Section B",
                    parent_contact="+1 (555) 019-2834"
                )
                db.session.add(student)
                
                # Create default student 1 assigned to mentor 1
                student1 = User(
                    username="test_student_hw_1",
                    email="student_hw_1@test.com",
                    password_hash=generate_password_hash("student123"),
                    role="student",
                    name="Test Student 1",
                    school="Westside Academy",
                    class_name="Grade 10",
                    section="Section B",
                    parent_contact="+1 (555) 019-2834",
                    mentor_id=mentor.id
                )
                db.session.add(student1)

                db.session.commit()
                app.logger.info("Default users seeded successfully!")
        except Exception as e:
            app.logger.warning(f"Could not automatically create/seed database tables: {e}")

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
