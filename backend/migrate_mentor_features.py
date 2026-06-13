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
    # 1. Add mentor_id to homework
    try:
        db.session.execute(db.text("ALTER TABLE homework ADD COLUMN mentor_id INTEGER REFERENCES users(id) ON DELETE SET NULL;"))
        print("mentor_id column added to homework table.")
    except Exception as e:
        print("homework table mentor_id column check:", e)
        db.session.rollback()

    # 2. Add mentor_id to quizzes
    try:
        db.session.execute(db.text("ALTER TABLE quizzes ADD COLUMN mentor_id INTEGER REFERENCES users(id) ON DELETE SET NULL;"))
        print("mentor_id column added to quizzes table.")
    except Exception as e:
        print("quizzes table mentor_id column check:", e)
        db.session.rollback()

    # 3. Add mentor_id to written_tests
    try:
        db.session.execute(db.text("ALTER TABLE written_tests ADD COLUMN mentor_id INTEGER REFERENCES users(id) ON DELETE SET NULL;"))
        print("mentor_id column added to written_tests table.")
    except Exception as e:
        print("written_tests table mentor_id column check:", e)
        db.session.rollback()

    # 4. Add student_id to library_materials
    try:
        db.session.execute(db.text("ALTER TABLE library_materials ADD COLUMN student_id INTEGER REFERENCES users(id) ON DELETE CASCADE;"))
        print("student_id column added to library_materials table.")
    except Exception as e:
        print("library_materials table student_id column check:", e)
        db.session.rollback()

    # 5. Populate existing data
    try:
        # For homework
        db.session.execute(db.text("""
            UPDATE homework h 
            SET mentor_id = (SELECT mentor_id FROM users u WHERE u.id = h.student_id) 
            WHERE student_id IS NOT NULL AND mentor_id IS NULL;
        """))
        # For quizzes
        db.session.execute(db.text("""
            UPDATE quizzes q 
            SET mentor_id = (SELECT mentor_id FROM users u WHERE u.id = q.student_id) 
            WHERE student_id IS NOT NULL AND mentor_id IS NULL;
        """))
        # For written_tests
        db.session.execute(db.text("""
            UPDATE written_tests wt 
            SET mentor_id = (SELECT mentor_id FROM users u WHERE u.id = wt.student_id) 
            WHERE student_id IS NOT NULL AND mentor_id IS NULL;
        """))
        print("Existing data updated with default mentor_ids.")
    except Exception as e:
        print("Error updating existing rows:", e)
        db.session.rollback()

    db.session.commit()
    print("Migration finished!")
