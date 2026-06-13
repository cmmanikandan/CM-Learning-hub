"""
Script to set Firebase UID for the admin/mentor user.
Run from the backend directory: python set_admin_firebase_uid.py
"""
import os
import sys

# Set up path so we can import from this directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from app import create_app
from models import db, User

FIREBASE_UID = "JkSCaMatbucTYskEp5CpVl4gQtB2"
ADMIN_EMAIL = "admin@cmlearninghub.com"

app = create_app()

with app.app_context():
    # Find existing admin user
    user = User.query.filter(
        (User.email == ADMIN_EMAIL) | (User.firebase_uid == FIREBASE_UID)
    ).first()

    if not user:
        print(f"[ERROR] No user found with email '{ADMIN_EMAIL}' or UID '{FIREBASE_UID}'.")
        print("Creating admin user with this Firebase UID...")
        from werkzeug.security import generate_password_hash
        import uuid
        user = User(
            username="admin_test",
            email=ADMIN_EMAIL,
            firebase_uid=FIREBASE_UID,
            password_hash=generate_password_hash("AdminPassword123!"),
            role="mentor",
            name="System Admin",
            tid=f"TID-ADMIN1",
        )
        db.session.add(user)
        db.session.commit()
        print(f"[SUCCESS] Admin user created with Firebase UID: {FIREBASE_UID}")
    else:
        # Update Firebase UID
        old_uid = user.firebase_uid
        user.firebase_uid = FIREBASE_UID
        user.role = "mentor"  # Ensure it stays as mentor/admin
        db.session.commit()
        print(f"[SUCCESS] Updated user '{user.name}' ({user.email})")
        print(f"  Role      : {user.role}")
        print(f"  Old UID   : {old_uid or '(none)'}")
        print(f"  New UID   : {user.firebase_uid}")
        print(f"  User ID   : {user.id}")
        print(f"  TID       : {user.tid}")
