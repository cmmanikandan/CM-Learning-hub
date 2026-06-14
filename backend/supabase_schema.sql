
-- Users Table
CREATE TABLE IF NOT EXISTS users (
	id SERIAL NOT NULL, 
	username VARCHAR(80) NOT NULL, 
	email VARCHAR(120) NOT NULL, 
	firebase_uid VARCHAR(128), 
	password_hash VARCHAR(256), 
	role VARCHAR(20) NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	photo_url VARCHAR(256), 
	sid VARCHAR(20), 
	tid VARCHAR(20), 
	mentor_id INTEGER, 
	school VARCHAR(120), 
	class_name VARCHAR(50), 
	section VARCHAR(20), 
	parent_contact VARCHAR(50), 
	streak INTEGER NOT NULL DEFAULT 0,
	mentor_notes TEXT,
	bookmarked_material_ids TEXT,
	bookmark_folders TEXT,
	assigned_date DATE,
	PRIMARY KEY (id), 
	UNIQUE (username), 
	UNIQUE (email), 
	UNIQUE (firebase_uid), 
	UNIQUE (sid), 
	UNIQUE (tid), 
	FOREIGN KEY(mentor_id) REFERENCES users (id)
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mentor_notes TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bookmarked_material_ids TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bookmark_folders TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_date DATE;


-- Homework Table
CREATE TABLE IF NOT EXISTS homework (
	id SERIAL NOT NULL, 
	date DATE NOT NULL, 
	subject VARCHAR(80) NOT NULL, 
	homework_type VARCHAR(50) NOT NULL, 
	title VARCHAR(200) NOT NULL, 
	description TEXT, 
	priority VARCHAR(20) NOT NULL, 
	estimated_time INTEGER, 
	due_date DATE, 
	attachment_url VARCHAR(256), 
	remarks TEXT, 
	status VARCHAR(20) NOT NULL, 
	carried_from_id INTEGER,
	student_id INTEGER,
	mentor_id INTEGER,
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id),
	FOREIGN KEY(carried_from_id) REFERENCES homework (id) ON DELETE SET NULL,
	FOREIGN KEY(student_id) REFERENCES users (id) ON DELETE CASCADE,
	FOREIGN KEY(mentor_id) REFERENCES users (id) ON DELETE SET NULL
);

ALTER TABLE homework ADD COLUMN IF NOT EXISTS carried_from_id INTEGER REFERENCES homework (id) ON DELETE SET NULL;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS student_id INTEGER REFERENCES users (id) ON DELETE CASCADE;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS mentor_id INTEGER REFERENCES users (id) ON DELETE SET NULL;


-- Library Materials Table
CREATE TABLE IF NOT EXISTS library_materials (
	id SERIAL NOT NULL, 
	title VARCHAR(200) NOT NULL, 
	subject VARCHAR(80) NOT NULL, 
	category VARCHAR(80) NOT NULL, 
	description TEXT, 
	tags VARCHAR(200), 
	file_url VARCHAR(256) NOT NULL, 
	thumbnail_url VARCHAR(256), 
	visibility VARCHAR(20) NOT NULL, 
	uploaded_by_id INTEGER,
	student_id INTEGER,
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id),
	FOREIGN KEY(uploaded_by_id) REFERENCES users (id) ON DELETE SET NULL,
	FOREIGN KEY(student_id) REFERENCES users (id) ON DELETE CASCADE
);

ALTER TABLE library_materials ADD COLUMN IF NOT EXISTS uploaded_by_id INTEGER REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE library_materials ADD COLUMN IF NOT EXISTS student_id INTEGER REFERENCES users (id) ON DELETE CASCADE;


-- Quizzes Table
CREATE TABLE IF NOT EXISTS quizzes (
	id SERIAL NOT NULL, 
	quiz_name VARCHAR(200) NOT NULL, 
	subject VARCHAR(80) NOT NULL, 
	chapter VARCHAR(100), 
	lesson VARCHAR(100), 
	difficulty VARCHAR(20) NOT NULL, 
	instructions TEXT, 
	time_limit INTEGER NOT NULL, 
	passing_marks INTEGER NOT NULL, 
	total_marks INTEGER NOT NULL, 
	start_time TIMESTAMP WITHOUT TIME ZONE, 
	end_time TIMESTAMP WITHOUT TIME ZONE, 
	is_bank BOOLEAN NOT NULL DEFAULT FALSE,
	assignment_date DATE,
	student_id INTEGER,
	mentor_id INTEGER,
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id),
	FOREIGN KEY(student_id) REFERENCES users (id) ON DELETE CASCADE,
	FOREIGN KEY(mentor_id) REFERENCES users (id) ON DELETE SET NULL
);

ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS is_bank BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS assignment_date DATE;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS student_id INTEGER REFERENCES users (id) ON DELETE CASCADE;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS mentor_id INTEGER REFERENCES users (id) ON DELETE SET NULL;


