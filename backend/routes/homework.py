import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Homework, Notification
from datetime import datetime, timedelta

homework_bp = Blueprint('homework', __name__)

def recalculate_student_streak(student_id):
    from models import Homework, User
    from datetime import datetime, timedelta
    
    student = User.query.get(student_id)
    if not student:
        return 0
        
    completed_hws = Homework.query.filter_by(student_id=student_id, status='Completed').all()
    if not completed_hws:
        student.streak = 0
        db.session.commit()
        return 0
        
    completed_dates = {hw.date for hw in completed_hws}
    today = datetime.utcnow().date()
    yesterday = today - timedelta(days=1)
    
    if today not in completed_dates and yesterday not in completed_dates:
        student.streak = 0
        db.session.commit()
        return 0
        
    start_date = today if today in completed_dates else yesterday
    streak = 0
    current_date = start_date
    
    while current_date in completed_dates:
        streak += 1
        current_date -= timedelta(days=1)
        
    student.streak = streak
    db.session.commit()
    return streak

def carry_forward_pending_homework():
    today = datetime.utcnow().date()
    # Find all pending homework where date < today
    pending_hws = Homework.query.filter(
        Homework.status == 'Pending',
        Homework.date < today
    ).all()
    
    cloned_any = False
    for hw in pending_hws:
        next_date = hw.date + timedelta(days=1)
        # Check if already cloned
        already_cloned = Homework.query.filter_by(carried_from_id=hw.id).first()
        if not already_cloned:
            # Create a clone for the next day
            clone = Homework(
                date=next_date,
                due_date=hw.due_date + timedelta(days=1) if hw.due_date else next_date,
                subject=hw.subject,
                homework_type=hw.homework_type,
                title=hw.title,
                description=hw.description,
                priority=hw.priority,
                estimated_time=hw.estimated_time,
                attachment_url=hw.attachment_url,
                remarks=hw.remarks,
                status='Pending',
                carried_from_id=hw.id,
                student_id=hw.student_id
            )
            db.session.add(clone)
            cloned_any = True
            
    if cloned_any:
        db.session.commit()
        # Recurse to handle multiple missed days
        carry_forward_pending_homework()

def get_homework_chain_status(homework_id):
    hw = Homework.query.get(homework_id)
    if not hw:
        return 'Pending'
    current = hw
    while current:
        if current.status == 'Completed':
            return 'Completed'
        next_hw = Homework.query.filter_by(carried_from_id=current.id).first()
        current = next_hw
    return 'Pending'

def get_student_homework_chain_records(hw):
    root = hw
    while root.carried_from_id is not None:
        parent = Homework.query.get(root.carried_from_id)
        if not parent:
            break
        root = parent
    all_records = [root]
    current_ids = [root.id]
    while current_ids:
        descendants = Homework.query.filter(Homework.carried_from_id.in_(current_ids)).all()
        if not descendants:
            break
        all_records.extend(descendants)
        current_ids = [d.id for d in descendants]
    return all_records

def get_all_related_homework_records(hw):
    root = hw
    while root.carried_from_id is not None:
        parent = Homework.query.get(root.carried_from_id)
        if not parent:
            break
        root = parent
        
    roots = Homework.query.filter_by(
        date=root.date,
        subject=root.subject,
        homework_type=root.homework_type,
        title=root.title,
        description=root.description,
        carried_from_id=None
    ).all()
    
    all_records = []
    for r in roots:
        all_records.append(r)
        current_ids = [r.id]
        while current_ids:
            descendants = Homework.query.filter(Homework.carried_from_id.in_(current_ids)).all()
            if not descendants:
                break
            all_records.extend(descendants)
            current_ids = [d.id for d in descendants]
    return all_records

