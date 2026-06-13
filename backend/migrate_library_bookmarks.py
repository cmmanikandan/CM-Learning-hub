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
    try:
        db.session.execute(db.text("ALTER TABLE users ADD COLUMN bookmarked_material_ids TEXT;"))
        db.session.commit()
        print("bookmarked_material_ids column added successfully!")
    except Exception as e:
        print("bookmarked_material_ids column might already exist or error:", e)
        db.session.rollback()

    print("Migration finished!")
