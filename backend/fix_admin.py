import os
from werkzeug.security import generate_password_hash
from app import create_app
from models import db, User

app = create_app()

def fix_admin_role():
    with app.app_context():
        # Find or create default mentor
        mentor = User.query.filter_by(email="mentor@cmlearninghub.com").first()
        if not mentor:
            print("Creating default mentor...")
            mentor = User(
                username="mentor_test",
                email="mentor@cmlearninghub.com",
                password_hash=generate_password_hash("MentorPassword123!"),
                role="mentor",
                name="Test Mentor",
                tid="TID-MENTOR1"
            )
            db.session.add(mentor)
            db.session.flush()  # get ID
        else:
            print(f"Default mentor already exists (ID: {mentor.id})")

        # Find or create admin
        admin = User.query.filter_by(email="admin@cmlearninghub.com").first()
        if admin:
            print(f"Found admin user with email admin@cmlearninghub.com. Old role: {admin.role}")
            
            # Reassign any assigned students if this user was a mentor
            if admin.role == "mentor":
                students = User.query.filter_by(mentor_id=admin.id).all()
                if students:
                    print(f"Reassigning {len(students)} students from admin to mentor...")
                    for s in students:
                        s.mentor_id = mentor.id
            
            # Update admin to correct role and details
            admin.username = "admin"
            admin.role = "admin"
            admin.name = "System Admin"
            admin.password_hash = generate_password_hash("AdminPassword123!")
            admin.tid = None  # Admins do not need a Mentor TID
            print("Updated admin@cmlearninghub.com role to 'admin' and password to 'AdminPassword123!'")
        else:
            print("Admin user admin@cmlearninghub.com not found. Creating a new admin user...")
            admin = User(
                username="admin",
                email="admin@cmlearninghub.com",
                password_hash=generate_password_hash("AdminPassword123!"),
                role="admin",
                name="System Admin"
            )
            db.session.add(admin)
            
        db.session.commit()
        print("Database roles and credentials fixed successfully!")

if __name__ == '__main__':
    fix_admin_role()
