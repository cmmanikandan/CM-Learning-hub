import os
from flask import Flask, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'test'
jwt = JWTManager(app)

@app.route('/test', methods=['GET'])
@jwt_required()
def test():
    identity = get_jwt_identity()
    return jsonify(identity), 200

if __name__ == '__main__':
    with app.app_context():
        token1 = create_access_token(identity={"id": 1, "role": "student"})
        print("Generated Token:", token1)
    
    with app.test_request_context(headers={"Authorization": f"Bearer {token1}"}):
        try:
            from flask_jwt_extended import verify_jwt_in_request
            verify_jwt_in_request()
            print("JWT Verification successful! Identity:", get_jwt_identity())
        except Exception as e:
            print("JWT Verification failed!", type(e), e)
