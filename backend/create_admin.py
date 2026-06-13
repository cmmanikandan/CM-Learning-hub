import os
from werkzeug.security import generate_password_hash
from app import create_app
from models import db, User

app = create_app()

def seed_admin():
    with app.app_context():
        # Check if admin already exists
        admin = User.query.filter_by(role='admin').first()
        if admin:
            print("Admin account already exists.")
            return

        # Create admin
        password_hash = generate_password_hash("admin123")
        new_admin = User(
            username="admin",
            email="admin@learninghub.com",
            password_hash=password_hash,
            role="admin",
            name="System Administrator"
        )
        db.session.add(new_admin)
        db.session.commit()
        print("Admin account created successfully! Username: admin, Password: admin123")

if __name__ == '__main__':
    seed_admin()
