import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash
from models import db, User, LibraryMaterial, Quiz, WrittenTest, Homework, QuizSubmission, Attendance
from datetime import datetime, timedelta
import random
import string

admin_bp = Blueprint('admin', __name__)

def is_admin(identity):
    """Check if the identity dict belongs to an admin, or look up by id if it's an int."""
    if isinstance(identity, dict):
        uid = identity.get('id')
    else:
        uid = identity
    user = User.query.get(uid)
    return user and user.role == 'admin'


def get_identity():
    raw = get_jwt_identity()
    if isinstance(raw, str):
        return json.loads(raw)
    return raw


# ── GET /api/admin/users ──────────────────────────────────────────────────
@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    identity = get_identity()
    if not is_admin(identity):
        return jsonify({"message": "Unauthorized"}), 403

    users = User.query.all()
    # Pre-build mentor lookup dict to avoid N+1 queries
    mentor_lookup = {u.id: u.name for u in users if u.role == 'mentor'}
    
    mentors = []
    students = []
    admins = []

    for u in users:
        user_data = {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "name": u.name,
            "role": u.role,
            "sid": u.sid,
            "tid": u.tid,
            "mentor_id": u.mentor_id,
            "school": u.school,
            "class_name": u.class_name,
            "section": u.section,
            "parent_contact": u.parent_contact,
            "streak": u.streak if u.role == 'student' else 0,
            "photo_url": u.photo_url,
            "created_at": u.id,  # approximate order
        }
        if u.role == 'mentor':
            user_data['student_count'] = len(u.students_assigned)
            mentors.append(user_data)
        elif u.role == 'student':
            user_data['mentor_name'] = mentor_lookup.get(u.mentor_id, "Unassigned") if u.mentor_id else "Unassigned"
            students.append(user_data)
        elif u.role == 'admin':
            admins.append(user_data)

    return jsonify({
        "mentors": mentors,
        "students": students,
        "admins": admins,
        "stats": {
            "total_mentors": len(mentors),
            "total_students": len(students),
            "total_admins": len(admins),
            "total_users": len(users)
        }
    }), 200


# ── GET /api/admin/stats ──────────────────────────────────────────────────
@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_platform_stats():
    identity = get_identity()
    if not is_admin(identity):
        return jsonify({"message": "Unauthorized"}), 403

    total_users = User.query.count()
    total_mentors = User.query.filter_by(role='mentor').count()
    total_students = User.query.filter_by(role='student').count()
    total_library = LibraryMaterial.query.count()
    total_quizzes = Quiz.query.filter_by(is_bank=False).count()
    total_tests = WrittenTest.query.filter_by(is_bank=False).count()
    total_homework = Homework.query.count()
    total_submissions = QuizSubmission.query.count()

    # Unassigned students
    unassigned_students = User.query.filter_by(role='student', mentor_id=None).count()

    # Recent users (last 5 by id desc)
    recent_users = User.query.order_by(User.id.desc()).limit(5).all()
    recent_list = [{
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "role": u.role,
        "photo_url": u.photo_url,
    } for u in recent_users]

    return jsonify({
        "total_users": total_users,
        "total_mentors": total_mentors,
        "total_students": total_students,
        "total_library": total_library,
        "total_quizzes": total_quizzes,
        "total_tests": total_tests,
        "total_homework": total_homework,
        "total_submissions": total_submissions,
        "unassigned_students": unassigned_students,
        "recent_users": recent_list,
    }), 200


