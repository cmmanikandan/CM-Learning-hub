import os
from models import db, WrittenTest
from flask import Flask
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/cm_learning_hub')
db.init_app(app)

with app.app_context():
    ime = WrittenTest.query.filter_by(test_name="ime").first()
    if not ime:
        ime = WrittenTest(
            test_name="ime",
            subject="Physics",
            test_type="Unit Test",
            description="Physics Test",
            instructions="Complete all questions",
            duration=60,
            total_marks=100,
            question_paper_url="https://res.cloudinary.com/dznjnvmb7/raw/upload/v1781062325/ivfn6ifousla7ifctdkv.txt",
            question_paper_name="IME SEM question.pdf",
            is_bank=True
        )
        db.session.add(ime)
        db.session.commit()
        print("Added 'ime' template to the Test Bank.")
    else:
        ime.is_bank = True
        db.session.commit()
        print("'ime' already existed, updated to is_bank=True.")
