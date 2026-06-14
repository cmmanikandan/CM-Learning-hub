import json
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app import create_app
from flask_jwt_extended import create_access_token
from models import db, User, Quiz, Question

app = create_app()
with app.app_context():
    # Find a mentor (dharnish) and a student
    mentor = User.query.filter_by(role='mentor').first()
    student = User.query.filter_by(role='student').first()
    
    if not mentor or not student:
        print("Required users not found. Make sure database is seeded.")
        exit(1)
        
    print(f"Testing with Mentor: {mentor.name} (ID: {mentor.id}) and Student: {student.name} (ID: {student.id})")
    
    # Generate token
    mentor_token = create_access_token(identity=json.dumps({"id": mentor.id, "role": mentor.role}))
    student_token = create_access_token(identity=json.dumps({"id": student.id, "role": student.role}))
    
    client = app.test_client()
    
    # 1. Create a quiz template in bank
    print("\n--- 1. Testing POST /api/quiz (Create Bank Quiz) ---")
    quiz_payload = {
        "quiz_name": "Test Python Chemistry",
        "subject": "Chemistry",
        "chapter": "Chapter 1",
        "lesson": "Lesson 1",
        "difficulty": "Easy",
        "instructions": "Answer all questions.",
        "time_limit": 15,
        "passing_marks": 50,
        "is_bank": True,
        "questions": [
            {
                "question_type": "mcq",
                "question_text": "What is the formula of water?",
                "options": ["H2O", "CO2", "NaCl", "O2"],
                "correct_answer": "H2O",
                "explanation": "H2O represents water.",
                "marks": 1
            }
        ]
    }
    res_create = client.post('/api/quiz', headers={'Authorization': f'Bearer {mentor_token}'}, json=quiz_payload)
    print("Create Bank Quiz Status:", res_create.status_code)
    create_data = res_create.get_json()
    bank_quiz_id = create_data['id']
    print("Bank Quiz Created ID:", bank_quiz_id)
        
    # 2. Assign the bank quiz to the student
    print("\n--- 2. Testing POST /api/quiz/assign (Assign Quiz) ---")
    assign_payload = {
        "quiz_id": bank_quiz_id,
        "assignment_date": "2026-06-14",
        "student_ids": [student.id]
    }
    res_assign = client.post('/api/quiz/assign', headers={'Authorization': f'Bearer {mentor_token}'}, json=assign_payload)
    print("Assign Quiz Status:", res_assign.status_code)
    assign_data = res_assign.get_json()
    assigned_quiz_id = assign_data['id']
    print("Assigned (Cloned) Quiz ID:", assigned_quiz_id)

    # 3. Get Assigned Quiz details
    print(f"\n--- 3. Testing GET /api/quiz/{assigned_quiz_id} ---")
    res_details = client.get(f'/api/quiz/{assigned_quiz_id}', headers={'Authorization': f'Bearer {student_token}'})
    print("Student Get Details Status:", res_details.status_code)
    details_data = res_details.get_json()
    print("Quiz Details Keys:", list(details_data.keys()))
    print("Questions count:", len(details_data.get('questions', [])))
    if len(details_data.get('questions', [])) > 0:
        print("First Question:", details_data['questions'][0])
        question_id = details_data['questions'][0]['id']
    else:
        print("Error: No questions found!")
        exit(1)

    # 4. Submit Cloned Quiz
    print(f"\n--- 4. Testing POST /api/quiz/{assigned_quiz_id}/submit ---")
    submit_payload = {
        "answers": {
            str(question_id): "H2O"
        },
        "time_taken": 12,
        "strong_areas": "None",
        "weak_areas": "None"
    }
    res_submit = client.post(f'/api/quiz/{assigned_quiz_id}/submit', headers={'Authorization': f'Bearer {student_token}'}, json=submit_payload)
    print("Submit Status:", res_submit.status_code)
    submit_data = res_submit.get_json()
    print("Submit Response:", submit_data)
    
    print("\nAPI Verification completed successfully!")
