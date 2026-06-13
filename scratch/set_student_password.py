import os
import sys
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

# Add backend to python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

from app import create_app
from models import db, User

app = create_app()
with app.app_context():
    u = User.query.get(7)
    if u:
        print(f"Found student ID 7: Username={u.username}, Email={u.email}, Role={u.role}")
        # Reset password
        u.password_hash = generate_password_hash("password123")
        # Ensure email is valid
        if not u.email or "@" not in u.email:
            u.email = "student_hw_1@example.com"
        db.session.commit()
        print("Updated student ID 7 password to 'password123' and email to", u.email)
    else:
        print("Student ID 7 not found!")
