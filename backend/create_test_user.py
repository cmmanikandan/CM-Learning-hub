from app import create_app
from models import db, User
import firebase_admin
from firebase_admin import auth as firebase_auth
from werkzeug.security import generate_password_hash

app = create_app()
with app.app_context():
    email = "admin@cmlearninghub.com"
    password = "AdminPassword123!"
    
    print("1. Creating user in Firebase...")
    try:
        user_record = firebase_auth.create_user(
            email=email,
            password=password,
            display_name="Admin User"
        )
        firebase_uid = user_record.uid
        print(f"Success! Firebase UID: {firebase_uid}")
    except Exception as e:
        if "already exists" in str(e).lower():
            print("User already exists in Firebase, fetching UID...")
            user_record = firebase_auth.get_user_by_email(email)
            firebase_uid = user_record.uid
            # Force update password just in case
            firebase_auth.update_user(firebase_uid, password=password)
            print(f"UID: {firebase_uid}, password updated.")
        else:
            print(f"Firebase error: {e}")
            exit(1)

    print("\n2. Creating user in PostgreSQL...")
    user = User.query.filter_by(email=email).first()
    if not user:
        try:
            new_user = User(
                username="admin_test",
                email=email,
                password_hash=generate_password_hash(password),
                firebase_uid=firebase_uid,
                role="mentor",
                name="System Admin",
                tid="TID-ADMIN1"
            )
            db.session.add(new_user)
            db.session.commit()
            print("Success! User added to local database.")
        except Exception as e:
            print(f"Database error: {e}")
    else:
        # Update existing user's firebase_uid just in case
        user.firebase_uid = firebase_uid
        user.password_hash = generate_password_hash(password)
        db.session.commit()
        print("User already exists in database. Updated Firebase UID and password.")
        
    print("\n--- ALL DONE ---")
    print(f"Email: {email}")
    print(f"Password: {password}")