@homework_bp.route('', methods=['GET'])
@jwt_required()
def get_all_homework():
    try:
        carry_forward_pending_homework()
    except Exception as e:
        print("Error during carry forward:", e)

    identity = json.loads(get_jwt_identity())
    if identity['role'] == 'student':
        recalculate_student_streak(identity['id'])
        
    subject = request.args.get('subject')
    status = request.args.get('status')
    
    query = Homework.query
    from models import User
    
    if identity['role'] == 'student':
        # Students only see homework assigned to them or unassigned general homework
        query = query.filter((Homework.student_id == identity['id']) | (Homework.student_id.is_(None)))
        if subject:
            query = query.filter(Homework.subject.ilike(f"%{subject}%"))
        if status:
            query = query.filter(Homework.status == status)
            
        homework_list = query.order_by(Homework.date.desc(), Homework.id.asc()).all()
        
        result = []
        for hw in homework_list:
            student_name = ""
            if hw.student_id:
                s_user = User.query.get(hw.student_id)
                if s_user:
                    student_name = s_user.name
            result.append({
                "id": hw.id,
                "date": hw.date.isoformat(),
                "subject": hw.subject,
                "homework_type": hw.homework_type,
                "title": hw.title,
                "description": hw.description,
                "priority": hw.priority,
                "estimated_time": hw.estimated_time,
                "due_date": hw.due_date.isoformat() if hw.due_date else None,
                "attachment_url": hw.attachment_url,
                "remarks": hw.remarks,
                "status": hw.status,
                "created_at": hw.created_at.isoformat(),
                "carried_from_id": hw.carried_from_id,
                "student_id": hw.student_id,
                "student_name": student_name
            })
        return jsonify(result), 200
        
    elif identity['role'] == 'mentor':
        students = User.query.filter_by(mentor_id=identity['id']).all()
        student_ids = [s.id for s in students]
        
        # Only query original assignments (carried_from_id is None)
        query = query.filter(
            ((Homework.student_id.in_(student_ids)) | (Homework.student_id.is_(None))) &
            (Homework.carried_from_id.is_(None))
        )
        if subject:
            query = query.filter(Homework.subject.ilike(f"%{subject}%"))
            
        homework_list = query.order_by(Homework.date.desc(), Homework.id.asc()).all()
        
        groups = {}
        for hw in homework_list:
            key = (hw.date, hw.subject, hw.homework_type, hw.title, hw.description)
            if key not in groups:
                groups[key] = []
            groups[key].append(hw)
            
        result = []
        for key, hws in groups.items():
            main_hw = hws[0]
            
            student_statuses = []
            completed_count = 0
            total_count = 0
            
            for hw in hws:
                if hw.student_id:
                    s_user = User.query.get(hw.student_id)
                    if s_user:
                        res_status = get_homework_chain_status(hw.id)
                        student_statuses.append({
                            "student_id": hw.student_id,
                            "student_name": s_user.name,
                            "status": res_status
                        })
                        total_count += 1
                        if res_status == 'Completed':
                            completed_count += 1
                else:
                    res_status = get_homework_chain_status(hw.id)
                    student_statuses.append({
                        "student_id": None,
                        "student_name": "All Students",
                        "status": res_status
                    })
                    total_count += 1
                    if res_status == 'Completed':
                        completed_count += 1
            
            completion_percentage = int((completed_count / total_count) * 100) if total_count > 0 else 0
            overall_status = "Completed" if completed_count == total_count and total_count > 0 else "Pending"
            
            if status and overall_status != status:
                continue
                
            result.append({
                "id": main_hw.id,
                "all_ids": [hw.id for hw in hws],
                "date": main_hw.date.isoformat(),
                "subject": main_hw.subject,
                "homework_type": main_hw.homework_type,
                "title": main_hw.title,
                "description": main_hw.description,
                "priority": main_hw.priority,
                "estimated_time": main_hw.estimated_time,
                "due_date": main_hw.due_date.isoformat() if main_hw.due_date else None,
                "attachment_url": main_hw.attachment_url,
                "remarks": main_hw.remarks,
                "status": overall_status,
                "created_at": main_hw.created_at.isoformat(),
                "carried_from_id": None,
                "students": student_statuses,
                "completion_percentage": completion_percentage
            })
            
        return jsonify(result), 200
        
    return jsonify([]), 200

