import json
from app import create_app
from flask_jwt_extended import create_access_token
from models import db, User

app = create_app()
with app.app_context():
    # Find dharnish
    dharnish = User.query.filter_by(username='dharnish').first()
    if not dharnish:
        print("dharnish not found")
        exit()
        
    print(f"Testing for mentor: {dharnish.name} (ID: {dharnish.id})")
    
    # Generate token
    token = create_access_token(identity=json.dumps({"id": dharnish.id, "role": dharnish.role}))
    
    # Test client
    client = app.test_client()
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    # Fetch attendance
    res = client.get('/api/attendance', headers=headers)
    print("GET /api/attendance status:", res.status_code)
    print("GET /api/attendance response:", res.get_json())
