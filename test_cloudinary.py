import requests
import json
import os
from dotenv import load_dotenv

load_dotenv('frontend/.env')

cloud_name = os.environ.get('VITE_CLOUDINARY_CLOUD_NAME')
upload_preset = os.environ.get('VITE_CLOUDINARY_UPLOAD_PRESET')

print(f"Cloud Name: {cloud_name}")
print(f"Upload Preset: {upload_preset}")

url = f"https://api.cloudinary.com/v1_1/{cloud_name}/upload"
files = {'file': ('test.pdf', b'%PDF-1.4 dummy pdf content', 'application/pdf')}
data = {'upload_preset': upload_preset}

try:
    response = requests.post(url, files=files, data=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Request failed: {e}")
