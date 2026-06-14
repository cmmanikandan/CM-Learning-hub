import os
from werkzeug.utils import secure_filename
from flask import Blueprint, request, jsonify, current_app, url_for
from flask_jwt_extended import jwt_required, get_jwt_identity
import json
from models import db, User

users_bp = Blueprint('users', __name__)

@users_bp.route('/mentors', methods=['GET'])
def get_mentors():
    mentors = User.query.filter_by(role='mentor').all()
    mentor_list = [
        {
            "id": m.id,
            "tid": m.tid,
            "name": m.name,
            "email": m.email,
            "photo_url": m.photo_url
        } for m in mentors
    ]
    return jsonify(mentor_list), 200

@users_bp.route('/my-students', methods=['GET'])
@jwt_required()
def get_my_students():
    current_user = json.loads(get_jwt_identity())
    if current_user['role'] != 'mentor':
        return jsonify({"message": "Unauthorized"}), 403
        
    students = User.query.filter_by(mentor_id=current_user['id']).all()
    from routes.homework import recalculate_student_streak
    student_list = []
    for s in students:
        recalculate_student_streak(s.id)
        student_list.append({
            "id": s.id,
            "sid": s.sid,
            "name": s.name,
            "email": s.email,
            "class_name": s.class_name,
            "section": s.section,
            "photo_url": s.photo_url,
            "mentor_notes": s.mentor_notes,
            "streak": s.streak
        })
    return jsonify(student_list), 200

@users_bp.route('/<int:student_id>/mentor-notes', methods=['PUT'])
@jwt_required()
def update_mentor_notes(student_id):
    current_user = json.loads(get_jwt_identity())
    if current_user['role'] != 'mentor':
        return jsonify({"message": "Unauthorized"}), 403
        
    student = User.query.filter_by(id=student_id, mentor_id=current_user['id']).first()
    if not student:
        return jsonify({"message": "Student not found or not assigned to you"}), 404
        
    data = request.get_json() or {}
    notes = data.get('notes', '')
    
    student.mentor_notes = notes
    db.session.commit()
    
    return jsonify({"message": "Notes updated successfully", "mentor_notes": notes}), 200

@users_bp.route('/<int:student_id>/remove-student', methods=['POST'])
@jwt_required()
def remove_student(student_id):
    current_user = json.loads(get_jwt_identity())
    if current_user['role'] != 'mentor':
        return jsonify({"message": "Unauthorized"}), 403
        
    student = User.query.filter_by(id=student_id, mentor_id=current_user['id']).first()
    if not student:
        return jsonify({"message": "Student not found or not assigned to you"}), 404
        
    student.mentor_id = None
    student.assigned_date = None
    db.session.commit()
    
    return jsonify({"message": "Student removed successfully"}), 200

@users_bp.route('/change-mentor', methods=['POST'])
@jwt_required()
def change_mentor():
    current_user = json.loads(get_jwt_identity())
    if current_user['role'] != 'student':
        return jsonify({"message": "Unauthorized"}), 403
        
    data = request.get_json() or {}
    new_mentor_id = data.get('mentor_id')
    
    if not new_mentor_id:
        return jsonify({"message": "Mentor ID required"}), 400
        
    try:
        new_mentor_id = int(new_mentor_id)
    except ValueError:
        return jsonify({"message": "Invalid mentor ID"}), 400
        
    mentor = User.query.filter_by(id=new_mentor_id, role='mentor').first()
    if not mentor:
        return jsonify({"message": "Invalid mentor selected"}), 400
        
    user = User.query.get(current_user['id'])
    user.mentor_id = new_mentor_id
    from datetime import datetime
    user.assigned_date = datetime.utcnow().date()
    db.session.commit()
    
    return jsonify({"message": "Mentor assigned successfully", "mentor": {"id": mentor.id, "name": mentor.name}}), 200

@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user = json.loads(get_jwt_identity())
    user = User.query.get(current_user['id'])
    
    if not user:
        return jsonify({"message": "User not found"}), 404
        
    data = request.get_json() or {}
    
    if 'name' in data: user.name = data['name']
    if 'school' in data: user.school = data['school']
    if 'class_name' in data: user.class_name = data['class_name']
    if 'section' in data: user.section = data['section']
    if 'parent_contact' in data: user.parent_contact = data['parent_contact']
    
    db.session.commit()
    
    return jsonify({
        "message": "Profile updated successfully",
        "user": {
            "id": user.id,
            "name": user.name,
            "school": user.school,
            "class_name": user.class_name,
            "section": user.section,
            "parent_contact": user.parent_contact,
            "photo_url": user.photo_url
        }
    }), 200

@users_bp.route('/upload-photo', methods=['POST'])
@jwt_required()
def upload_photo():
    current_user = json.loads(get_jwt_identity())
    user = User.query.get(current_user['id'])
    
    if not user:
        return jsonify({"message": "User not found"}), 404
        
    if 'photo' not in request.files:
        return jsonify({"message": "No file part"}), 400
        
    file = request.files['photo']
    if file.filename == '':
        return jsonify({"message": "No selected file"}), 400
        
    if file:
        filename = secure_filename(file.filename)
        import uuid
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        
        upload_folder = os.path.join(current_app.root_path, 'static', 'uploads')
        os.makedirs(upload_folder, exist_ok=True)
        
        filepath = os.path.join(upload_folder, unique_filename)
        file.save(filepath)
        
        photo_url = f"http://localhost:5000/static/uploads/{unique_filename}"
        
        user.photo_url = photo_url
        db.session.commit()
        
        return jsonify({
            "message": "Photo uploaded successfully",
            "photo_url": photo_url
        }), 200

@users_bp.route('/leaderboard', methods=['GET'])
@jwt_required()
def get_leaderboard():
    class_name = request.args.get('class_name')
    if class_name:
        students = User.query.filter_by(role='student', class_name=class_name).all()
    else:
        students = User.query.filter_by(role='student').all()
        
    from routes.homework import recalculate_student_streak
    leaderboard_data = []
    
    for s in students:
        recalculate_student_streak(s.id)
        badge_count = len(s.achievements) if hasattr(s, 'achievements') else 0
        leaderboard_data.append({
            "id": s.id,
            "name": s.name,
            "class_name": s.class_name or "Grade 10",
            "section": s.section or "A",
            "photo_url": s.photo_url,
            "streak": s.streak,
            "badge_count": badge_count,
            "achievements": [{"name": a.name, "description": a.description} for a in s.achievements] if hasattr(s, 'achievements') else []
        })
        
    leaderboard_data.sort(key=lambda x: x['streak'], reverse=True)
    return jsonify(leaderboard_data), 200