-- Written Tests Table
CREATE TABLE IF NOT EXISTS written_tests (
	id SERIAL NOT NULL, 
	test_name VARCHAR(200) NOT NULL, 
	subject VARCHAR(80) NOT NULL, 
	test_type VARCHAR(80) DEFAULT 'Unit Test',
	description TEXT, 
	instructions TEXT, 
	duration INTEGER NOT NULL, 
	total_marks INTEGER NOT NULL, 
	start_date TIMESTAMP WITHOUT TIME ZONE, 
	end_date TIMESTAMP WITHOUT TIME ZONE, 
	question_paper_url VARCHAR(256) NOT NULL, 
	question_paper_name VARCHAR(256),
	is_bank BOOLEAN NOT NULL DEFAULT FALSE,
	assignment_date DATE,
	student_id INTEGER,
	mentor_id INTEGER,
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id),
	FOREIGN KEY(student_id) REFERENCES users (id) ON DELETE CASCADE,
	FOREIGN KEY(mentor_id) REFERENCES users (id) ON DELETE SET NULL
);

ALTER TABLE written_tests ADD COLUMN IF NOT EXISTS test_type VARCHAR(80) DEFAULT 'Unit Test';
ALTER TABLE written_tests ADD COLUMN IF NOT EXISTS question_paper_name VARCHAR(256);
ALTER TABLE written_tests ADD COLUMN IF NOT EXISTS is_bank BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE written_tests ADD COLUMN IF NOT EXISTS assignment_date DATE;
ALTER TABLE written_tests ADD COLUMN IF NOT EXISTS student_id INTEGER REFERENCES users (id) ON DELETE CASCADE;
ALTER TABLE written_tests ADD COLUMN IF NOT EXISTS mentor_id INTEGER REFERENCES users (id) ON DELETE SET NULL;


-- Achievements Table
CREATE TABLE IF NOT EXISTS achievements (
	id SERIAL NOT NULL, 
	student_id INTEGER NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	description VARCHAR(256) NOT NULL, 
	unlocked_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(student_id) REFERENCES users (id)
);


-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
	id SERIAL NOT NULL, 
	user_id INTEGER NOT NULL, 
	title VARCHAR(150) NOT NULL, 
	content TEXT NOT NULL, 
	is_read BOOLEAN, 
	notification_type VARCHAR(50) NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);


-- Questions Table
CREATE TABLE IF NOT EXISTS questions (
	id SERIAL NOT NULL, 
	quiz_id INTEGER NOT NULL, 
	question_type VARCHAR(50) NOT NULL, 
	question_text TEXT NOT NULL, 
	options JSON, 
	correct_answer TEXT NOT NULL, 
	explanation TEXT, 
	marks INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE
);


-- Quiz Submissions Table
CREATE TABLE IF NOT EXISTS quiz_submissions (
	id SERIAL NOT NULL, 
	quiz_id INTEGER NOT NULL, 
	student_id INTEGER NOT NULL, 
	score INTEGER NOT NULL, 
	answers JSON NOT NULL, 
	accuracy FLOAT NOT NULL, 
	time_taken INTEGER NOT NULL, 
	strong_areas VARCHAR(256), 
	weak_areas VARCHAR(256), 
	submitted_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE, 
	FOREIGN KEY(student_id) REFERENCES users (id) ON DELETE CASCADE
);


-- Written Test Submissions Table
CREATE TABLE IF NOT EXISTS written_test_submissions (
	id SERIAL NOT NULL, 
	test_id INTEGER NOT NULL, 
	student_id INTEGER NOT NULL, 
	answer_sheet_url VARCHAR(256) NOT NULL, 
	submission_date TIMESTAMP WITHOUT TIME ZONE, 
	marks_obtained INTEGER, 
	remarks TEXT, 
	status VARCHAR(20) NOT NULL, 
	graded_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(test_id) REFERENCES written_tests (id) ON DELETE CASCADE, 
	FOREIGN KEY(student_id) REFERENCES users (id) ON DELETE CASCADE
);


-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
	id SERIAL NOT NULL,
	sender_id INTEGER NOT NULL,
	recipient_id INTEGER,
	content TEXT,
	file_url VARCHAR(256),
	file_name VARCHAR(256),
	is_read BOOLEAN NOT NULL DEFAULT FALSE,
	timestamp TIMESTAMP WITHOUT TIME ZONE,
	PRIMARY KEY (id),
	FOREIGN KEY(sender_id) REFERENCES users (id) ON DELETE CASCADE,
	FOREIGN KEY(recipient_id) REFERENCES users (id) ON DELETE CASCADE
);


-- Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
	id SERIAL NOT NULL,
	student_id INTEGER NOT NULL,
	date DATE NOT NULL,
	status VARCHAR(20) NOT NULL,
	created_at TIMESTAMP WITHOUT TIME ZONE,
	PRIMARY KEY (id),
	UNIQUE (student_id, date),
	FOREIGN KEY(student_id) REFERENCES users (id) ON DELETE CASCADE
);
