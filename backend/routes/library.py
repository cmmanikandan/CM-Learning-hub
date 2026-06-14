import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, LibraryMaterial, Notification, User

library_bp = Blueprint('library', __name__)

@library_bp.route('', methods=['GET'])
@jwt_required()
def get_library_materials():
    category = request.args.get('category')
    search = request.args.get('search')
    
    query = LibraryMaterial.query
    
    identity = json.loads(get_jwt_identity())
    role = identity['role']
    user_id = identity['id']
    
    from sqlalchemy import or_
    
    admin_ids = [u.id for u in User.query.filter_by(role='admin').all()]
    
    if role == 'student':
        student = User.query.get(user_id)
        m_id = student.mentor_id if student else None
        query = query.filter(
            LibraryMaterial.visibility == 'Public',
            or_(
                LibraryMaterial.uploaded_by_id == m_id,
                LibraryMaterial.uploaded_by_id.is_(None),
                LibraryMaterial.uploaded_by_id.in_(admin_ids)
            ),
            or_(
                LibraryMaterial.student_id == user_id,
                LibraryMaterial.student_id.is_(None)
            )
        )
    elif role == 'mentor':
        query = query.filter(
            or_(
                LibraryMaterial.uploaded_by_id == user_id,
                LibraryMaterial.uploaded_by_id.is_(None),
                LibraryMaterial.uploaded_by_id.in_(admin_ids)
            )
        )
        
    if category:
        query = query.filter(LibraryMaterial.category == category)
    if search:
        query = query.filter(
            (LibraryMaterial.title.ilike(f"%{search}%")) | 
            (LibraryMaterial.description.ilike(f"%{search}%")) |
            (LibraryMaterial.tags.ilike(f"%{search}%"))
        )
        
    materials = query.order_by(LibraryMaterial.created_at.desc()).all()
    
    user = User.query.get(user_id)
    bookmarks = user.bookmarked_material_ids or "" if user else ""

    result = []
    for mat in materials:
        is_bookmarked = f",{mat.id}," in bookmarks
        student_name = ""
        if mat.student_id:
            s_user = User.query.get(mat.student_id)
            if s_user:
                student_name = s_user.name
                
        result.append({
            "id": mat.id,
            "title": mat.title,
            "subject": mat.subject,
            "category": mat.category,
            "description": mat.description,
            "tags": [t.strip() for t in mat.tags.split(',')] if mat.tags else [],
            "file_url": mat.file_url,
            "thumbnail_url": mat.thumbnail_url,
            "visibility": mat.visibility,
            "is_bookmarked": is_bookmarked,
            "student_id": mat.student_id,
            "student_name": student_name,
            "created_at": mat.created_at.isoformat()
        })
        
    bookmark_folders_raw = user.bookmark_folders if hasattr(user, 'bookmark_folders') else None
    bookmark_folders = {}
    if bookmark_folders_raw:
        try:
            bookmark_folders = json.loads(bookmark_folders_raw)
        except Exception:
            bookmark_folders = {}
            
    return jsonify({
        "materials": result,
        "bookmark_folders": bookmark_folders
    }), 200

