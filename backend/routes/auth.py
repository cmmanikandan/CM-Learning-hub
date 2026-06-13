import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import firebase_admin.auth as firebase_auth
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'student')  # 'mentor' or 'student'
    name = data.get('name')
    mentor_id = data.get('mentor_id')
    
    firebase_uid = data.get('firebase_uid')
    
    if not username or not email or not name:
        return jsonify({"message": "Missing required fields"}), 400
        
    if role not in ['mentor', 'student']:
        return jsonify({"message": "Invalid role"}), 400
        
    # Check if user already exists
    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({"message": "User with this username or email already exists"}), 400
        
    import uuid
    sid = f"SID-{str(uuid.uuid4())[:8].upper()}" if role == 'student' else None
    tid = f"TID-{str(uuid.uuid4())[:8].upper()}" if role == 'mentor' else None

    password_hash = generate_password_hash(password) if password else None
    new_user = User(
        username=username,
        email=email,
        password_hash=password_hash,
        firebase_uid=firebase_uid,
        role=role,
        name=name,
        sid=sid,
        tid=tid,
        mentor_id=mentor_id if role == 'student' else None,
        school=data.get('school'),
        class_name=data.get('class_name'),
        section=data.get('section'),
        parent_contact=data.get('parent_contact')
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({"message": "User registered successfully", "user_id": new_user.id}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    # Handles email or username for mentor/student
    identifier = data.get('email') or data.get('student_id') or data.get('username')
    password = data.get('password')
    
    if not identifier or not password:
        return jsonify({"message": "Missing login credentials"}), 400
        
    user = User.query.filter((User.email == identifier) | (User.username == identifier)).first()
    
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"message": "Invalid credentials"}), 401
        
    if user.role == 'student':
        from routes.homework import recalculate_student_streak
        recalculate_student_streak(user.id)
        
    # Generate JWT token with identity containing id and role
    access_token = create_access_token(identity=json.dumps({"id": user.id, "role": user.role}))
    
    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "name": user.name,
            "sid": user.sid,
            "tid": user.tid,
            "mentor_id": user.mentor_id,
            "school": user.school,
            "class_name": user.class_name,
            "section": user.section,
            "parent_contact": user.parent_contact,
            "photo_url": user.photo_url,
            "streak": user.streak if user.role == 'student' else 0
        }
    }), 200

@auth_bp.route('/firebase-login', methods=['POST'])
def firebase_login():
    data = request.get_json() or {}
    id_token = data.get('idToken')
    frontend_photo_url = data.get('photoUrl')
    
    if not id_token:
        return jsonify({"message": "Missing Firebase ID token"}), 400
        
    try:
        import firebase_admin
        print(f"DEBUG: Current Firebase Apps in auth.py: {firebase_admin._apps}", flush=True)
        
        decoded_token = firebase_auth.verify_id_token(id_token, clock_skew_seconds=10)
        uid = decoded_token['uid']
        email = decoded_token.get('email')
        
        user = User.query.filter((User.firebase_uid == uid) | (User.email == email)).first()
        
        if not user:
            import uuid
            role = 'student'
            sid = f"SID-{str(uuid.uuid4())[:8].upper()}"
            base_username = email.split('@')[0] if email else 'user'
            username = f"{base_username}{str(uuid.uuid4().int)[:4]}"
            name = decoded_token.get('name', base_username)
            
            user = User(
                username=username,
                email=email,
                firebase_uid=uid,
                role=role,
                name=name,
                sid=sid,
                photo_url=decoded_token.get('picture')
            )
            db.session.add(user)
            db.session.commit()
            
        # Update missing firebase_uid if matched by email
        if not user.firebase_uid:
            user.firebase_uid = uid
            db.session.commit()
            
        # Update photo_url if it exists in token or frontend but not in db
        picture = decoded_token.get('picture') or frontend_photo_url
        if picture and not user.photo_url:
            user.photo_url = picture
            db.session.commit()
            
        # Also always update the photo_url if the user just logged in with google and we have a new picture
        if picture and user.photo_url != picture:
            # We only overwrite if it's a google image or if it's missing
            if not user.photo_url or 'googleusercontent.com' in user.photo_url or 'ui-avatars' in user.photo_url:
                user.photo_url = picture
                db.session.commit()
            
        if user.role == 'student':
            from routes.homework import recalculate_student_streak
            recalculate_student_streak(user.id)
            
        access_token = create_access_token(identity=json.dumps({"id": user.id, "role": user.role}))
        
        return jsonify({
            "message": "Login successful",
            "access_token": access_token,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "name": user.name,
                "sid": user.sid,
                "tid": user.tid,
                "mentor_id": user.mentor_id,
                "school": user.school,
                "class_name": user.class_name,
                "section": user.section,
                "parent_contact": user.parent_contact,
                "photo_url": user.photo_url,
                "streak": user.streak if user.role == 'student' else 0
            }
        }), 200
        
    except Exception as e:
        return jsonify({"message": f"Firebase verification failed: {str(e)}"}), 401

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user = json.loads(get_jwt_identity())
    user = User.query.get(current_user['id'])
    
    if not user:
        return jsonify({"message": "User not found"}), 404
        
    if user.role == 'student':
        from routes.homework import recalculate_student_streak
        recalculate_student_streak(user.id)
        
    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "name": user.name,
        "sid": user.sid,
        "tid": user.tid,
        "mentor_id": user.mentor_id,
        "school": user.school,
        "class_name": user.class_name,
        "section": user.section,
        "parent_contact": user.parent_contact,
        "photo_url": user.photo_url,
        "streak": user.streak if user.role == 'student' else 0,
        "mentor_notes": user.mentor_notes
    }), 200

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    current_user = json.loads(get_jwt_identity())
    user = User.query.get(current_user['id'])
    
    if not user:
        return jsonify({"message": "User not found"}), 404
        
    data = request.get_json() or {}
    old_password = data.get('old_password')
    new_password = data.get('new_password')
    
    if not old_password or not new_password:
        return jsonify({"message": "Missing password details"}), 400
        
    if not check_password_hash(user.password_hash, old_password):
        return jsonify({"message": "Incorrect current password"}), 401
        
    user.password_hash = generate_password_hash(new_password)
    db.session.commit()
    
    return jsonify({"message": "Password updated successfully"}), 200