@homework_bp.route('', methods=['POST'])
@jwt_required()
def create_homework():
    identity = json.loads(get_jwt_identity())
    if identity['role'] != 'mentor':
        return jsonify({"message": "Unauthorized: Only teachers can create homework"}), 403
        
    data = request.get_json() or {}
    
    date_str = data.get('date')
    due_date_str = data.get('due_date')
    
    date_obj = datetime.strptime(date_str, '%Y-%m-%d').date() if date_str else datetime.utcnow().date()
    due_date_obj = datetime.strptime(due_date_str, '%Y-%m-%d').date() if due_date_str else None
    
    # Get students to assign to
    from models import User
    student_ids = data.get('student_ids')
    if student_ids:
        students = User.query.filter(
            User.id.in_(student_ids),
            User.mentor_id == identity['id'],
            User.role == 'student'
        ).all()
    else:
        students = User.query.filter_by(mentor_id=identity['id'], role='student').all()
    
    if not students:
        # Fallback: if no students, assign to None (general)
        new_hw = Homework(
            date=date_obj,
            subject=data.get('subject', 'General'),
            homework_type=data.get('homework_type', 'School Homework'),
            title=data.get('title'),
            description=data.get('description'),
            priority=data.get('priority', 'Medium'),
            estimated_time=data.get('estimated_time'),
            due_date=due_date_obj,
            attachment_url=data.get('attachment_url'),
            remarks=data.get('remarks'),
            status='Pending',
            student_id=None
        )
        db.session.add(new_hw)
        db.session.commit()
        return jsonify({"message": "Homework created successfully", "id": new_hw.id}), 201
        
    first_hw_id = None
    for student in students:
        new_hw = Homework(
            date=date_obj,
            subject=data.get('subject', 'General'),
            homework_type=data.get('homework_type', 'School Homework'),
            title=data.get('title'),
            description=data.get('description'),
            priority=data.get('priority', 'Medium'),
            estimated_time=data.get('estimated_time'),
            due_date=due_date_obj,
            attachment_url=data.get('attachment_url'),
            remarks=data.get('remarks'),
            status='Pending',
            student_id=student.id
        )
        db.session.add(new_hw)
        db.session.commit()
        if not first_hw_id:
            first_hw_id = new_hw.id
            
        # Send a notification to the student
        notif = Notification(
            user_id=student.id,
            title="New Homework Assigned",
            content=f"New homework assigned for {new_hw.subject}: {new_hw.title}",
            notification_type="homework"
        )
        db.session.add(notif)
        db.session.commit()
        
    return jsonify({"message": "Homework created successfully", "id": first_hw_id}), 201

@homework_bp.route('/<int:hw_id>', methods=['PUT'])
@jwt_required()
def update_homework(hw_id):
    hw = Homework.query.filter_by(id=hw_id).first()
    if not hw:
        return jsonify({"message": "Homework not found"}), 404
            
    identity = json.loads(get_jwt_identity())
    data = request.get_json() or {}
    
    if identity['role'] == 'mentor':
        related_records = get_all_related_homework_records(hw)
        student_ids_to_update = set()
        for r in related_records:
            if 'title' in data: r.title = data['title']
            if 'subject' in data: r.subject = data['subject']
            if 'description' in data: r.description = data['description']
            if 'homework_type' in data: r.homework_type = data['homework_type']
            if 'priority' in data: r.priority = data['priority']
            if 'estimated_time' in data: r.estimated_time = data['estimated_time']
            if 'remarks' in data: r.remarks = data['remarks']
            if 'status' in data: 
                r.status = data['status']
                if r.student_id:
                    student_ids_to_update.add(r.student_id)
            if 'due_date' in data and data['due_date']:
                r.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
        db.session.commit()
        for sid in student_ids_to_update:
            recalculate_student_streak(sid)
        return jsonify({"message": "Homework updated successfully"}), 200
    else:
        if 'status' in data:
            new_status = data['status']
            chain_records = get_student_homework_chain_records(hw)
            any_already_completed = any(r.status == 'Completed' for r in chain_records)
            
            for r in chain_records:
                r.status = new_status
                
            if new_status == 'Completed' and not any_already_completed:
                # Notify teacher of completion
                from models import User
                teacher = User.query.filter_by(role='mentor').first()
                if teacher:
                    notif = Notification(
                        user_id=teacher.id,
                        title="Homework Completed",
                        content=f"Student completed homework for {hw.subject}: {hw.title}",
                        notification_type="homework"
                    )
                    db.session.add(notif)
            
            db.session.commit()
            recalculate_student_streak(identity['id'])
        return jsonify({"message": "Homework updated successfully"}), 200

@homework_bp.route('/<int:hw_id>', methods=['DELETE'])
@jwt_required()
def delete_homework(hw_id):
    identity = json.loads(get_jwt_identity())
    if identity['role'] != 'mentor':
        return jsonify({"message": "Unauthorized"}), 403
        
    hw = Homework.query.filter_by(id=hw_id).first()
    if not hw:
        return jsonify({"message": "Homework not found"}), 404
        
    related_records = get_all_related_homework_records(hw)
    student_ids_to_update = set()
    for r in related_records:
        if r.student_id:
            student_ids_to_update.add(r.student_id)
        db.session.delete(r)
    db.session.commit()
    for sid in student_ids_to_update:
        recalculate_student_streak(sid)
    return jsonify({"message": "Homework deleted successfully"}), 200
