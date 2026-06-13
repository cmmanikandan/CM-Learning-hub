import os
import sys

# Add backend to python path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
sys.path.insert(0, backend_path)

from app import create_app
from models import db, ChatMessage, User, QuizSubmission

def test_app():
    print("Testing backend startup...")
    app = create_app()
    app.config['TESTING'] = True
    
    with app.app_context():
        # Check tables existence
        print("Verifying database models via mock queries...")
        try:
            ChatMessage.query.limit(1).all()
            User.query.limit(1).all()
            QuizSubmission.query.limit(1).all()
            print("Database models successfully verified!")
        except Exception as e:
            print("Table query verification failed:", e)
            raise e

    client = app.test_client()
    
    # Test health check
    print("Verifying /api/health...")
    resp = client.get('/api/health')
    assert resp.status_code == 200
    print("Health check response:", resp.get_json())
    
    print("All backend models and routes verified successfully!")

if __name__ == '__main__':
    test_app()
