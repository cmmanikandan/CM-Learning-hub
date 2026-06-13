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
    try:
        db.session.execute(db.text("ALTER TABLE users ADD COLUMN sid VARCHAR(20) UNIQUE;"))
    except Exception as e:
        print("SID exists:", e)
        db.session.rollback()

    try:
        db.session.execute(db.text("ALTER TABLE users ADD COLUMN tid VARCHAR(20) UNIQUE;"))
    except Exception as e:
        print("TID exists:", e)
        db.session.rollback()

    try:
        db.session.execute(db.text("ALTER TABLE users ADD COLUMN mentor_id INTEGER REFERENCES users(id);"))
    except Exception as e:
        print("mentor_id exists:", e)
        db.session.rollback()

    try:
        db.session.execute(db.text("ALTER TABLE users ADD COLUMN streak INTEGER DEFAULT 15 NOT NULL;"))
    except Exception as e:
        print("streak column exists:", e)
        db.session.rollback()
        
    db.session.commit()
    print("Migration finished!")
