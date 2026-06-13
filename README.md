# CM Learning Hub 🚀

CM Learning Hub is a premium, modern, gamified Learning Management System (LMS) designed to connect mentors, students, and administrators under a cohesive, elegant interface. Featuring real-time chat, gamified streak tracking, interactive quiz/test grading, and visibility-restricted study libraries, it offers a state-of-the-art educational portal.

---

## 🌟 Key Features

### 👤 Role-Based Portals
*   **Students:** Check assignments, take self-graded quizzes, upload written exam sheets, track streaks and leaderboard positions, unlock achievements, and chat directly with their assigned mentor.
*   **Mentors (Teachers):** Manage assigned students, write performance notes, assign quizzes and homework with target-specific controls (by standard or student checkboxes), grade submissions, and review real-time analytics.
*   **Administrators:** Add, modify, or delete mentors and students, assign students to specific mentors, and review system-wide usage metrics.

### 📚 Study Library
*   Upload study resources (PDFs, videos, worksheets, reference books) securely.
*   **Restricted Visibility:** Study materials uploaded by a mentor are visible only to that mentor, their assigned students, and administrators.
*   Bookmark favorite resources for quick access.

### 📝 Granular Homework & Assignment Manager
*   Mentor homework creation with custom priority, description, attachment downloads, and estimated completion times.
*   **Targeted Delivery:** Homework can be assigned to all students, specific standards/grades (e.g., Grade 10, Grade 9), or selected individual students.
*   Dynamic daily completion trackers and streak counters to incentivize students.

### 💬 Interactive Communication & Notifications
*   Real-time chat messaging interface with unread count badges and desktop push notifications.
*   Automated notification system triggered on new homework assignments, library material uploads, and grading completions.

---

## 🛠️ Technology Stack

### Frontend
*   **Core:** React 19 (TypeScript), React Router 7 (SPA routing)
*   **Styling:** Tailwind CSS (v4) for custom dark/light themes and premium glassmorphic cards
*   **Animations:** Framer Motion for micro-animations and smooth transitions
*   **Charts:** Recharts for analytical student progress visualizations
*   **Icons:** Lucide React

### Backend
*   **Framework:** Flask (Python 3.x), Flask-SQLAlchemy (ORM)
*   **Database:** Supabase (PostgreSQL)
*   **Authentication:** Firebase Admin SDK (with JWT token generation for session verification)

---

## 🚀 Setup & Installation

### Backend Setup

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    .\venv\Scripts\activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Configure environment variables in a `.env` file:
    ```env
    DATABASE_URL=postgresql://<username>:<password>@<host>:<port>/<database>
    JWT_SECRET_KEY=your_jwt_secret_key
    ```
5.  Run migrations:
    ```bash
    python migrate_new_features.py
    python migrate_library_mentor.py
    ```
6.  Start the Flask server:
    ```bash
    python app.py
    ```

### Frontend Setup

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install packages:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

---

## 📄 License
This project is proprietary and confidential.
