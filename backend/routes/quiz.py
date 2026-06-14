import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Quiz, Question, QuizSubmission, Notification
from datetime import datetime
import difflib

quiz_bp = Blueprint('quiz', __name__)

@quiz_bp.route('', methods=['GET'])
@jwt_required()
def get_quizzes():
    identity = json.loads(get_jwt_identity())
    from models import User
    
    if identity['role'] == 'student':
        student = User.query.get(identity['id'])
        m_id = student.mentor_id if student else None
        
        # Filter by student_id and their current mentor (or general ones)
        q_filter = (Quiz.student_id == identity['id']) | (Quiz.student_id.is_(None))
        if m_id:
            q_filter = q_filter & ((Quiz.mentor_id == m_id) | (Quiz.mentor_id.is_(None)))
        else:
            q_filter = q_filter & (Quiz.mentor_id.is_(None))
            
        quizzes = Quiz.query.filter_by(is_bank=False).filter(q_filter).order_by(Quiz.assignment_date.desc(), Quiz.created_at.desc()).all()
    elif identity['role'] == 'mentor':
        students = User.query.filter_by(mentor_id=identity['id']).all()
        student_ids = [s.id for s in students]
        quizzes = Quiz.query.filter_by(is_bank=False).filter(
            (Quiz.student_id.in_(student_ids)) | (Quiz.student_id.is_(None))
        ).order_by(Quiz.assignment_date.desc(), Quiz.created_at.desc()).all()
    else:
        quizzes = Quiz.query.filter_by(is_bank=False).order_by(Quiz.assignment_date.desc(), Quiz.created_at.desc()).all()
    
    result = []
    for q in quizzes:
        s_user = User.query.get(q.student_id) if q.student_id else None
        result.append({
            "id": q.id,
            "quiz_name": q.quiz_name,
            "subject": q.subject,
            "chapter": q.chapter,
            "lesson": q.lesson,
            "difficulty": q.difficulty,
            "time_limit": q.time_limit,
            "passing_marks": q.passing_marks,
            "total_marks": q.total_marks,
            "start_time": q.start_time.isoformat() if q.start_time else None,
            "end_time": q.end_time.isoformat() if q.end_time else None,
            "assignment_date": q.assignment_date.isoformat() if q.assignment_date else None,
            "questions_count": len(q.questions),
            "student_id": q.student_id,
            "student_name": s_user.name if s_user else "All Students"
        })
    return jsonify(result), 200

@quiz_bp.route('/bank', methods=['GET'])
@jwt_required()
def get_quiz_bank():
    # Return quiz templates (is_bank=True)
    quizzes = Quiz.query.filter_by(is_bank=True).order_by(Quiz.created_at.desc()).all()
    
    result = []
    for q in quizzes:
        result.append({
            "id": q.id,
            "quiz_name": q.quiz_name,
            "subject": q.subject,
            "chapter": q.chapter,
            "lesson": q.lesson,
            "difficulty": q.difficulty,
            "time_limit": q.time_limit,
            "passing_marks": q.passing_marks,
            "total_marks": q.total_marks,
            "questions_count": len(q.questions)
        })
    return jsonify(result), 200

@quiz_bp.route('/<int:quiz_id>', methods=['GET'])
@jwt_required()
def get_quiz_details(quiz_id):
    q = Quiz.query.filter_by(id=quiz_id).first()
    if not q:
        return jsonify({"message": "Quiz not found"}), 404
        
    questions = []
    for q_item in q.questions:
        questions.append({
            "id": q_item.id,
            "question_type": q_item.question_type,
            "question_text": q_item.question_text,
            "options": q_item.options, # JSON list or dict
            "marks": q_item.marks
        })
        
    identity = json.loads(get_jwt_identity())
    include_answers = (identity['role'] == 'mentor') or (request.args.get('review') == 'true')
    
    if include_answers:
        for idx, q_item in enumerate(q.questions):
            questions[idx]['correct_answer'] = q_item.correct_answer
            questions[idx]['explanation'] = q_item.explanation

    return jsonify({
        "id": q.id,
        "quiz_name": q.quiz_name,
        "subject": q.subject,
        "chapter": q.chapter,
        "lesson": q.lesson,
        "difficulty": q.difficulty,
        "instructions": q.instructions,
        "time_limit": q.time_limit,
        "passing_marks": q.passing_marks,
        "total_marks": q.total_marks,
        "is_bank": q.is_bank,
        "assignment_date": q.assignment_date.isoformat() if q.assignment_date else None,
        "questions": questions
    }), 200

