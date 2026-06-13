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
    # 1. Add mentor_notes to users table
    try:
        db.session.execute(db.text("ALTER TABLE users ADD COLUMN mentor_notes TEXT;"))
        db.session.commit()
        print("mentor_notes column added successfully!")
    except Exception as e:
        print("mentor_notes column might already exist or error:", e)
        db.session.rollback()

    # 2. Add is_read to chat_messages table
    try:
        db.session.execute(db.text("ALTER TABLE chat_messages ADD COLUMN is_read BOOLEAN DEFAULT FALSE NOT NULL;"))
        db.session.commit()
        print("is_read column added to chat_messages successfully!")
    except Exception as e:
        print("is_read column might already exist or error:", e)
        db.session.rollback()

    print("Migration of new features finished!")
