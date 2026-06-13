import os
from flask import Flask
from models import db
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/cm_learning_hub')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    # quizzes table migration
    try:
        db.session.execute(db.text("ALTER TABLE quizzes ADD COLUMN student_id INTEGER REFERENCES users(id) ON DELETE CASCADE;"))
        print("student_id column added to quizzes table.")
    except Exception as e:
        print("student_id column in quizzes table check:", e)
        db.session.rollback()

    # written_tests table migration
    try:
        db.session.execute(db.text("ALTER TABLE written_tests ADD COLUMN student_id INTEGER REFERENCES users(id) ON DELETE CASCADE;"))
        print("student_id column added to written_tests table.")
    except Exception as e:
        print("student_id column in written_tests table check:", e)
        db.session.rollback()

    db.session.commit()
    print("Quiz/Test Student Migration Finished!")
