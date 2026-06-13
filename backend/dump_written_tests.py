import os
from models import db, WrittenTest
from flask import Flask
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/cm_learning_hub')
db.init_app(app)

with app.app_context():
    tests = WrittenTest.query.all()
    print(f"Total tests: {len(tests)}")
    for t in tests:
        print(f"ID: {t.id}, Name: {t.test_name}, is_bank: {t.is_bank}")
