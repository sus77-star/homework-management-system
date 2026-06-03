const express = require('express');
const router = express.Router();

const pool = require('../../config/db');

const authMiddleware =
  require('../middleware/authMiddleware');

// ==============================
// GET GRADES
// ==============================
router.get(
  '/',
  authMiddleware,

  async (req, res) => {

    try {

      const userId = req.user.id;
      const role = req.user.role;

      // =========================
      // STUDENT
      // =========================
      if (role === 'student') {

        const result = await pool.query(
          `
(
  SELECT
    s.id,
    s.assignment_id,

    s.score,
    s.grade_letter,

    'upload' AS submission_type,

    a.title AS assignment_title,
    c.title AS course_title

  FROM submissions s

  JOIN assignments a
    ON a.id = s.assignment_id

  JOIN courses c
    ON c.id = a.course_id

  WHERE
    s.student_id = $1
    AND s.score IS NOT NULL
)

UNION ALL

(
  SELECT

    MIN(sa.id) AS id,

    a.id AS assignment_id,

    COALESCE(
      SUM(sa.score),
      0
    ) AS score,

    CASE
      WHEN COALESCE(SUM(sa.score),0) >= 90 THEN 'A'
      WHEN COALESCE(SUM(sa.score),0) >= 85 THEN 'A-'
      WHEN COALESCE(SUM(sa.score),0) >= 80 THEN 'B+'
      WHEN COALESCE(SUM(sa.score),0) >= 75 THEN 'B'
      WHEN COALESCE(SUM(sa.score),0) >= 70 THEN 'B-'
      ELSE 'C'
    END AS grade_letter,

    'quiz' AS submission_type,

    a.title AS assignment_title,

    c.title AS course_title

  FROM student_answers sa

  JOIN questions q
    ON q.id = sa.question_id

  JOIN assignments a
    ON a.id = q.assignment_id

  JOIN courses c
    ON c.id = a.course_id

  WHERE sa.student_id = $1

  GROUP BY
    a.id,
    a.title,
    c.title
)

ORDER BY score DESC
          `,
          [userId]
        );

        return res.json(result.rows);
      }

      // =========================
      // TEACHER
      // =========================
      const result = await pool.query(
        `
(
  SELECT

    s.id,
    s.assignment_id,

    s.score,
    s.grade_letter,

    'upload' AS submission_type,

    u.name AS student_name,

    a.title AS assignment_title,
    c.title AS course_title

  FROM submissions s

  JOIN users u
    ON u.id = s.student_id

  JOIN assignments a
    ON a.id = s.assignment_id

  JOIN courses c
    ON c.id = a.course_id

  WHERE
    c.teacher_id = $1
    AND s.score IS NOT NULL
)

UNION ALL

(
  SELECT

    MIN(sa.id) AS id,

    a.id AS assignment_id,

    COALESCE(
      SUM(sa.score),
      0
    ) AS score,

    CASE
      WHEN COALESCE(SUM(sa.score),0) >= 90 THEN 'A'
      WHEN COALESCE(SUM(sa.score),0) >= 85 THEN 'A-'
      WHEN COALESCE(SUM(sa.score),0) >= 80 THEN 'B+'
      WHEN COALESCE(SUM(sa.score),0) >= 75 THEN 'B'
      WHEN COALESCE(SUM(sa.score),0) >= 70 THEN 'B-'
      ELSE 'C'
    END AS grade_letter,

    'quiz' AS submission_type,

    u.name AS student_name,

    a.title AS assignment_title,

    c.title AS course_title

  FROM student_answers sa

  JOIN users u
    ON u.id = sa.student_id

  JOIN questions q
    ON q.id = sa.question_id

  JOIN assignments a
    ON a.id = q.assignment_id

  JOIN courses c
    ON c.id = a.course_id

  WHERE c.teacher_id = $1

  GROUP BY
    u.name,
    a.id,
    a.title,
    c.title
)

ORDER BY score DESC
        `,
        [userId]
      );

      res.json(result.rows);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message: 'Error fetching grades'
      });
    }
  }
);

module.exports = router;