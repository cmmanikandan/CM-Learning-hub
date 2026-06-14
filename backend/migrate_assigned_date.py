import os
from flask import Flask
from models import db
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Determine database URI matching app.py fallback logic
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
    # 1. Add assigned_date to users
    try:
        db.session.execute(db.text("ALTER TABLE users ADD COLUMN assigned_date DATE;"))
        db.session.commit()
        print("Successfully added 'assigned_date' column to users table!")
    except Exception as e:
        print("Column 'assigned_date' might already exist or error:", e)
        db.session.rollback()

    # 2. Add mentor_notes to users
    try:
        db.session.execute(db.text("ALTER TABLE users ADD COLUMN mentor_notes TEXT;"))
        db.session.commit()
        print("Successfully added 'mentor_notes' column to users table!")
    except Exception as e:
        print("Column 'mentor_notes' might already exist or error:", e)
        db.session.rollback()

    # 3. Add bookmarked_material_ids to users
    try:
        db.session.execute(db.text("ALTER TABLE users ADD COLUMN bookmarked_material_ids TEXT;"))
        db.session.commit()
        print("Successfully added 'bookmarked_material_ids' column to users table!")
    except Exception as e:
        print("Column 'bookmarked_material_ids' might already exist or error:", e)
        db.session.rollback()

    # 4. Add streak to users
    try:
        db.session.execute(db.text("ALTER TABLE users ADD COLUMN streak INTEGER DEFAULT 0 NOT NULL;"))
        db.session.commit()
        print("Successfully added 'streak' column to users table!")
    except Exception as e:
        print("Column 'streak' might already exist or error:", e)
        db.session.rollback()

    print("Migration finished!")
