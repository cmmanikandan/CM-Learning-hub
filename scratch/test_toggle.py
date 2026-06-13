import os
import sys
import json
from dotenv import load_dotenv

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

from app import create_app
from models import db, Homework, User, Notification

app = create_app()

# Test PUT /api/homework/<id> as student
with app.app_context():
    # Let's get the first homework
    hw = Homework.query.first()
    if not hw:
        print("No homework found to toggle!")
        sys.exit(0)
        
    print(f"Testing toggle on Homework ID: {hw.id}, Title: {hw.title}, Current Status: {hw.status}")
    
    # We will test update_homework logic manually or simulate it with test_client
    client = app.test_client()
    
    # Create a mock JWT token for student ID 4
    from flask_jwt_extended import create_access_token
    
    # In routes/homework.py, it calls json.loads(get_jwt_identity())
    # So the identity passed to create_access_token must be a JSON-serializable string
    identity_str = json.dumps({"id": 4, "role": "student", "username": "teamnexora232672"})
    token = create_access_token(identity=identity_str)
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Let's toggle to Completed
    print("Toggling status to Completed...")
    response = client.put(f'/api/homework/{hw.id}', headers=headers, json={"status": "Completed"})
    print("Response Status:", response.status_code)
    print("Response JSON:", response.get_json())
    
    # Query db again to see if status updated
    db.session.expire_all()
    hw_after = Homework.query.get(hw.id)
    print("After toggle, status is:", hw_after.status)
    
    # Let's toggle back to Pending
    print("Toggling status back to Pending...")
    response = client.put(f'/api/homework/{hw.id}', headers=headers, json={"status": "Pending"})
    print("Response Status:", response.status_code)
    print("Response JSON:", response.get_json())