@quiz_bp.route('', methods=['POST'])
@jwt_required()
def create_quiz():
    identity = json.loads(get_jwt_identity())
    if identity['role'] != 'mentor':
        return jsonify({"message": "Unauthorized"}), 403
        
    data = request.get_json() or {}
    quiz_name = data.get('quiz_name')
    subject = data.get('subject')
    questions_data = data.get('questions', [])
    is_bank = data.get('is_bank', False)
    
    if not quiz_name or not subject or not questions_data:
        return jsonify({"message": "Missing quiz details or questions"}), 400
        
    total_marks = sum(int(q.get('marks', 1)) for q in questions_data)
    
    # Scheduled time handling
    start_time_obj = None
    end_time_obj = None
    assignment_date_obj = None
    
    if data.get('start_time'):
        try:
            start_time_obj = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
            assignment_date_obj = start_time_obj.date()
        except Exception as e:
            print("Failed to parse start_time:", e)
            
    if data.get('end_time'):
        try:
            end_time_obj = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
        except Exception as e:
            print("Failed to parse end_time:", e)
            
    if not assignment_date_obj:
        if data.get('assignment_date'):
            assignment_date_obj = datetime.strptime(data['assignment_date'], '%Y-%m-%d').date()
        else:
            assignment_date_obj = datetime.utcnow().date()
            
    # Target students
    from models import User
    student_ids = data.get('student_ids')
    
    if is_bank:
        # Bank templates are global/not student specific
        new_quiz = Quiz(
            quiz_name=quiz_name,
            subject=subject,
            chapter=data.get('chapter'),
            lesson=data.get('lesson'),
            difficulty=data.get('difficulty', 'Medium'),
            instructions=data.get('instructions'),
            time_limit=int(data.get('time_limit', 15)),
            passing_marks=int(data.get('passing_marks', 50)),
            total_marks=total_marks,
            is_bank=True,
            student_id=None
        )
        db.session.add(new_quiz)
        db.session.commit()
        
        for q_data in questions_data:
            q_item = Question(
                quiz_id=new_quiz.id,
                question_type=q_data.get('question_type', 'mcq'),
                question_text=q_data.get('question_text'),
                options=q_data.get('options'),
                correct_answer=str(q_data.get('correct_answer')),
                explanation=q_data.get('explanation'),
                marks=int(q_data.get('marks', 1))
            )
            db.session.add(q_item)
        db.session.commit()
        return jsonify({"message": "Quiz template created in bank", "id": new_quiz.id}), 201

    # For active assignment, duplicate per target student
    if student_ids:
        students = User.query.filter(
            User.id.in_(student_ids),
            User.mentor_id == identity['id'],
            User.role == 'student'
        ).all()
    else:
        students = User.query.filter_by(mentor_id=identity['id'], role='student').all()
        
    if not students:
        # Fallback to general/unassigned assignment
        new_quiz = Quiz(
            quiz_name=quiz_name,
            subject=subject,
            chapter=data.get('chapter'),
            lesson=data.get('lesson'),
            difficulty=data.get('difficulty', 'Medium'),
            instructions=data.get('instructions'),
            time_limit=int(data.get('time_limit', 15)),
            passing_marks=int(data.get('passing_marks', 50)),
            total_marks=total_marks,
            is_bank=False,
            start_time=start_time_obj,
            end_time=end_time_obj,
            assignment_date=assignment_date_obj,
            student_id=None,
            mentor_id=identity['id']
        )
        db.session.add(new_quiz)
        db.session.commit()
        
        for q_data in questions_data:
            q_item = Question(
                quiz_id=new_quiz.id,
                question_type=q_data.get('question_type', 'mcq'),
                question_text=q_data.get('question_text'),
                options=q_data.get('options'),
                correct_answer=str(q_data.get('correct_answer')),
                explanation=q_data.get('explanation'),
                marks=int(q_data.get('marks', 1))
            )
            db.session.add(q_item)
        db.session.commit()
        return jsonify({"message": "Quiz assigned successfully", "id": new_quiz.id}), 201
        
    first_quiz_id = None
    for student in students:
        new_quiz = Quiz(
            quiz_name=quiz_name,
            subject=subject,
            chapter=data.get('chapter'),
            lesson=data.get('lesson'),
            difficulty=data.get('difficulty', 'Medium'),
            instructions=data.get('instructions'),
            time_limit=int(data.get('time_limit', 15)),
            passing_marks=int(data.get('passing_marks', 50)),
            total_marks=total_marks,
            is_bank=False,
            start_time=start_time_obj,
            end_time=end_time_obj,
            assignment_date=assignment_date_obj,
            student_id=student.id,
            mentor_id=identity['id']
        )
        db.session.add(new_quiz)
        db.session.commit()
        if not first_quiz_id:
            first_quiz_id = new_quiz.id
            
        for q_data in questions_data:
            q_item = Question(
                quiz_id=new_quiz.id,
                question_type=q_data.get('question_type', 'mcq'),
                question_text=q_data.get('question_text'),
                options=q_data.get('options'),
                correct_answer=str(q_data.get('correct_answer')),
                explanation=q_data.get('explanation'),
                marks=int(q_data.get('marks', 1))
            )
            db.session.add(q_item)
        db.session.commit()
        
        # Notify student
        notif = Notification(
            user_id=student.id,
            title="New Quiz Scheduled",
            content=f"New quiz '{new_quiz.quiz_name}' scheduled to start at {new_quiz.start_time.strftime('%Y-%m-%d %H:%M') if new_quiz.start_time else 'anytime'}.",
            notification_type="quiz"
        )
        db.session.add(notif)
        db.session.commit()
        
    return jsonify({"message": "Quiz created and assigned successfully", "id": first_quiz_id}), 201

