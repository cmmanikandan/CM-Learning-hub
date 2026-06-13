import os
from flask import Flask
from models import db
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    try:
        # Run ALTER TABLE to add the column and reference the table itself
        db.session.execute(db.text("ALTER TABLE homework ADD COLUMN carried_from_id INTEGER REFERENCES homework(id) ON DELETE SET NULL;"))
        db.session.commit()
        print("SUCCESS: Column carried_from_id added to homework table!")
    except Exception as e:
        print("INFO/WARNING (column might already exist):", e)
        db.session.rollback()