@library_bp.route('', methods=['POST'])
@jwt_required()
def upload_material():
    identity = json.loads(get_jwt_identity())
    if identity['role'] != 'mentor':
        return jsonify({"message": "Unauthorized"}), 403
        
    data = request.get_json() or {}
    title = data.get('title')
    file_url = data.get('file_url')
    category = data.get('category')
    subject = data.get('subject')
    
    if not title or not file_url or not category or not subject:
        return jsonify({"message": "Missing required fields"}), 400
        
    # Target students
    student_ids = data.get('student_ids')
    
    from models import User
    if student_ids:
        students = User.query.filter(
            User.id.in_(student_ids),
            User.mentor_id == identity['id'],
            User.role == 'student'
        ).all()
    else:
        students = []
        
    if not students:
        new_material = LibraryMaterial(
            title=title,
            subject=subject,
            category=category,
            description=data.get('description'),
            tags=data.get('tags'),
            file_url=file_url,
            thumbnail_url=data.get('thumbnail_url'),
            visibility=data.get('visibility', 'Public'),
            uploaded_by_id=identity['id'],
            student_id=None
        )
        db.session.add(new_material)
        db.session.commit()
        
        # Notify all students of mentor
        all_students = User.query.filter_by(mentor_id=identity['id'], role='student').all()
        if new_material.visibility == 'Public':
            for student in all_students:
                notif = Notification(
                    user_id=student.id,
                    title="New Resource Uploaded",
                    content=f"A new file has been added to the library by your mentor: {new_material.title} ({new_material.category})",
                    notification_type="material"
                )
                db.session.add(notif)
            db.session.commit()
            
        return jsonify({"message": "Material uploaded successfully", "id": new_material.id}), 201
        
    first_mat_id = None
    for student in students:
        new_material = LibraryMaterial(
            title=title,
            subject=subject,
            category=category,
            description=data.get('description'),
            tags=data.get('tags'),
            file_url=file_url,
            thumbnail_url=data.get('thumbnail_url'),
            visibility=data.get('visibility', 'Public'),
            uploaded_by_id=identity['id'],
            student_id=student.id
        )
        db.session.add(new_material)
        db.session.commit()
        if not first_mat_id:
            first_mat_id = new_material.id
            
        notif = Notification(
            user_id=student.id,
            title="New Resource Uploaded",
            content=f"A new file has been added to the library by your mentor: {new_material.title} ({new_material.category})",
            notification_type="material"
        )
        db.session.add(notif)
        db.session.commit()
        
    return jsonify({"message": "Material uploaded successfully", "id": first_mat_id}), 201

@library_bp.route('/<int:mat_id>', methods=['DELETE'])
@jwt_required()
def delete_material(mat_id):
    identity = json.loads(get_jwt_identity())
    if identity['role'] not in ['mentor', 'admin']:
        return jsonify({"message": "Unauthorized"}), 403
        
    mat = LibraryMaterial.query.filter_by(id=mat_id).first()
    if not mat:
        return jsonify({"message": "Material not found"}), 404
        
    if identity['role'] == 'mentor' and mat.uploaded_by_id != identity['id']:
        return jsonify({"message": "Unauthorized to delete this material"}), 403
        
    db.session.delete(mat)
    db.session.commit()
    return jsonify({"message": "Material deleted successfully"}), 200

@library_bp.route('/<int:mat_id>/bookmark', methods=['POST'])
@jwt_required()
def toggle_bookmark(mat_id):
    identity = json.loads(get_jwt_identity())
    user = User.query.get(identity['id'])
    if not user:
        return jsonify({"message": "User not found"}), 404
        
    mat = LibraryMaterial.query.get(mat_id)
    if not mat:
        return jsonify({"message": "Material not found"}), 404
        
    bookmarks = user.bookmarked_material_ids or ""
    
    # Standardize commas to avoid empty elements growing, like `,,`
    ids = [id_str for id_str in bookmarks.split(",") if id_str.strip()]
    
    if str(mat_id) in ids:
        ids.remove(str(mat_id))
        is_bookmarked = False
    else:
        ids.append(str(mat_id))
        is_bookmarked = True
        
    if ids:
        user.bookmarked_material_ids = "," + ",".join(ids) + ","
    else:
        user.bookmarked_material_ids = ""
        
    db.session.commit()
    
    return jsonify({
        "message": "Bookmark toggled successfully",
        "is_bookmarked": is_bookmarked,
        "bookmarked_material_ids": user.bookmarked_material_ids
    }), 200

@library_bp.route('/bookmark-folders', methods=['POST'])
@jwt_required()
def save_bookmark_folders():
    identity = json.loads(get_jwt_identity())
    user = User.query.get(identity['id'])
    if not user:
        return jsonify({"message": "User not found"}), 404
        
    data = request.get_json() or {}
    folders = data.get('folders')
    
    if folders is None:
        folders = {}
        
    user.bookmark_folders = json.dumps(folders)
    db.session.commit()
    
    return jsonify({"message": "Bookmark folders updated successfully"}), 200