@quiz_bp.route('/assign', methods=['POST'])
@jwt_required()
def assign_quiz():
    identity = json.loads(get_jwt_identity())
    if identity['role'] != 'mentor':
        return jsonify({"message": "Unauthorized"}), 403
        
    data = request.get_json() or {}
    bank_quiz_id = data.get('quiz_id')
    
    if not bank_quiz_id:
        return jsonify({"message": "Missing quiz_id"}), 400
        
    bank_quiz = Quiz.query.filter_by(id=bank_quiz_id, is_bank=True).first()
    if not bank_quiz:
        return jsonify({"message": "Bank Quiz not found"}), 404
        
    # Scheduled time handling
    start_time_obj = None
    end_time_obj = None
    assignment_date_obj = None
    
    if data.get('start_time'):
        try:
            start_time_obj = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
            assignment_date_obj = start_time_obj.date()
        except Exception as e:
            print("Failed to parse start_time:", e)
            
    if data.get('end_time'):
        try:
            end_time_obj = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
        except Exception as e:
            print("Failed to parse end_time:", e)
            
    if not assignment_date_obj:
        if data.get('assignment_date'):
            assignment_date_obj = datetime.strptime(data['assignment_date'], '%Y-%m-%d').date()
        else:
            assignment_date_obj = datetime.utcnow().date()
            
    # Target students
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
        # Fallback to general assignment
        assigned_quiz = Quiz(
            quiz_name=bank_quiz.quiz_name,
            subject=bank_quiz.subject,
            chapter=bank_quiz.chapter,
            lesson=bank_quiz.lesson,
            difficulty=bank_quiz.difficulty,
            instructions=bank_quiz.instructions,
            time_limit=bank_quiz.time_limit,
            passing_marks=bank_quiz.passing_marks,
            total_marks=bank_quiz.total_marks,
            is_bank=False,
            start_time=start_time_obj,
            end_time=end_time_obj,
            assignment_date=assignment_date_obj,
            student_id=None,
            mentor_id=identity['id']
        )
        db.session.add(assigned_quiz)
        db.session.commit()
        
        for b_q in bank_quiz.questions:
            assigned_q = Question(
                quiz_id=assigned_quiz.id,
                question_type=b_q.question_type,
                question_text=b_q.question_text,
                options=b_q.options,
                correct_answer=b_q.correct_answer,
                explanation=b_q.explanation,
                marks=b_q.marks
            )
            db.session.add(assigned_q)
        db.session.commit()
        return jsonify({"message": "Quiz assigned successfully", "id": assigned_quiz.id}), 201
        
    first_quiz_id = None
    for student in students:
        assigned_quiz = Quiz(
            quiz_name=bank_quiz.quiz_name,
            subject=bank_quiz.subject,
            chapter=bank_quiz.chapter,
            lesson=bank_quiz.lesson,
            difficulty=bank_quiz.difficulty,
            instructions=bank_quiz.instructions,
            time_limit=bank_quiz.time_limit,
            passing_marks=bank_quiz.passing_marks,
            total_marks=bank_quiz.total_marks,
            is_bank=False,
            start_time=start_time_obj,
            end_time=end_time_obj,
            assignment_date=assignment_date_obj,
            student_id=student.id,
            mentor_id=identity['id']
        )
        db.session.add(assigned_quiz)
        db.session.commit()
        if not first_quiz_id:
            first_quiz_id = assigned_quiz.id
            
        for b_q in bank_quiz.questions:
            assigned_q = Question(
                quiz_id=assigned_quiz.id,
                question_type=b_q.question_type,
                question_text=b_q.question_text,
                options=b_q.options,
                correct_answer=b_q.correct_answer,
                explanation=b_q.explanation,
                marks=b_q.marks
            )
            db.session.add(assigned_q)
        db.session.commit()
        
        # Notify student
        notif = Notification(
            user_id=student.id,
            title="New Quiz Assigned",
            content=f"Quiz '{assigned_quiz.quiz_name}' has been assigned to start at {assigned_quiz.start_time.strftime('%Y-%m-%d %H:%M') if assigned_quiz.start_time else 'anytime'}.",
            notification_type="quiz"
        )
        db.session.add(notif)
        db.session.commit()
        
    return jsonify({"message": "Quiz assigned successfully", "id": first_quiz_id}), 201

