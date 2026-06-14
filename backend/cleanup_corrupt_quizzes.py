import os
from flask import Flask
from models import db, Quiz, Question
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

db_uri = os.getenv('DATABASE_URL')
if db_uri:
    from sqlalchemy import create_engine
    try:
        connect_args = {"connect_timeout": 3} if db_uri.startswith("postgresql") else {}
        engine = create_engine(db_uri, connect_args=connect_args)
        with engine.connect() as conn:
            print("Successfully connected to the remote database.")
    except Exception as e:
        print(f"Could not connect to database specified in DATABASE_URL: {e}")
        print("Falling back to local SQLite database: cm_learning_hub.db")
        db_uri = 'sqlite:///cm_learning_hub.db'
else:
    db_uri = 'sqlite:///cm_learning_hub.db'
    print("DATABASE_URL not set. Using local SQLite database: cm_learning_hub.db")

app.config['SQLALCHEMY_DATABASE_URI'] = db_uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    quizzes = Quiz.query.all()
    deleted_count = 0
    for q in quizzes:
        if len(q.questions) == 0:
            print(f"Deleting corrupt quiz '{q.quiz_name}' (ID: {q.id}) with 0 questions.")
            db.session.delete(q)
            deleted_count += 1
    if deleted_count > 0:
        db.session.commit()
    print(f"Cleanup complete. Deleted {deleted_count} corrupt quizzes.")
