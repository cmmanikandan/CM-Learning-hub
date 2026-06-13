from app import create_app
from models import db, Homework

app = create_app()
with app.app_context():
    hws = Homework.query.order_by(Homework.id).all()
    print("ID | Subject | Status | Title | Student ID")
    print("-" * 50)
    for hw in hws:
        print(f"{hw.id} | {hw.subject} | {hw.status} | {hw.title} | {hw.student_id}")