@quiz_bp.route('/<int:quiz_id>/submit', methods=['POST'])
@jwt_required()
def submit_quiz(quiz_id):
    identity = json.loads(get_jwt_identity())
    if identity['role'] != 'student':
        return jsonify({"message": "Only students can submit quizzes"}), 403
        
    q = Quiz.query.filter_by(id=quiz_id, is_bank=False).first()
    if not q:
        return jsonify({"message": "Active Quiz not found"}), 404
        
    data = request.get_json() or {}
    student_answers = data.get('answers', {}) # format: {question_id: "student_answer_text"}
    time_taken = int(data.get('time_taken', 0))
    
    score = 0
    correct_count = 0
    total_questions = len(q.questions)
    
    for q_item in q.questions:
        ans = str(student_answers.get(str(q_item.id), '')).strip()
        correct_ans = str(q_item.correct_answer).strip()
        
        is_correct = False
        
        if q_item.question_type == 'fill_blank':
            # Typo-tolerant matching for fill in the blanks
            ans_lower = ans.lower()
            correct_lower = correct_ans.lower()
            if ans_lower == correct_lower:
                is_correct = True
            else:
                # Fuzzy matching (if similarity ratio > 0.85, consider it correct)
                ratio = difflib.SequenceMatcher(None, ans_lower, correct_lower).ratio()
                if ratio > 0.85:
                    is_correct = True
        elif q_item.question_type == 'match':
            # For match questions, ans could be a stringified JSON representing order
            if ans == correct_ans:
                is_correct = True
        else:
            # Exact match for MCQ, True/False, Short Answer
            if ans.lower() == correct_ans.lower():
                is_correct = True
                
        if is_correct:
            score += q_item.marks
            correct_count += 1
            
    accuracy = (correct_count / total_questions * 100) if total_questions > 0 else 0
    
    strong_areas = q.subject if accuracy >= 70 else ""
    weak_areas = q.subject if accuracy < 70 else ""
    
    new_sub = QuizSubmission(
        quiz_id=quiz_id,
        student_id=identity['id'],
        score=score,
        answers=student_answers,
        accuracy=accuracy,
        time_taken=time_taken,
        strong_areas=strong_areas,
        weak_areas=weak_areas
    )
    
    db.session.add(new_sub)
    db.session.commit()
    
    # Notify teacher
    from models import User
    teacher = User.query.filter_by(role='mentor').first()
    if teacher:
        student_user = User.query.get(identity['id'])
        notif = Notification(
            user_id=teacher.id,
            title="Quiz Submitted",
            content=f"{student_user.name} finished the quiz '{q.quiz_name}' with {accuracy:.1f}% accuracy.",
            notification_type="result"
        )
        db.session.add(notif)
        db.session.commit()
        
    return jsonify({
        "message": "Quiz submitted successfully",
        "score": score,
        "total_marks": q.total_marks,
        "accuracy": accuracy,
        "correct_count": correct_count,
        "total_questions": total_questions,
        "time_taken": time_taken
    }), 201

