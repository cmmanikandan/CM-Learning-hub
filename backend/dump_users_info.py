from app import create_app
from models import db, User

app = create_app()
with app.app_context():
    print("--- ALL USERS ---")
    users = User.query.all()
    for u in users:
        print(f"ID: {u.id}, Username: {u.username}, Email: {u.email}, Role: {u.role}, Name: {u.name}, Mentor ID: {u.mentor_id}")
