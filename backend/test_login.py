import urllib.request
import json

url = 'http://localhost:5000/api/auth/login'
data = json.dumps({'email': 'mani02', 'password': 'password123'}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req) as response:
        print(response.status)
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(e.code)
    print(e.read().decode('utf-8'))
print(response.status_code)
print(response.text)
