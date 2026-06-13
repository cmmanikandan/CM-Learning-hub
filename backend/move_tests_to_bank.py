import os
from sqlalchemy import text
from flask import Flask
from models import db, WrittenTest
from dotenv import load_dotenv

load_dotenv()

app = create_app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/cm_learning_hub')
db.init_app(app)

with app.app_context():
    tests = WrittenTest.query.all()
    print(f"Found {len(tests)} written tests.")
    for t in tests:
        t.is_bank = True
        print(f"Moved test '{t.test_name}' to Test Bank.")
    db.session.commit()
    print("Database update complete.")