@quiz_bp.route('/submissions', methods=['GET'])
@jwt_required()
def get_quiz_submissions():
    identity = json.loads(get_jwt_identity())
    
    query = QuizSubmission.query
    if identity['role'] == 'student':
        query = query.filter(QuizSubmission.student_id == identity['id'])
    elif identity['role'] == 'mentor':
        from models import User
        students = User.query.filter_by(mentor_id=identity['id']).all()
        student_ids = [s.id for s in students]
        query = query.filter(QuizSubmission.student_id.in_(student_ids))
        
    submissions = query.order_by(QuizSubmission.submitted_at.desc()).all()
    
    from models import User
    result = []
    for sub in submissions:
        quiz_info = Quiz.query.get(sub.quiz_id)
        student = User.query.get(sub.student_id)
        result.append({
            "id": sub.id,
            "quiz_id": sub.quiz_id,
            "quiz_name": quiz_info.quiz_name if quiz_info else "Unknown Quiz",
            "subject": quiz_info.subject if quiz_info else "Unknown Subject",
            "total_marks": quiz_info.total_marks if quiz_info else 100,
            "student_id": sub.student_id,
            "student_name": student.name if student else "Unknown Student",
            "score": sub.score,
            "accuracy": sub.accuracy,
            "time_taken": sub.time_taken,
            "strong_areas": sub.strong_areas,
            "weak_areas": sub.weak_areas,
            "submitted_at": sub.submitted_at.isoformat()
        })
    return jsonify(result), 200

