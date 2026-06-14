import os
import re

files_to_modify = [
    r"frontend\src\context\AuthContext.tsx",
    r"frontend\src\context\AppContext.tsx",
    r"frontend\src\pages\StudentsManager.tsx",
    r"frontend\src\pages\StudentDashboard.tsx",
    r"frontend\src\pages\Settings.tsx",
    r"frontend\src\pages\Reports.tsx",
    r"frontend\src\pages\Register.tsx",
    r"frontend\src\pages\QuizManager.tsx",
    r"frontend\src\pages\Profile.tsx",
    r"frontend\src\pages\Login.tsx",
    r"frontend\src\pages\AdminUsers.tsx",
    r"frontend\src\pages\AdminDashboard.tsx"
]

base_dir = r"e:\OneDrive\Desktop\CM Learning hub"

for rel_path in files_to_modify:
    file_path = os.path.join(base_dir, rel_path)
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        continue
        
    print(f"Processing: {rel_path}")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Check if we need to replace URLs
    if "http://127.0.0.1:5000" not in content:
        print(f"  No hardcoded URL found in {rel_path}")
        continue
        
    # Replace URLs
    # Single quotes: 'http://127.0.0.1:5000...' -> `${API_BASE}...`
    new_content = re.sub(r"'http://127.0.0.1:5000([^'\n]*)'", r"`${API_BASE}\1`", content)
    # Double quotes: "http://127.0.0.1:5000..." -> `${API_BASE}...`
    new_content = re.sub(r'"http://127.0.0.1:5000([^"\n]*)"', r"`${API_BASE}\1`", new_content)
    # Backticks: `http://127.0.0.1:5000...` -> `${API_BASE}...`
    new_content = re.sub(r'`http://127.0.0.1:5000([^`\n]*)`', r"`${API_BASE}\1`", new_content)
    
    # Add import statement if API_BASE is referenced but not imported
    if "API_BASE" in new_content and "import { API_BASE }" not in new_content:
        lines = new_content.splitlines()
        inserted = False
        for i, line in enumerate(lines):
            if line.strip().startswith("import "):
                lines.insert(i + 1, "import { API_BASE } from '../config/api';")
                inserted = True
                break
        if not inserted:
            lines.insert(0, "import { API_BASE } from '../config/api';")
        new_content = "\n".join(lines) + "\n"
        
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"  Successfully updated {rel_path}")
