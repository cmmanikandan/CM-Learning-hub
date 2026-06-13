import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Achievement, User

achievements_bp = Blueprint('achievements', __name__)

@achievements_bp.route('', methods=['GET'])
@jwt_required()
def get_achievements():
    current_user = json.loads(get_jwt_identity())
    
    achievements = Achievement.query.filter_by(student_id=current_user['id']).order_by(Achievement.unlocked_at.desc()).all()
    
    result = []
    for ach in achievements:
        # We parse an icon from description or default to 🏆
        # In a full implementation, we'd add an icon field to the DB.
        result.append({
            "id": f"ach{ach.id}",
            "name": ach.name,
            "description": ach.description,
            "icon": "🏆", 
            "unlockedAt": ach.unlocked_at.isoformat()
        })
        
    return jsonify(result), 200

@achievements_bp.route('', methods=['POST'])
@jwt_required()
def unlock_achievement():
    current_user = json.loads(get_jwt_identity())
    data = request.get_json() or {}
    
    name = data.get('name')
    description = data.get('description')
    
    if not name or not description:
        return jsonify({"message": "Missing fields"}), 400
        
    # Check if already unlocked
    existing = Achievement.query.filter_by(student_id=current_user['id'], name=name).first()
    if existing:
        return jsonify({"message": "Already unlocked"}), 200
        
    new_ach = Achievement(
        student_id=current_user['id'],
        name=name,
        description=description
    )
    db.session.add(new_ach)
    db.session.commit()
    
    return jsonify({"message": "Achievement unlocked", "id": new_ach.id}), 201

@achievements_bp.route('/student/<int:student_id>', methods=['GET'])
@jwt_required()
def get_student_achievements(student_id):
    identity = json.loads(get_jwt_identity())
    if identity['role'] != 'mentor':
        return jsonify({"message": "Unauthorized"}), 403
        
    achievements = Achievement.query.filter_by(student_id=student_id).order_by(Achievement.unlocked_at.desc()).all()
    
    result = []
    for ach in achievements:
        result.append({
            "id": f"ach{ach.id}",
            "name": ach.name,
            "description": ach.description,
            "icon": "🏆", 
            "unlockedAt": ach.unlocked_at.isoformat()
        })
        
    return jsonify(result), 200