@quiz_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_questions():
    identity = json.loads(get_jwt_identity())
    if identity['role'] != 'mentor':
        return jsonify({"message": "Unauthorized"}), 403
        
    data = request.get_json() or {}
    topic = data.get('topic', '').lower()
    subject = data.get('subject', '').lower()
    count = int(data.get('count', 3))
    types = data.get('types')
    
    questions = []
    
    # Predefined high-quality banks for smart keyword matching including match and short types
    q_bank = []
    
    if 'math' in subject or 'algebra' in topic or 'trig' in topic or 'equation' in topic:
        q_bank = [
            {
                "question_type": "mcq",
                "question_text": "What is the value of x if 2x + 7 = 15?",
                "options": ["3", "4", "5", "6"],
                "correct_answer": "4",
                "explanation": "Subtract 7 from both sides: 2x = 8. Divide by 2: x = 4.",
                "marks": 1
            },
            {
                "question_type": "true_false",
                "question_text": "The derivative of a constant value is always zero.",
                "options": ["true", "false"],
                "correct_answer": "true",
                "explanation": "Since a constant value does not change, its rate of change (derivative) is 0.",
                "marks": 1
            },
            {
                "question_type": "fill_blank",
                "question_text": "The trigonometric ratio defined as opposite over hypotenuse is the ___ function.",
                "correct_answer": "sine",
                "explanation": "Sine (sin) is opposite/hypotenuse, cosine is adjacent/hypotenuse.",
                "marks": 1
            },
            {
                "question_type": "mcq",
                "question_text": "Solve for x in x^2 - 5x + 6 = 0.",
                "options": ["x=1,6", "x=2,3", "x=-2,-3", "x=5,1"],
                "correct_answer": "x=2,3",
                "explanation": "Factoring gives (x-2)(x-3) = 0, so x = 2 or x = 3.",
                "marks": 1
            },
            {
                "question_type": "match",
                "question_text": "Match the algebraic expression on the left with its factored form on the right: A) x^2 - 4, B) x^2 + 4x + 4, C) x^2 - 2x - 3",
                "options": ["1) (x - 3)(x + 1)", "2) (x - 2)(x + 2)", "3) (x + 2)^2"],
                "correct_answer": "A->2, B->3, C->1",
                "explanation": "x^2-4 = (x-2)(x+2), x^2+4x+4 = (x+2)^2, x^2-2x-3 = (x-3)(x+1).",
                "marks": 1
            },
            {
                "question_type": "short",
                "question_text": "Explain the difference between a relation and a function in mathematics.",
                "correct_answer": "A relation is any set of ordered pairs, whereas a function is a special relation where each input has exactly one output.",
                "explanation": "A relation maps inputs to outputs. A function is a strict subset where every input has a unique output.",
                "marks": 1
            }
        ]
    elif 'physics' in subject or 'optics' in topic or 'motion' in topic or 'force' in topic or 'refract' in topic:
        q_bank = [
            {
                "question_type": "mcq",
                "question_text": "What is the unit of electric resistance?",
                "options": ["Volt", "Ampere", "Ohm", "Watt"],
                "correct_answer": "Ohm",
                "explanation": "Resistance is measured in Ohms, defined by Ohm's Law V = IR.",
                "marks": 1
            },
            {
                "question_type": "true_false",
                "question_text": "Light travels faster in water than in a vacuum.",
                "options": ["true", "false"],
                "correct_answer": "false",
                "explanation": "Light travels fastest in a vacuum; water slows it down due to its refractive index.",
                "marks": 1
            },
            {
                "question_type": "fill_blank",
                "question_text": "According to Newton's Second Law, Force is equal to mass times ___.",
                "correct_answer": "acceleration",
                "explanation": "F = ma, meaning Force = mass * acceleration.",
                "marks": 1
            },
            {
                "question_type": "mcq",
                "question_text": "What type of lens is used to correct myopia (nearsightedness)?",
                "options": ["Convex lens", "Concave lens", "Cylindrical lens", "Bifocal lens"],
                "correct_answer": "Concave lens",
                "explanation": "Myopia requires a diverging (concave) lens to focus the light properly on the retina.",
                "marks": 1
            },
            {
                "question_type": "match",
                "question_text": "Match physical quantities with their standard SI units: A) Power, B) Force, C) Energy",
                "options": ["1) Joule", "2) Watt", "3) Newton"],
                "correct_answer": "A->2, B->3, C->1",
                "explanation": "Power is measured in Watts, Force in Newtons, and Energy in Joules.",
                "marks": 1
            },
            {
                "question_type": "short",
                "question_text": "Describe the laws of refraction of light (Snell's Law).",
                "correct_answer": "1. The incident ray, refracted ray, and normal lie in the same plane. 2. The ratio of the sine of the angle of incidence to the sine of the angle of refraction is constant.",
                "explanation": "Snell's Law states n1 * sin(i) = n2 * sin(r).",
                "marks": 1
            }
        ]
    elif 'chemistry' in subject or 'bond' in topic or 'acid' in topic or 'reaction' in topic:
        q_bank = [
            {
                "question_type": "mcq",
                "question_text": "What type of chemical bond is formed by the sharing of electrons?",
                "options": ["Ionic", "Covalent", "Metallic", "Hydrogen"],
                "correct_answer": "Covalent",
                "explanation": "Covalent bonding involves sharing electron pairs between atoms.",
                "marks": 1
            },
            {
                "question_type": "true_false",
                "question_text": "An acidic solution has a pH greater than 7.",
                "options": ["true", "false"],
                "correct_answer": "false",
                "explanation": "Acids have pH < 7. Neutral solutions have pH = 7, and alkaline/basic solutions have pH > 7.",
                "marks": 1
            },
            {
                "question_type": "fill_blank",
                "question_text": "The chemical formula for table salt is ___.",
                "correct_answer": "NaCl",
                "explanation": "Table salt is Sodium Chloride, which has the chemical formula NaCl.",
                "marks": 1
            },
            {
                "question_type": "mcq",
                "question_text": "Which element has the highest electronegativity?",
                "options": ["Oxygen", "Fluorine", "Chlorine", "Nitrogen"],
                "correct_answer": "Fluorine",
                "explanation": "Fluorine is the most electronegative element on the periodic table (4.0 on Pauling scale).",
                "marks": 1
            },
            {
                "question_type": "match",
                "question_text": "Match the compound names with their bond types: A) Carbon dioxide, B) Sodium chloride, C) Copper metal",
                "options": ["1) Ionic bond", "2) Metallic bond", "3) Covalent bond"],
                "correct_answer": "A->3, B->1, C->2",
                "explanation": "CO2 is covalent, NaCl is ionic, Copper metal is metallic.",
                "marks": 1
            },
            {
                "question_type": "short",
                "question_text": "State the law of conservation of mass in a chemical reaction.",
                "correct_answer": "Mass can neither be created nor destroyed in a chemical reaction. The total mass of reactants must equal the total mass of products.",
                "explanation": "A chemical equation must be balanced because matter is conserved.",
                "marks": 1
            }
        ]
    else:
        q_bank = [
            {
                "question_type": "mcq",
                "question_text": "Which organelle is known as the powerhouse of the cell?",
                "options": ["Nucleus", "Ribosome", "Mitochondria", "Lysosome"],
                "correct_answer": "Mitochondria",
                "explanation": "Mitochondria generate most of the cell's supply of adenosine triphosphate (ATP), used as chemical energy.",
                "marks": 1
            },
            {
                "question_type": "true_false",
                "question_text": "Photosynthesis occurs inside the mitochondria of plant cells.",
                "options": ["true", "false"],
                "correct_answer": "false",
                "explanation": "Photosynthesis occurs inside the chloroplasts containing chlorophyll.",
                "marks": 1
            },
            {
                "question_type": "fill_blank",
                "question_text": "Deoxyribonucleic acid is commonly known by its abbreviation ___.",
                "correct_answer": "DNA",
                "explanation": "DNA stands for Deoxyribonucleic acid.",
                "marks": 1
            },
            {
                "question_type": "mcq",
                "question_text": "Which pigment absorbs light energy during photosynthesis?",
                "options": ["Carotenoid", "Chlorophyll", "Xanthophyll", "Melanin"],
                "correct_answer": "Chlorophyll",
                "explanation": "Chlorophyll is the green pigment in plants that absorbs light energy for photosynthesis.",
                "marks": 1
            },
            {
                "question_type": "match",
                "question_text": "Match the cell organelle with its function: A) Mitochondria, B) Chloroplast, C) Ribosome",
                "options": ["1) Protein synthesis", "2) Cellular respiration", "3) Photosynthesis"],
                "correct_answer": "A->2, B->3, C->1",
                "explanation": "Mitochondria is for cellular respiration, chloroplast for photosynthesis, and ribosome for protein synthesis.",
                "marks": 1
            },
            {
                "question_type": "short",
                "question_text": "Briefly explain the main function of red blood cells in the human body.",
                "correct_answer": "Red blood cells contain hemoglobin, which binds to oxygen in the lungs and transports it to tissues throughout the body.",
                "explanation": "Their biconcave shape increases surface area for diffusion of oxygen.",
                "marks": 1
            }
        ]
        
    if types and isinstance(types, dict):
        for q_type, q_count in types.items():
            try:
                q_count = int(q_count)
            except (ValueError, TypeError):
                continue
            if q_count <= 0:
                continue
            
            # Filter themed bank by type
            type_questions = [q for q in q_bank if q['question_type'] == q_type]
            
            if not type_questions:
                # If no matching questions of this type in our theme bank, use high-quality custom templates
                fallback_questions = {
                    "mcq": {
                        "question_type": "mcq",
                        "question_text": f"Which of the following is a primary characteristic of {topic or 'this topic'}?",
                        "options": ["Option A", "Option B", "Option C", "Option D"],
                        "correct_answer": "Option A",
                        "explanation": f"This is an generated multiple choice question about {topic or 'this topic'}.",
                        "marks": 1
                    },
                    "true_false": {
                        "question_type": "true_false",
                        "question_text": f"True or False: The concepts of {topic or 'this topic'} are fundamental to this subject.",
                        "options": ["true", "false"],
                        "correct_answer": "true",
                        "explanation": "This is a basic fact checking question.",
                        "marks": 1
                    },
                    "fill_blank": {
                        "question_type": "fill_blank",
                        "question_text": f"The key parameter defined in {topic or 'this topic'} is ___.",
                        "correct_answer": topic or "general",
                        "explanation": "Fill in the blank.",
                        "marks": 1
                    },
                    "match": {
                        "question_type": "match",
                        "question_text": f"Match terms related to {topic or 'this topic'}: A) Concept A, B) Concept B, C) Concept C",
                        "options": ["1) Definition A", "2) Definition B", "3) Definition C"],
                        "correct_answer": "A->1, B->2, C->3",
                        "explanation": "Matching columns.",
                        "marks": 1
                    },
                    "short": {
                        "question_type": "short",
                        "question_text": f"Explain the main role and function of {topic or 'this topic'} in this field of study.",
                        "correct_answer": f"The main function of {topic or 'this topic'} is to provide foundational structure and practical application.",
                        "explanation": "Descriptive short answer explanation.",
                        "marks": 1
                    }
                }
                generic_q = fallback_questions.get(q_type, fallback_questions["mcq"]).copy()
                for _ in range(q_count):
                    questions.append(generic_q)
            else:
                for i in range(q_count):
                    item = type_questions[i % len(type_questions)].copy()
                    questions.append(item)
    else:
        # Backward compatibility
        for i in range(count):
            item = q_bank[i % len(q_bank)].copy()
            questions.append(item)
        
    return jsonify({"questions": questions}), 200

