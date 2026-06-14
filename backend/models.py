from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    firebase_uid = db.Column(db.String(128), unique=True, nullable=True)
    password_hash = db.Column(db.String(256), nullable=True)
    role = db.Column(db.String(20), nullable=False)  # 'mentor' or 'student'
    name = db.Column(db.String(100), nullable=False)
    photo_url = db.Column(db.String(256), nullable=True)
    
    # ID tracking
    sid = db.Column(db.String(20), unique=True, nullable=True)
    tid = db.Column(db.String(20), unique=True, nullable=True)
    
    # Mentor-Student relationship
    mentor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    students_assigned = db.relationship('User', backref=db.backref('mentor', remote_side=[id]), lazy=True)
    
    # Student specific fields (ignored/null for mentor)
    school = db.Column(db.String(120), nullable=True)
    class_name = db.Column(db.String(50), nullable=True)
    section = db.Column(db.String(20), nullable=True)
    parent_contact = db.Column(db.String(50), nullable=True)
    streak = db.Column(db.Integer, nullable=False, default=0)
    mentor_notes = db.Column(db.Text, nullable=True)
    bookmarked_material_ids = db.Column(db.Text, nullable=True)
    assigned_date = db.Column(db.Date, nullable=True)
    
    submissions = db.relationship('QuizSubmission', backref='student', lazy=True)
    test_submissions = db.relationship('WrittenTestSubmission', backref='student', lazy=True)
    achievements = db.relationship('Achievement', backref='student', lazy=True)
    notifications = db.relationship('Notification', backref='user', lazy=True)

class Homework(db.Model):
    __tablename__ = 'homework'
    
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    subject = db.Column(db.String(80), nullable=False)
    homework_type = db.Column(db.String(50), nullable=False) # 'School Homework' or 'Extra Practice'
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    priority = db.Column(db.String(20), nullable=False, default='Medium') # 'Low', 'Medium', 'High'
    estimated_time = db.Column(db.Integer, nullable=True) # in minutes
    due_date = db.Column(db.Date, nullable=True)
    attachment_url = db.Column(db.String(256), nullable=True)
    remarks = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), nullable=False, default='Pending') # 'Pending' or 'Completed'
    carried_from_id = db.Column(db.Integer, db.ForeignKey('homework.id', ondelete='SET NULL'), nullable=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=True)
    mentor_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class LibraryMaterial(db.Model):
    __tablename__ = 'library_materials'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    subject = db.Column(db.String(80), nullable=False)
    category = db.Column(db.String(80), nullable=False) # 'Textbooks', 'Notes', 'Worksheets', etc.
    description = db.Column(db.Text, nullable=True)
    tags = db.Column(db.String(200), nullable=True) # comma-separated
    file_url = db.Column(db.String(256), nullable=False)
    thumbnail_url = db.Column(db.String(256), nullable=True)
    visibility = db.Column(db.String(20), nullable=False, default='Public') # 'Public' or 'Private'
    uploaded_by_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    uploaded_by = db.relationship('User', foreign_keys='LibraryMaterial.uploaded_by_id', lazy=True)

class Quiz(db.Model):
    __tablename__ = 'quizzes'
    
    id = db.Column(db.Integer, primary_key=True)
    quiz_name = db.Column(db.String(200), nullable=False)
    subject = db.Column(db.String(80), nullable=False)
    chapter = db.Column(db.String(100), nullable=True)
    lesson = db.Column(db.String(100), nullable=True)
    difficulty = db.Column(db.String(20), nullable=False, default='Medium') # 'Easy', 'Medium', 'Hard'
    instructions = db.Column(db.Text, nullable=True)
    time_limit = db.Column(db.Integer, nullable=False) # in minutes
    passing_marks = db.Column(db.Integer, nullable=False)
    total_marks = db.Column(db.Integer, nullable=False)
    start_time = db.Column(db.DateTime, nullable=True)
    end_time = db.Column(db.DateTime, nullable=True)
    is_bank = db.Column(db.Boolean, nullable=False, default=False)
    assignment_date = db.Column(db.Date, nullable=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=True)
    mentor_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    questions = db.relationship('Question', backref='quiz', lazy=True, cascade="all, delete-orphan")
    submissions = db.relationship('QuizSubmission', backref='quiz', lazy=True, cascade="all, delete-orphan")

class Question(db.Model):
    __tablename__ = 'questions'
    
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)
    question_type = db.Column(db.String(50), nullable=False) # 'mcq', 'true_false', 'fill_blank', 'match', 'short'
    question_text = db.Column(db.Text, nullable=False)
    options = db.Column(db.JSON, nullable=True) # JSON list for MCQ options or Match options
    correct_answer = db.Column(db.Text, nullable=False)
    explanation = db.Column(db.Text, nullable=True)
    marks = db.Column(db.Integer, nullable=False, default=1)

class QuizSubmission(db.Model):
    __tablename__ = 'quiz_submissions'
    
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    answers = db.Column(db.JSON, nullable=False) # student's answered options
    accuracy = db.Column(db.Float, nullable=False) # percentage
    time_taken = db.Column(db.Integer, nullable=False) # in seconds
    strong_areas = db.Column(db.String(256), nullable=True)
    weak_areas = db.Column(db.String(256), nullable=True)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)

class WrittenTest(db.Model):
    __tablename__ = 'written_tests'
    
    id = db.Column(db.Integer, primary_key=True)
    test_name = db.Column(db.String(200), nullable=False)
    subject = db.Column(db.String(80), nullable=False)
    test_type = db.Column(db.String(80), nullable=True, default='Unit Test')
    description = db.Column(db.Text, nullable=True)
    instructions = db.Column(db.Text, nullable=True)
    duration = db.Column(db.Integer, nullable=False) # in minutes
    total_marks = db.Column(db.Integer, nullable=False)
    start_date = db.Column(db.DateTime, nullable=True)
    end_date = db.Column(db.DateTime, nullable=True)
    question_paper_url = db.Column(db.String(256), nullable=False)
    question_paper_name = db.Column(db.String(256), nullable=True)
    is_bank = db.Column(db.Boolean, nullable=False, default=False)
    assignment_date = db.Column(db.Date, nullable=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=True)
    mentor_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    submissions = db.relationship('WrittenTestSubmission', backref='test', lazy=True, cascade="all, delete-orphan")

class WrittenTestSubmission(db.Model):
    __tablename__ = 'written_test_submissions'
    
    id = db.Column(db.Integer, primary_key=True)
    test_id = db.Column(db.Integer, db.ForeignKey('written_tests.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    answer_sheet_url = db.Column(db.String(256), nullable=False)
    submission_date = db.Column(db.DateTime, default=datetime.utcnow)
    marks_obtained = db.Column(db.Integer, nullable=True)
    remarks = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), nullable=False, default='Pending') # 'Pending' or 'Graded'
    graded_at = db.Column(db.DateTime, nullable=True)

class Achievement(db.Model):
    __tablename__ = 'achievements'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False) # e.g. 'Homework Hero', 'Quiz Master'
    description = db.Column(db.String(256), nullable=False)
    unlocked_at = db.Column(db.DateTime, default=datetime.utcnow)

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    content = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    notification_type = db.Column(db.String(50), nullable=False) # 'homework', 'quiz', 'test', 'result', etc.
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'
    
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    recipient_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=True)
    content = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class Attendance(db.Model):
    __tablename__ = 'attendance'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False)  # 'Present' or 'Absent'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('student_id', 'date', name='_student_date_uc'),)

