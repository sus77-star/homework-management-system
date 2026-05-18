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
          SELECT
            s.id,
            s.score,
            s.grade_letter,
            s.feedback,

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

          ORDER BY s.submitted_at DESC
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
        SELECT
          s.id,
          s.score,
          s.grade_letter,
          s.feedback,

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

        ORDER BY s.submitted_at DESC
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