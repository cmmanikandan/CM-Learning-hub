import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Notification, User

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('', methods=['GET'])
@jwt_required()
def get_notifications():
    current_user = json.loads(get_jwt_identity())
    
    notifications = Notification.query.filter_by(user_id=current_user['id']).order_by(Notification.created_at.desc()).all()
    
    result = []
    for notif in notifications:
        result.append({
            "id": notif.id,
            "title": notif.title,
            "content": notif.content,
            "isRead": notif.is_read,
            "type": notif.notification_type,
            "createdTime": notif.created_at.isoformat()
        })
        
    return jsonify(result), 200

@notifications_bp.route('/mark-read', methods=['POST'])
@jwt_required()
def mark_all_read():
    current_user = json.loads(get_jwt_identity())
    
    Notification.query.filter_by(user_id=current_user['id'], is_read=False).update({"is_read": True})
    db.session.commit()
    
    return jsonify({"message": "Notifications marked as read"}), 200

@notifications_bp.route('/<int:notif_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notif_id):
    current_user = json.loads(get_jwt_identity())
    
    notif = Notification.query.filter_by(id=notif_id, user_id=current_user['id']).first()
    if not notif:
        return jsonify({"message": "Notification not found"}), 404
    
    db.session.delete(notif)
    db.session.commit()
    return jsonify({"message": "Notification dismissed"}), 200

@notifications_bp.route('/clear-all', methods=['DELETE'])
@jwt_required()
def clear_all_notifications():
    current_user = json.loads(get_jwt_identity())
    
    Notification.query.filter_by(user_id=current_user['id']).delete()
    db.session.commit()
    return jsonify({"message": "All notifications cleared"}), 200
