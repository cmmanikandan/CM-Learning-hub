import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Attendance, User
from datetime import datetime

attendance_bp = Blueprint('attendance', __name__)

@attendance_bp.route('', methods=['GET'])
@jwt_required()
def get_attendance():
    identity = json.loads(get_jwt_identity())
    if identity['role'] != 'mentor':
        return jsonify({"message": "Unauthorized: Only mentors can view/mark attendance"}), 403

    date_str = request.args.get('date')
    if not date_str:
        date_obj = datetime.utcnow().date()
    else:
        try:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"message": "Invalid date format. Use YYYY-MM-DD"}), 400

    # Get mentor's students
    students = User.query.filter_by(mentor_id=identity['id'], role='student').all()
    student_ids = [s.id for s in students]

    # Get attendance for these students on the given date
    attendance_records = Attendance.query.filter(
        Attendance.student_id.in_(student_ids),
        Attendance.date == date_obj
    ).all()

    attendance_map = {r.student_id: r.status for r in attendance_records}
    today = datetime.utcnow().date()
    is_past = date_obj < today

    result = []
    for s in students:
        status = attendance_map.get(s.id)
        if not status:
            if s.assigned_date and date_obj < s.assigned_date:
                status = 'N/A'
            else:
                status = 'Absent' if is_past else 'N/A'
        result.append({
            "student_id": s.id,
            "student_name": s.name,
            "student_email": s.email,
            "sid": s.sid,
            "class_name": s.class_name,
            "section": s.section,
            "photo_url": s.photo_url,
            "status": status
        })

    return jsonify(result), 200

@attendance_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_attendance_stats():
    identity = json.loads(get_jwt_identity())
    role = identity['role']
    user_id = identity['id']

    if role == 'mentor':
        student_id = request.args.get('student_id')
        if not student_id:
            return jsonify({"message": "student_id parameter is required for mentors"}), 400
        student = User.query.filter_by(id=student_id, mentor_id=user_id, role='student').first()
        if not student:
            return jsonify({"message": "Student not found or not assigned to you"}), 404
    else:
        student_id = user_id
        student = User.query.get(student_id)

    assigned_date = student.assigned_date if student else None

    # Get distinct attendance dates
    all_dates_records = db.session.query(Attendance.date).distinct().all()
    all_dates = [d[0] for d in all_dates_records if d[0] is not None]

    # Get student's records
    student_records = Attendance.query.filter_by(student_id=student_id).all()
    record_map = {r.date: r.status for r in student_records}

    today = datetime.utcnow().date()

    for r in student_records:
        if r.date not in all_dates:
            all_dates.append(r.date)

    if not all_dates:
        all_dates = [today]

    present_count = 0
    absent_count = 0
    history = []

    for dt in sorted(all_dates):
        if dt > today:
            continue
        if assigned_date and dt < assigned_date:
            continue

        status = record_map.get(dt)
        if not status:
            status = 'Absent' if dt < today else 'N/A'

        if status == 'Present':
            present_count += 1
        elif status == 'Absent':
            absent_count += 1

        history.append({
            "date": dt.strftime('%Y-%m-%d'),
            "status": status
        })

    total_days = present_count + absent_count
    percentage = (present_count / total_days * 100) if total_days > 0 else 100.0

    return jsonify({
        "student_id": student_id,
        "present_count": present_count,
        "absent_count": absent_count,
        "total_days": total_days,
        "percentage": round(percentage, 1),
        "history": history
    }), 200

@attendance_bp.route('', methods=['POST'])
@jwt_required()
def mark_attendance():
    identity = json.loads(get_jwt_identity())
    if identity['role'] != 'mentor':
        return jsonify({"message": "Unauthorized: Only mentors can mark attendance"}), 403

    data = request.get_json() or {}
    date_str = data.get('date')
    student_id = data.get('student_id')
    status = data.get('status')  # 'Present' or 'Absent'

    if not date_str or not student_id or not status:
        return jsonify({"message": "Missing required fields: date, student_id, status"}), 400

    if status not in ['Present', 'Absent']:
        return jsonify({"message": "Invalid status. Must be 'Present' or 'Absent'"}), 400

    try:
        date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({"message": "Invalid date format. Use YYYY-MM-DD"}), 400

    # Check if student is assigned to this mentor
    student = User.query.filter_by(id=student_id, mentor_id=identity['id'], role='student').first()
    if not student:
        return jsonify({"message": "Student not found or not assigned to you"}), 404

    # Upsert attendance record
    record = Attendance.query.filter_by(student_id=student_id, date=date_obj).first()
    if record:
        record.status = status
    else:
        record = Attendance(
            student_id=student_id,
            date=date_obj,
            status=status
        )
        db.session.add(record)

    db.session.commit()
    return jsonify({"message": "Attendance marked successfully", "student_id": student_id, "status": status}), 200
