import os
from flask import Flask
from models import db
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://postgres:CMMANI%4002cm@db.kbwpahscrmxscrgolsmu.supabase.co:5432/postgres')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    # 1. Add uploaded_by_id to library_materials table
    try:
        db.session.execute(db.text("ALTER TABLE library_materials ADD COLUMN uploaded_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL;"))
        db.session.commit()
        print("uploaded_by_id column added successfully to library_materials!")
    except Exception as e:
        print("uploaded_by_id column might already exist or error:", e)
        db.session.rollback()

    print("Migration finished!")