@quiz_bp.route('/<int:quiz_id>', methods=['DELETE'])
@jwt_required()
def delete_quiz(quiz_id):
    identity = json.loads(get_jwt_identity())
    if identity['role'] != 'mentor':
        return jsonify({"message": "Unauthorized"}), 403
        
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"message": "Quiz not found"}), 404
        
    db.session.delete(quiz)
    db.session.commit()
    return jsonify({"message": "Quiz deleted successfully"}), 200

@quiz_bp.route('/submission/<int:sub_id>', methods=['GET'])
@jwt_required()
def get_submission_details(sub_id):
    identity = json.loads(get_jwt_identity())
    sub = QuizSubmission.query.get(sub_id)
    if not sub:
        return jsonify({"message": "Submission not found"}), 404
        
    # Check authorization (mentor can see their student's submission, student can see their own)
    if identity['role'] == 'student' and sub.student_id != identity['id']:
        return jsonify({"message": "Unauthorized"}), 403
    elif identity['role'] == 'mentor':
        from models import User
        student = User.query.get(sub.student_id)
        if not student or student.mentor_id != identity['id']:
            return jsonify({"message": "Unauthorized"}), 403
            
    quiz = Quiz.query.get(sub.quiz_id)
    questions_data = []
    
    if quiz:
        for q_item in quiz.questions:
            student_ans = sub.answers.get(str(q_item.id), '')
            
            # Determine correctness like the submission grading route
            ans = str(student_ans).strip()
            correct_ans = str(q_item.correct_answer).strip()
            is_correct = False
            
            if q_item.question_type == 'fill_blank':
                if ans.lower() == correct_ans.lower() or difflib.SequenceMatcher(None, ans.lower(), correct_ans.lower()).ratio() > 0.85:
                    is_correct = True
            elif q_item.question_type == 'match':
                if ans == correct_ans:
                    is_correct = True
            else:
                if ans.lower() == correct_ans.lower():
                    is_correct = True

            questions_data.append({
                "id": q_item.id,
                "question_type": q_item.question_type,
                "question_text": q_item.question_text,
                "options": q_item.options,
                "correct_answer": q_item.correct_answer,
                "explanation": q_item.explanation,
                "marks": q_item.marks,
                "student_answer": student_ans,
                "is_correct": is_correct
            })
            
    from models import User
    student_user = User.query.get(sub.student_id)
    return jsonify({
        "id": sub.id,
        "quiz_id": sub.quiz_id,
        "quiz_name": quiz.quiz_name if quiz else "Unknown Quiz",
        "subject": quiz.subject if quiz else "Unknown Subject",
        "score": sub.score,
        "total_marks": quiz.total_marks if quiz else 100,
        "accuracy": sub.accuracy,
        "time_taken": sub.time_taken,
        "strong_areas": sub.strong_areas,
        "weak_areas": sub.weak_areas,
        "submitted_at": sub.submitted_at.isoformat(),
        "student_name": student_user.name if student_user else "Unknown Student",
        "questions": questions_data
    }), 200


    

