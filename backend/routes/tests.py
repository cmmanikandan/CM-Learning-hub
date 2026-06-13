import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, WrittenTest, WrittenTestSubmission, Notification
from datetime import datetime

tests_bp = Blueprint('tests', __name__)

@tests_bp.route('', methods=['GET'])
@jwt_required()
def get_written_tests():
    tests = WrittenTest.query.filter_by(is_bank=False).order_by(WrittenTest.created_at.desc()).all()
    
    result = []
    for t in tests:
        result.append({
            "id": t.id,
            "test_name": t.test_name,
            "subject": t.subject,
            "test_type": t.test_type,
            "description": t.description,
            "instructions": t.instructions,
            "duration": t.duration,
            "total_marks": t.total_marks,
            "start_date": t.start_date.isoformat() if t.start_date else None,
            "end_date": t.end_date.isoformat() if t.end_date else None,
            "question_paper_url": t.question_paper_url,
            "question_paper_name": t.question_paper_name,
            "created_at": t.created_at.isoformat()
        })
        
    return jsonify(result), 200

@tests_bp.route('/bank', methods=['GET'])
@jwt_required()
def get_written_test_bank():
    tests = WrittenTest.query.filter_by(is_bank=True).order_by(WrittenTest.created_at.desc()).all()
    
    result = []
    for t in tests:
        result.append({
            "id": t.id,
            "test_name": t.test_name,
            "subject": t.subject,
            "test_type": t.test_type,
            "description": t.description,
            "instructions": t.instructions,
            "duration": t.duration,
            "total_marks": t.total_marks,
            "start_date": t.start_date.isoformat() if t.start_date else None,
            "end_date": t.end_date.isoformat() if t.end_date else None,
            "question_paper_url": t.question_paper_url,
            "question_paper_name": t.question_paper_name,
            "created_at": t.created_at.isoformat()
        })
        
    return jsonify(result), 200

@tests_bp.route('', methods=['POST'])
@jwt_required()
def create_test():
    identity = json.loads(get_jwt_identity())
    if identity['role'] != 'mentor':
        return jsonify({"message": "Unauthorized"}), 403
        
    data = request.get_json() or {}
    test_name = data.get('test_name')
    subject = data.get('subject')
    question_paper_url = data.get('question_paper_url')
    
    if not test_name or not subject or not question_paper_url:
        return jsonify({"message": "Missing required test parameters"}), 400
        
    start_date = datetime.fromisoformat(data.get('start_date')) if data.get('start_date') else None
    end_date = datetime.fromisoformat(data.get('end_date')) if data.get('end_date') else None
    is_bank = data.get('is_bank', False)
    
    new_test = WrittenTest(
        test_name=test_name,
        subject=subject,
        test_type=data.get('test_type', 'Unit Test'),
        description=data.get('description'),
        instructions=data.get('instructions'),
        duration=int(data.get('duration', 60)),
        total_marks=int(data.get('total_marks', 100)),
        start_date=start_date,
        end_date=end_date,
        question_paper_url=question_paper_url,
        question_paper_name=data.get('question_paper_name', 'paper.pdf'),
        is_bank=is_bank
    )
    
    db.session.add(new_test)
    db.session.commit()
    
    # Notify student
    if not is_bank:
        from models import User
        student = User.query.filter_by(role='student').first()
        if student:
            notif = Notification(
                user_id=student.id,
                title="Written Test Scheduled",
                content=f"A new written test '{new_test.test_name}' has been scheduled for {new_test.subject}",
                notification_type="test"
            )
            db.session.add(notif)
            db.session.commit()
        
    return jsonify({"message": "Written test created successfully", "id": new_test.id}), 201

@tests_bp.route('/<int:test_id>/submit', methods=['POST'])
@jwt_required()
def submit_test_answer(test_id):
    identity = json.loads(get_jwt_identity())
    if identity['role'] != 'student':
        return jsonify({"message": "Only students can submit tests"}), 403
        
    data = request.get_json() or {}
    answer_sheet_url = data.get('answer_sheet_url')
    
    if not answer_sheet_url:
        return jsonify({"message": "Answer sheet upload URL is required"}), 400
        
    # Check if test exists
    test = WrittenTest.query.filter_by(id=test_id).first()
    if not test:
        return jsonify({"message": "Test not found"}), 404
        
    submission = WrittenTestSubmission(
        test_id=test_id,
        student_id=identity['id'],
        answer_sheet_url=answer_sheet_url,
        status='Pending'
    )
    
    db.session.add(submission)
    db.session.commit()
    
    # Notify teacher
    from models import User
    teacher = User.query.filter_by(role='mentor').first()
    if teacher:
        student_user = User.query.get(identity['id'])
        notif = Notification(
            user_id=teacher.id,
            title="Written Test Submitted",
            content=f"{student_user.name} submitted the answer sheet for '{test.test_name}'.",
            notification_type="test"
        )
        db.session.add(notif)
        db.session.commit()
        
    return jsonify({"message": "Answer sheet submitted successfully", "id": submission.id}), 201

