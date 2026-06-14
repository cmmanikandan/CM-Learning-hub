import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, ChatMessage, User

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('', methods=['GET'])
@jwt_required()
def get_chat_history():
    identity = json.loads(get_jwt_identity())
    current_user_id = identity['id']
    
    recipient_id_str = request.args.get('recipient_id')
    
    if recipient_id_str:
        try:
            recipient_id = int(recipient_id_str)
        except ValueError:
            return jsonify({"message": "Invalid recipient_id"}), 400
            
        # Automatically mark private messages sent from recipient to current user as read
        ChatMessage.query.filter_by(
            sender_id=recipient_id,
            recipient_id=current_user_id,
            is_read=False
        ).update({ChatMessage.is_read: True}, synchronize_session=False)
        db.session.commit()

        # Fetch private chat history between current user and recipient
        messages = ChatMessage.query.filter(
            ((ChatMessage.sender_id == current_user_id) & (ChatMessage.recipient_id == recipient_id)) |
            ((ChatMessage.sender_id == recipient_id) & (ChatMessage.recipient_id == current_user_id))
        ).order_by(ChatMessage.timestamp.asc()).all()
    else:
        # Fetch general discussion board messages (recipient_id is NULL)
        messages = ChatMessage.query.filter(
            ChatMessage.recipient_id.is_(None)
        ).order_by(ChatMessage.timestamp.asc()).all()
        
    result = []
    for msg in messages:
        sender = User.query.get(msg.sender_id)
        recipient = User.query.get(msg.recipient_id) if msg.recipient_id else None
        
        result.append({
            "id": msg.id,
            "sender_id": msg.sender_id,
            "sender_name": sender.name if sender else "Unknown Sender",
            "sender_role": sender.role if sender else "student",
            "recipient_id": msg.recipient_id,
            "recipient_name": recipient.name if recipient else "Group Discussion",
            "content": msg.content,
            "file_url": msg.file_url,
            "file_name": msg.file_name,
            "is_read": msg.is_read,
            "timestamp": msg.timestamp.isoformat()
        })
        
    return jsonify(result), 200

@chat_bp.route('/all-messages', methods=['GET'])
@jwt_required()
def get_all_my_messages():
    identity = json.loads(get_jwt_identity())
    current_user_id = identity['id']
    
    messages = ChatMessage.query.filter(
        (ChatMessage.sender_id == current_user_id) |
        (ChatMessage.recipient_id == current_user_id) |
        (ChatMessage.recipient_id.is_(None))
    ).order_by(ChatMessage.timestamp.asc()).all()
    
    result = []
    for msg in messages:
        sender = User.query.get(msg.sender_id)
        recipient = User.query.get(msg.recipient_id) if msg.recipient_id else None
        result.append({
            "id": msg.id,
            "sender_id": msg.sender_id,
            "sender_name": sender.name if sender else "Unknown Sender",
            "sender_role": sender.role if sender else "student",
            "recipient_id": msg.recipient_id,
            "recipient_name": recipient.name if recipient else "Group Discussion",
            "content": msg.content,
            "file_url": msg.file_url,
            "file_name": msg.file_name,
            "is_read": msg.is_read,
            "timestamp": msg.timestamp.isoformat()
        })
        
    return jsonify(result), 200

@chat_bp.route('', methods=['POST'])
@jwt_required()
def send_chat_message():
    identity = json.loads(get_jwt_identity())
    current_user_id = identity['id']
    
    data = request.get_json() or {}
    recipient_id = data.get('recipient_id')
    content = data.get('content')
    file_url = data.get('file_url')
    file_name = data.get('file_name')
    
    if (not content or not content.strip()) and not file_url:
        return jsonify({"message": "Content or file is required"}), 400
        
    new_msg = ChatMessage(
        sender_id=current_user_id,
        recipient_id=recipient_id,
        content=(content.strip() if content else ""),
        file_url=file_url,
        file_name=file_name
    )
    
    db.session.add(new_msg)
    db.session.commit()
    
    # Return details of the sent message
    sender = User.query.get(current_user_id)
    return jsonify({
        "id": new_msg.id,
        "sender_id": new_msg.sender_id,
        "sender_name": sender.name if sender else "Unknown Sender",
        "sender_role": sender.role if sender else "student",
        "recipient_id": new_msg.recipient_id,
        "content": new_msg.content,
        "file_url": new_msg.file_url,
        "file_name": new_msg.file_name,
        "timestamp": new_msg.timestamp.isoformat()
    }), 201
