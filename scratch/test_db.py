import os
import sys
from dotenv import load_dotenv

# Add backend to python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

from app import create_app
from models import db, Homework, User, Notification

app = create_app()
with app.app_context():
    print("Database connection successful!")
    print("\n--- Users ---")
    users = User.query.all()
    for u in users:
        print(f"ID: {u.id}, Username: {u.username}, Role: {u.role}, Mentor ID: {u.mentor_id}")

    print("\n--- Homeworks ---")
    hws = Homework.query.all()
    for hw in hws:
        print(f"ID: {hw.id}, Title: {hw.title}, Subject: {hw.subject}, Status: {hw.status}, Student ID: {hw.student_id}")

    print("\n--- Notifications ---")
    notifs = Notification.query.all()
    for n in notifs:
        print(f"ID: {n.id}, User ID: {n.user_id}, Title: {n.title}, Type: {n.notification_type}")
