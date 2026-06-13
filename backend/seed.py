import os
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash
from app import create_app
from models import db, User

load_dotenv()

def seed_database():
    app = create_app()
    with app.app_context():
        # Check if users already exist
        teacher = User.query.filter_by(role='teacher').first()
        if not teacher:
            print("Creating seed Teacher...")
            teacher = User(
                username='teacher',
                email='teacher@cmlearninghub.com',
                password_hash=generate_password_hash('teacher123'),
                role='teacher',
                name='Dr. Clara M. Mentors',
                photo_url='https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
            )
            db.session.add(teacher)
        else:
            print(f"Teacher already exists: {teacher.username}")

        student = User.query.filter_by(role='student').first()
        if not student:
            print("Creating seed Student...")
            student = User(
                username='student',
                email='student@cmlearninghub.com',
                password_hash=generate_password_hash('student123'),
                role='student',
                name='Alex Mercer',
                school='Westside Academy',
                class_name='Grade 10',
                section='Section B',
                parent_contact='+1 (555) 019-2834',
                photo_url='https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
            )
            db.session.add(student)
        else:
            print(f"Student already exists: {student.username}")

        db.session.commit()
        print("Database seeding completed successfully!")

if __name__ == '__main__':
    seed_database()
