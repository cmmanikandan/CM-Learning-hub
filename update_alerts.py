import re

def update_alerts():
    with open('frontend/src/pages/HomeworkManager.tsx', 'r', encoding='utf-8') as f:
        code = f.read()
    code = code.replace("alert('Failed to upload file. Please check Cloudinary configuration.');", "alert('Failed to upload file. Error: ' + (error.message || error));")
    with open('frontend/src/pages/HomeworkManager.tsx', 'w', encoding='utf-8') as f:
        f.write(code)

    with open('frontend/src/pages/LibraryManager.tsx', 'r', encoding='utf-8') as f:
        code = f.read()
    code = code.replace("alert('Failed to upload file. Please check Cloudinary configuration.');", "alert('Failed to upload file. Error: ' + (error.message || error));")
    with open('frontend/src/pages/LibraryManager.tsx', 'w', encoding='utf-8') as f:
        f.write(code)

if __name__ == '__main__':
    update_alerts()
