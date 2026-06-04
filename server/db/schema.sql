-- =========================
-- ROLES
-- =========================
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) UNIQUE NOT NULL
);

-- =========================
-- USERS
-- =========================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role_id INT REFERENCES roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users
ADD COLUMN username VARCHAR(50) UNIQUE;

ALTER TABLE users
ALTER COLUMN username SET NOT NULL;

-- =========================
-- CLASSES (no teacher here)
-- =========================
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_by INT REFERENCES users(id), -- admin
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE class_courses (
  id SERIAL PRIMARY KEY,
  class_id INTEGER REFERENCES classes(id),
  course_id INTEGER REFERENCES courses(id)
);

INSERT INTO class_courses (class_id, course_id)
SELECT class_id, id
FROM courses
WHERE class_id IS NOT NULL;

INSERT INTO class_courses (class_id, course_id)
SELECT class_id, id
FROM courses
WHERE class_id IS NOT NULL;

ALTER TABLE classes
RENAME COLUMN name TO code;

ALTER TABLE classes
ADD COLUMN name VARCHAR(100);

ALTER TABLE classes
ADD COLUMN is_active BOOLEAN DEFAULT true;

ALTER TABLE classes
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- =========================
-- COURSES (teacher di sini)
-- =========================
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    class_id INT REFERENCES classes(id),
    teacher_id INT REFERENCES users(id), -- 🔥 teacher di sini
    created_by INT REFERENCES users(id), -- admin
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- ENROLLMENTS (student join class)
-- =========================
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES users(id),
    class_id INT REFERENCES classes(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE enrollments
ADD CONSTRAINT unique_student_class UNIQUE (student_id, class_id);
ALTER TABLE enrollments
ADD CONSTRAINT unique_student UNIQUE (student_id);

-- =========================
-- ASSIGNMENTS
-- =========================
CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    course_id INT REFERENCES courses(id),
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- SUBMISSIONS
-- =========================
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    assignment_id INT REFERENCES assignments(id),
    student_id INT REFERENCES users(id),
    file_url TEXT,
    grade INT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE class_courses (
  id SERIAL PRIMARY KEY,
  class_id INTEGER REFERENCES classes(id),
  course_id INTEGER REFERENCES courses(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE class_courses
ADD CONSTRAINT unique_class_course UNIQUE (class_id, course_id);

ALTER TABLE class_courses
ADD COLUMN created_by INTEGER REFERENCES users(id);

SELECT * FROM class_courses;

SELECT * FROM enrollments WHERE student_id = 9;

SELECT * FROM class_courses WHERE class_id = 1;

SELECT * FROM courses;

SELECT 
  u.name,
  cl.name AS class,
  c.title
FROM users u
LEFT JOIN enrollments e ON e.student_id = u.id
LEFT JOIN classes cl ON cl.id = e.class_id
LEFT JOIN class_courses cc ON cc.class_id = cl.id
LEFT JOIN courses c ON c.id = cc.course_id
WHERE u.id = 9;

SELECT * FROM enrollments;
SELECT * FROM class_courses;

CREATE TABLE assignments (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  difficulty VARCHAR(20),
  due_date TIMESTAMP,
  allowed_formats TEXT[], -- ['pdf','docx']
  max_score INT DEFAULT 100,

  course_id INT REFERENCES courses(id),
  class_id INT REFERENCES classes(id),

  created_by INT REFERENCES users(id),

  allow_resubmit BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE submissions (
  id SERIAL PRIMARY KEY,
  assignment_id INT REFERENCES assignments(id),
  student_id INT REFERENCES users(id),

  file_url TEXT,
  submitted_at TIMESTAMP,

  score INT,
  feedback TEXT,

  status VARCHAR(20) DEFAULT 'submitted',
  -- submitted | late | graded | resubmitted

  is_late BOOLEAN DEFAULT false,
  attempt INT DEFAULT 1
);

CREATE TABLE resubmission_requests (
  id SERIAL PRIMARY KEY,
  submission_id INT REFERENCES submissions(id),
  student_id INT,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending'
);



ALTER TABLE assignments
ADD COLUMN file_url TEXT;

ALTER TABLE resubmission_requests
ADD COLUMN created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN reviewed_at TIMESTAMP,
ADD COLUMN reviewed_by INTEGER REFERENCES users(id);


ALTER TABLE users
ADD COLUMN bio TEXT;

ALTER TABLE users
ADD COLUMN phone VARCHAR(30);

ALTER TABLE users
ADD COLUMN github VARCHAR(255);

ALTER TABLE users
ADD COLUMN linkedin VARCHAR(255);

ALTER TABLE resubmit_requests
ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE resubmission_requests RENAME TO resubmit_requests;

ALTER TABLE assignments
ADD COLUMN max_file_size INTEGER; -- dalam MB

ALTER TABLE submissions
ADD COLUMN grade_letter VARCHAR(5);

CREATE TABLE login_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(100),
    role VARCHAR(20),
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE assignments
ADD COLUMN type VARCHAR(20) DEFAULT 'upload';

CREATE TABLE questions (
    id SERIAL PRIMARY KEY,

    assignment_id INTEGER
    REFERENCES assignments(id)
    ON DELETE CASCADE,

    question_text TEXT NOT NULL,

    question_type VARCHAR(20) NOT NULL,
    -- subjective / single_choice

    points INTEGER DEFAULT 0
);

CREATE TABLE question_choices (
    id SERIAL PRIMARY KEY,

    question_id INTEGER
    REFERENCES questions(id)
    ON DELETE CASCADE,

    option_text TEXT NOT NULL,

    is_correct BOOLEAN DEFAULT false
);

CREATE TABLE student_answers (
    id SERIAL PRIMARY KEY,

    question_id INTEGER
    REFERENCES questions(id)
    ON DELETE CASCADE,

    student_id INTEGER
    REFERENCES users(id)
    ON DELETE CASCADE,

    choice_id INTEGER NULL
    REFERENCES question_choices(id),

    answer_text TEXT NULL,

    score NUMERIC(5,2),

    teacher_comment TEXT,

    submitted_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE assignment_reminders (
    id SERIAL PRIMARY KEY,

    assignment_id INTEGER NOT NULL
    REFERENCES assignments(id)
    ON DELETE CASCADE,

    student_id INTEGER NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,

    reminder_time TIMESTAMP NOT NULL,

    is_sent BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,

    user_id INTEGER
    REFERENCES users(id)
    ON DELETE CASCADE,

    title VARCHAR(255),

    message TEXT,

    type VARCHAR(50),

    reference_id INTEGER,

    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE assignment_reminders
ADD CONSTRAINT unique_reminder
UNIQUE (
    assignment_id,
    student_id,
    reminder_time
);

ALTER TABLE notifications
ADD COLUMN link TEXT;

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;