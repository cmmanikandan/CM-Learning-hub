import os
from sqlalchemy import text
from flask import Flask
from models import db
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/cm_learning_hub')
db.init_app(app)

with app.app_context():
    with db.engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE quizzes ADD COLUMN is_bank BOOLEAN NOT NULL DEFAULT FALSE;"))
            print("Added is_bank column.")
        except Exception as e:
            print(f"Error adding is_bank: {e}")
            
        try:
            conn.execute(text("ALTER TABLE quizzes ADD COLUMN assignment_date DATE;"))
            print("Added assignment_date column.")
        except Exception as e:
            print(f"Error adding assignment_date: {e}")
            
        conn.commit()
    print("Database alteration complete.")