@tests_bp.route('/submissions', methods=['GET'])
@jwt_required()
def get_submissions():
    # Retrieve submissions. Teachers see all, student sees their own
    identity = json.loads(get_jwt_identity())
    
    query = WrittenTestSubmission.query
    if identity['role'] == 'student':
        query = query.filter(WrittenTestSubmission.student_id == identity['id'])
        
    submissions = query.order_by(WrittenTestSubmission.submission_date.desc()).all()
    
    from models import User
    result = []
    for sub in submissions:
        test_info = WrittenTest.query.get(sub.test_id)
        student = User.query.get(sub.student_id)
        result.append({
            "id": sub.id,
            "test_id": sub.test_id,
            "test_name": test_info.test_name if test_info else "Unknown",
            "subject": test_info.subject if test_info else "Unknown",
            "total_marks": test_info.total_marks if test_info else 100,
            "student_name": student.name if student else "Unknown Student",
            "answer_sheet_url": sub.answer_sheet_url,
            "submission_date": sub.submission_date.isoformat(),
            "marks_obtained": sub.marks_obtained,
            "remarks": sub.remarks,
            "status": sub.status,
            "graded_at": sub.graded_at.isoformat() if sub.graded_at else None
        })
        
    return jsonify(result), 200

@tests_bp.route('/submissions/<int:sub_id>/grade', methods=['POST'])
@jwt_required()
def grade_submission(sub_id):
    identity = json.loads(get_jwt_identity())
    if identity['role'] != 'mentor':
        return jsonify({"message": "Unauthorized"}), 403
        
    data = request.get_json() or {}
    marks_obtained = data.get('marks_obtained')
    remarks = data.get('remarks')
    
    if marks_obtained is None:
        return jsonify({"message": "Marks obtained is required"}), 400
        
    sub = WrittenTestSubmission.query.filter_by(id=sub_id).first()
    if not sub:
        return jsonify({"message": "Submission not found"}), 404
        
    sub.marks_obtained = int(marks_obtained)
    sub.remarks = remarks
    sub.status = 'Graded'
    sub.graded_at = datetime.utcnow()
    
    db.session.commit()
    
    # Notify student
    test_info = WrittenTest.query.get(sub.test_id)
    test_name = test_info.test_name if test_info else "Written Test"
    notif = Notification(
        user_id=sub.student_id,
        title="Written Test Result Published",
        content=f"Your answer sheet for '{test_name}' has been evaluated. Score: {marks_obtained}/{test_info.total_marks if test_info else ''}",
        notification_type="result"
    )
    db.session.add(notif)
    db.session.commit()
    
    return jsonify({"message": "Submission graded successfully"}), 200

@tests_bp.route('/assign', methods=['POST'])
@jwt_required()
def assign_written_test():
    identity = json.loads(get_jwt_identity())
    if identity['role'] != 'mentor':
        return jsonify({"message": "Unauthorized"}), 403
        
    data = request.get_json() or {}
    bank_test_id = data.get('test_id')
    start_date_str = data.get('start_date')
    end_date_str = data.get('end_date')
    
    if not bank_test_id or not start_date_str or not end_date_str:
        return jsonify({"message": "Missing test_id, start_date or end_date"}), 400
        
    bank_test = WrittenTest.query.filter_by(id=bank_test_id, is_bank=True).first()
    if not bank_test:
        return jsonify({"message": "Bank test not found"}), 404
        
    # Duplicate test for assignment
    assigned_test = WrittenTest(
        test_name=bank_test.test_name,
        subject=bank_test.subject,
        test_type=bank_test.test_type,
        description=bank_test.description,
        instructions=bank_test.instructions,
        duration=bank_test.duration,
        total_marks=bank_test.total_marks,
        start_date=datetime.fromisoformat(start_date_str),
        end_date=datetime.fromisoformat(end_date_str),
        question_paper_url=bank_test.question_paper_url,
        question_paper_name=bank_test.question_paper_name,
        is_bank=False
    )
    
    db.session.add(assigned_test)
    db.session.commit()
    
    # Notify student
    from models import User
    student = User.query.filter_by(role='student').first()
    if student:
        notif = Notification(
            user_id=student.id,
            title="Written Test Scheduled",
            content=f"A new written test '{assigned_test.test_name}' has been scheduled for {assigned_test.subject}",
            notification_type="test"
        )
        db.session.add(notif)
        db.session.commit()
        
    return jsonify({"message": "Written test assigned successfully", "id": assigned_test.id}), 201

@tests_bp.route('/<int:test_id>', methods=['DELETE'])
@jwt_required()
def delete_written_test(test_id):
    identity = json.loads(get_jwt_identity())
    if identity['role'] != 'mentor':
        return jsonify({"message": "Unauthorized"}), 403
        
    test = WrittenTest.query.get(test_id)
    if not test:
        return jsonify({"message": "Test not found"}), 404
        
    db.session.delete(test)
    db.session.commit()
    return jsonify({"message": "Written test deleted successfully"}), 200
