import requests
import json
import firebase_admin
from firebase_admin import credentials, auth
import os

# 1. Initialize Firebase client-side equivalent (using REST API since we don't have client SDK in python easily configured)
# Actually, I can just use the custom token or id token from the Admin SDK for testing!
os.environ['FIREBASE_CREDENTIALS_PATH'] = 'e:\\OneDrive\\Desktop\\CM Learning hub\\backend\\firebase-adminsdk.json'
cred = credentials.Certificate(os.environ['FIREBASE_CREDENTIALS_PATH'])
firebase_admin.initialize_app(cred)

# Get a custom token for the admin user
uid = "JkSCaMatbucTYskEp5CpVl4gQtB2"
custom_token = auth.create_custom_token(uid).decode('utf-8')

# To get an ID token from a custom token, we need the API key, which we have in frontend/src/lib/firebase.ts
api_key = "AIzaSyD1b3n99qix0vx-JeqkFzc4b8JPgmfuF_E"
verify_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key={api_key}"

res = requests.post(verify_url, json={"token": custom_token, "returnSecureToken": True})
id_token = res.json().get("idToken")

if not id_token:
    print("Failed to get ID token")
    exit(1)

# Now send this ID token to the local backend
print("Sending ID token to http://localhost:5000/api/auth/firebase-login")
login_res = requests.post('http://localhost:5000/api/auth/firebase-login', json={"idToken": id_token})
print(f"Status: {login_res.status_code}")
print(f"Response: {login_res.text}")
