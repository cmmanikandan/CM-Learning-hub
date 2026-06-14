import os
from flask import Flask
from models import db
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
# Force local SQLite connection
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///cm_learning_hub.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    # 1. Add assigned_date to users
    try:
        db.session.execute(db.text("ALTER TABLE users ADD COLUMN assigned_date DATE;"))
        db.session.commit()
        print("SQLite: Successfully added 'assigned_date' column to users table!")
    except Exception as e:
        print("SQLite: Column 'assigned_date' might already exist or error:", e)
        db.session.rollback()

    # 2. Add mentor_notes to users
    try:
        db.session.execute(db.text("ALTER TABLE users ADD COLUMN mentor_notes TEXT;"))
        db.session.commit()
        print("SQLite: Successfully added 'mentor_notes' column to users table!")
    except Exception as e:
        print("SQLite: Column 'mentor_notes' might already exist or error:", e)
        db.session.rollback()

    # 3. Add bookmarked_material_ids to users
    try:
        db.session.execute(db.text("ALTER TABLE users ADD COLUMN bookmarked_material_ids TEXT;"))
        db.session.commit()
        print("SQLite: Successfully added 'bookmarked_material_ids' column to users table!")
    except Exception as e:
        print("SQLite: Column 'bookmarked_material_ids' might already exist or error:", e)
        db.session.rollback()

    # 4. Add streak to users
    try:
        db.session.execute(db.text("ALTER TABLE users ADD COLUMN streak INTEGER DEFAULT 0 NOT NULL;"))
        db.session.commit()
        print("SQLite: Successfully added 'streak' column to users table!")
    except Exception as e:
        print("SQLite: Column 'streak' might already exist or error:", e)
        db.session.rollback()

    print("SQLite Migration finished!")
