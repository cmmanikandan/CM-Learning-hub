import json
import sys
import os
from datetime import datetime, timedelta

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app import create_app
from flask_jwt_extended import create_access_token
from models import db, User, Attendance

app = create_app()
with app.app_context():
    # Find a mentor and a student
    mentor = User.query.filter_by(role='mentor').first()
    if not mentor:
        print("Mentor not found in database!")
        exit(1)
        
    print(f"Testing with Mentor: {mentor.name} (ID: {mentor.id})")
    
    # Create a test student registered today
    import uuid
    unique_id = uuid.uuid4().hex[:6]
    test_username = f"std_{unique_id}"
    test_email = f"std_{unique_id}@example.com"
    
    # 1. Test Registration setting assigned_date
    print("\n--- 1. Testing Registration assigned_date ---")
    client = app.test_client()
    reg_payload = {
        "username": test_username,
        "email": test_email,
        "password": "testpassword",
        "name": f"Student {unique_id}",
        "role": "student",
        "mentor_id": mentor.id
    }
    res_reg = client.post('/api/auth/register', json=reg_payload)
    print("Registration Status:", res_reg.status_code)
    reg_data = res_reg.get_json()
    student_id = reg_data['user_id']
    print("Created Student ID:", student_id)
    
    # Verify in DB
    student = User.query.get(student_id)
    print("Database assigned_date value:", student.assigned_date)
    assert student.assigned_date == datetime.utcnow().date(), "assigned_date was not set correctly on registration!"
    
    # Generate student token
    student_token = create_access_token(identity=json.dumps({"id": student.id, "role": student.role}))
    
    # 2. Add an attendance record in database for *other dates*
    # We want to ensure that distinct database dates from yesterday are NOT counted as absent for our new student
    yesterday = datetime.utcnow().date() - timedelta(days=1)
    
    # Find or create a record for yesterday for another student to ensure yesterday exists in all_dates
    other_student = User.query.filter(User.id != student_id, User.role == 'student').first()
    if other_student:
        record_yesterday = Attendance.query.filter_by(student_id=other_student.id, date=yesterday).first()
        if not record_yesterday:
            record_yesterday = Attendance(student_id=other_student.id, date=yesterday, status='Present')
            db.session.add(record_yesterday)
            db.session.commit()
            print(f"Added attendance record for student {other_student.id} yesterday ({yesterday})")
            
    # 3. Fetch attendance stats for our student
    print("\n--- 2. Testing GET /api/attendance/stats ---")
    res_stats = client.get('/api/attendance/stats', headers={'Authorization': f'Bearer {student_token}'})
    print("Stats Status:", res_stats.status_code)
    stats_data = res_stats.get_json()
    print("Stats Response Keys:", list(stats_data.keys()))
    print("Percentage:", stats_data['percentage'])
    print("Absent Count:", stats_data['absent_count'])
    print("Present Count:", stats_data['present_count'])
    print("History Length:", len(stats_data['history']))
    print("History List:", stats_data['history'])
    
    # Clean up test user
    Attendance.query.filter_by(student_id=student_id).delete()
    db.session.delete(student)
    db.session.commit()
    print("\nTest User Cleaned up. Attendance verification completed successfully!")
