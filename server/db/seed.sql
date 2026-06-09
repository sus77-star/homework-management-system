INSERT INTO roles (name) VALUES
('admin'),
('teacher'),
('student');

INSERT INTO users (name, email, password, role_id)
VALUES ('Joan', 'john@gmail.com', '123456', 2);

INSERT INTO users (name, username, email, password, role_id)
VALUES ('Anya Melfissa', 'Anya', 'anya@mail.com', '123456', 1);

UPDATE users SET username = 'admin' WHERE id = 1;
UPDATE users SET username = 'Joan' WHERE id = 2;

UPDATE users SET name = 'Joan Escobar' Where id = 2;

UPDATE users SET name = 'Anya Melfissa' Where id = 1;

UPDATE users SET password = '$2b$10$ft2GupNrf614eqzhkss8a.HrbMDVD0/1C905ZtkVCE08didGVHNTW' WHERE id = 1;
UPDATE users SET password = '$2b$10$/WGZyxSXRT0ikehT.gqywefBu.D7sZyXBu/5Ii9turxj20WmF3Xou' WHERE id = 2;

INSERT INTO users (name, username, email, password, role_id)
VALUES ('Sus', 'Susila Fajar', 'john@gmail.com', '123456', 2);

update users SET id = 1 where id = 6;

SELECT username, password FROM users;

SELECT * FROM enrollments WHERE student_id =  3;

SELECT 
  e.student_id,
  e.class_id,
  cc.course_id,
  c.title
FROM enrollments e
JOIN class_courses cc ON cc.class_id = e.class_id
JOIN courses c ON c.id = cc.course_id
WHERE e.student_id = 3;

SELECT * FROM enrollments;
SELECT * FROM class_courses;

SELECT * FROM class_courses;

ALTER TABLE courses ADD COLUMN is_active BOOLEAN DEFAULT true;

ALTER TABLE courses DROP COLUMN class_id;

SELECT * FROM class_courses;
SELECT * FROM classes;
SELECT * FROM courses;
SELECT * FROM enrollments;

INSERT INTO notifications
(
  user_id,
  title,
  message
)
VALUES
(
  11,
  'Test Notification',
  'Notification system works'
);

INSERT INTO notifications
(
  user_id,
  title,
  message
)
VALUES
(
  11,
  'Homework Reminder',
  'Database Assignment is due tomorrow'
);

SELECT *
FROM assignment_reminders;

UPDATE assignment_reminders
SET reminder_time = NOW()
WHERE id = 47;

SELECT *
FROM notifications
ORDER BY created_at DESC;
SELECT *
FROM assignment_reminders
WHERE id = 39;

SELECT *
FROM student_answers sa
JOIN questions q
  ON q.id = sa.question_id
WHERE q.assignment_id = 1
AND sa.student_id = ?