# ── POST /api/admin/users/create ─────────────────────────────────────────
@admin_bp.route('/users/create', methods=['POST'])
@jwt_required()
def create_user():
    identity = get_identity()
    if not is_admin(identity):
        return jsonify({"message": "Unauthorized"}), 403

    data = request.get_json() or {}
    role = data.get('role', 'student')
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    username = data.get('username', '').strip().lower()
    password = data.get('password', '')

    if not name or not email or not password:
        return jsonify({"message": "name, email and password are required"}), 400

    # Auto-generate username from email if not provided
    if not username:
        base = email.split('@')[0].replace('.', '_').replace('-', '_')
        username = base

    # Ensure uniqueness
    if User.query.filter_by(email=email).first():
        return jsonify({"message": f"Email '{email}' is already in use."}), 409
    if User.query.filter_by(username=username).first():
        # append random suffix
        username = username + '_' + ''.join(random.choices(string.digits, k=4))

    # Generate SID / TID
    sid = None
    tid = None
    if role == 'student':
        sid = data.get('sid') or f"S{random.randint(1000, 9999)}"
        while User.query.filter_by(sid=sid).first():
            sid = f"S{random.randint(1000, 9999)}"
    elif role == 'mentor':
        tid = data.get('tid') or f"T{random.randint(1000, 9999)}"
        while User.query.filter_by(tid=tid).first():
            tid = f"T{random.randint(1000, 9999)}"

    new_user = User(
        username=username,
        email=email,
        password_hash=generate_password_hash(password),
        role=role,
        name=name,
        school=data.get('school'),
        class_name=data.get('class_name'),
        section=data.get('section'),
        parent_contact=data.get('parent_contact'),
        mentor_id=data.get('mentor_id') if role == 'student' else None,
        sid=sid,
        tid=tid,
        streak=0,
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({
        "message": f"User '{name}' created successfully.",
        "id": new_user.id,
        "username": new_user.username,
        "sid": new_user.sid,
        "tid": new_user.tid,
    }), 201


# ── PUT /api/admin/users/<id> ─────────────────────────────────────────────
@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def edit_user(user_id):
    identity = get_identity()
    if not is_admin(identity):
        return jsonify({"message": "Unauthorized"}), 403

    user = User.query.get_or_404(user_id)
    data = request.get_json() or {}

    if 'name' in data and data['name'].strip():
        user.name = data['name'].strip()
    if 'email' in data and data['email'].strip():
        new_email = data['email'].strip().lower()
        existing = User.query.filter_by(email=new_email).first()
        if existing and existing.id != user_id:
            return jsonify({"message": "Email already in use."}), 409
        user.email = new_email
    if 'school' in data:
        user.school = data['school']
    if 'class_name' in data:
        user.class_name = data['class_name']
    if 'section' in data:
        user.section = data['section']
    if 'parent_contact' in data:
        user.parent_contact = data['parent_contact']
    if 'mentor_id' in data:
        user.mentor_id = data['mentor_id'] if data['mentor_id'] else None
    if 'sid' in data and data['sid']:
        existing = User.query.filter_by(sid=data['sid']).first()
        if not existing or existing.id == user_id:
            user.sid = data['sid']
    if 'tid' in data and data['tid']:
        existing = User.query.filter_by(tid=data['tid']).first()
        if not existing or existing.id == user_id:
            user.tid = data['tid']

    db.session.commit()
    return jsonify({"message": f"User '{user.name}' updated successfully."}), 200


# ── POST /api/admin/users/<id>/reset-password ─────────────────────────────
@admin_bp.route('/users/<int:user_id>/reset-password', methods=['POST'])
@jwt_required()
def reset_password(user_id):
    identity = get_identity()
    if not is_admin(identity):
        return jsonify({"message": "Unauthorized"}), 403

    user = User.query.get_or_404(user_id)
    data = request.get_json() or {}
    new_password = data.get('new_password', '')

    if not new_password or len(new_password) < 6:
        return jsonify({"message": "Password must be at least 6 characters."}), 400

    user.password_hash = generate_password_hash(new_password)
    db.session.commit()
    return jsonify({"message": f"Password for '{user.name}' has been reset successfully."}), 200


# ── DELETE /api/admin/users/<id> ─────────────────────────────────────────
@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    identity = get_identity()
    if not is_admin(identity):
        return jsonify({"message": "Unauthorized"}), 403

    user_to_delete = User.query.get_or_404(user_id)
    if user_to_delete.role == 'admin':
        return jsonify({"message": "Cannot delete admin account."}), 400

    db.session.delete(user_to_delete)
    db.session.commit()
    return jsonify({"message": f"User '{user_to_delete.name}' deleted successfully."}), 200


# ── POST /api/admin/reassign ──────────────────────────────────────────────
@admin_bp.route('/reassign', methods=['POST'])
@jwt_required()
def reassign_student():
    identity = get_identity()
    if not is_admin(identity):
        return jsonify({"message": "Unauthorized"}), 403

    data = request.get_json() or {}
    student_id = data.get('student_id')
    new_mentor_id = data.get('mentor_id')

    if not student_id:
        return jsonify({"message": "student_id is required"}), 400

    student = User.query.get_or_404(student_id)
    if student.role != 'student':
        return jsonify({"message": "Target user is not a student."}), 400

    if new_mentor_id:
        mentor = User.query.get_or_404(new_mentor_id)
        if mentor.role != 'mentor':
            return jsonify({"message": "Target mentor is not a mentor."}), 400
        student.mentor_id = mentor.id
        msg = f"Student '{student.name}' reassigned to '{mentor.name}'."
    else:
        student.mentor_id = None
        msg = f"Student '{student.name}' unassigned from mentor."

    db.session.commit()
    return jsonify({"message": msg}), 200
