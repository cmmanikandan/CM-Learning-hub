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
    
    # Configure app settings
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/cm_learning_hub')
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
    if firebase_cred_path and os.path.exists(firebase_cred_path):
        if not firebase_admin._apps:
            cred = credentials.Certificate(firebase_cred_path)
            firebase_admin.initialize_app(cred)
        app.logger.info("Firebase Admin SDK initialized.")
    else:
        app.logger.warning("FIREBASE_CREDENTIALS_PATH not set or file not found. Firebase Admin SDK NOT initialized.")
    
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
        
    @app.route('/')
    def index():
        return "CM Learning Hub Backend API - Please use /api/health or frontend client.", 200

    # Ensure tables exist in dev environment
    with app.app_context():
        try:
            db.create_all()
        except Exception as e:
            app.logger.warning(f"Could not automatically create database tables: {e}")

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
