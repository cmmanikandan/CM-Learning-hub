
CREATE TABLE homework (
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
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
)

;


CREATE TABLE library_materials (
	id SERIAL NOT NULL, 
	title VARCHAR(200) NOT NULL, 
	subject VARCHAR(80) NOT NULL, 
	category VARCHAR(80) NOT NULL, 
	description TEXT, 
	tags VARCHAR(200), 
	file_url VARCHAR(256) NOT NULL, 
	thumbnail_url VARCHAR(256), 
	visibility VARCHAR(20) NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
)

;


CREATE TABLE quizzes (
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
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
)

;


CREATE TABLE users (
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
	PRIMARY KEY (id), 
	UNIQUE (username), 
	UNIQUE (email), 
	UNIQUE (firebase_uid), 
	UNIQUE (sid), 
	UNIQUE (tid), 
	FOREIGN KEY(mentor_id) REFERENCES users (id)
)

;


CREATE TABLE written_tests (
	id SERIAL NOT NULL, 
	test_name VARCHAR(200) NOT NULL, 
	subject VARCHAR(80) NOT NULL, 
	description TEXT, 
	instructions TEXT, 
	duration INTEGER NOT NULL, 
	total_marks INTEGER NOT NULL, 
	start_date TIMESTAMP WITHOUT TIME ZONE, 
	end_date TIMESTAMP WITHOUT TIME ZONE, 
	question_paper_url VARCHAR(256) NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
)

;


CREATE TABLE achievements (
	id SERIAL NOT NULL, 
	student_id INTEGER NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	description VARCHAR(256) NOT NULL, 
	unlocked_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(student_id) REFERENCES users (id)
)

;


CREATE TABLE notifications (
	id SERIAL NOT NULL, 
	user_id INTEGER NOT NULL, 
	title VARCHAR(150) NOT NULL, 
	content TEXT NOT NULL, 
	is_read BOOLEAN, 
	notification_type VARCHAR(50) NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)

;


CREATE TABLE questions (
	id SERIAL NOT NULL, 
	quiz_id INTEGER NOT NULL, 
	question_type VARCHAR(50) NOT NULL, 
	question_text TEXT NOT NULL, 
	options JSON, 
	correct_answer TEXT NOT NULL, 
	explanation TEXT, 
	marks INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(quiz_id) REFERENCES quizzes (id)
)

;


CREATE TABLE quiz_submissions (
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
	FOREIGN KEY(quiz_id) REFERENCES quizzes (id), 
	FOREIGN KEY(student_id) REFERENCES users (id)
)

;


CREATE TABLE written_test_submissions (
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
	FOREIGN KEY(test_id) REFERENCES written_tests (id), 
	FOREIGN KEY(student_id) REFERENCES users (id)
)

;

