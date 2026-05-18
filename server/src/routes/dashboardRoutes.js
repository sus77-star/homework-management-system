const express = require('express');
const router = express.Router();

const pool = require('../../config/db');

const authMiddleware =
  require('../middleware/authMiddleware');

// ==============================
// DASHBOARD STATS
// ==============================
router.get(
  '/stats',
  authMiddleware,

  async (req, res) => {

    try {

      const role = req.user.role;
      const userId = req.user.id;

      // =========================
      // ADMIN
      // =========================
      if (role === 'admin') {

        const [
          users,
          students,
          teachers,
          classes,
          courses,
          assignments,
          submissions
        ] = await Promise.all([

          pool.query(
            `SELECT COUNT(*) FROM users`
          ),

          pool.query(
            `
            SELECT COUNT(*)
            FROM users u
            JOIN roles r
              ON r.id = u.role_id
            WHERE r.name = 'student'
            `
          ),

          pool.query(
            `
            SELECT COUNT(*)
            FROM users u
            JOIN roles r
              ON r.id = u.role_id
            WHERE r.name = 'teacher'
            `
          ),

          pool.query(
            `SELECT COUNT(*) FROM classes`
          ),

          pool.query(
            `SELECT COUNT(*) FROM courses`
          ),

          pool.query(
            `SELECT COUNT(*) FROM assignments`
          ),

          pool.query(
            `SELECT COUNT(*) FROM submissions`
          )

        ]);

        return res.json({

          users:
            users.rows[0].count,

          students:
            students.rows[0].count,

          teachers:
            teachers.rows[0].count,

          classes:
            classes.rows[0].count,

          courses:
            courses.rows[0].count,

          assignments:
            assignments.rows[0].count,

          submissions:
            submissions.rows[0].count
        });
      }

      // =========================
      // TEACHER
      // =========================
      if (role === 'teacher') {

        const [
          assignments,
          submissions,
          pendingRequests,
          averageScore
        ] = await Promise.all([

          pool.query(
            `
            SELECT COUNT(*)
            FROM assignments
            WHERE created_by = $1
            `,
            [userId]
          ),

          pool.query(
            `
            SELECT COUNT(*)
            FROM submissions s

            JOIN assignments a
              ON a.id = s.assignment_id

            WHERE a.created_by = $1
            `,
            [userId]
          ),

          pool.query(
            `
            SELECT COUNT(*)
            FROM resubmit_requests rr

            JOIN submissions s
              ON s.id = rr.submission_id

            JOIN assignments a
              ON a.id = s.assignment_id

            WHERE
              rr.status = 'pending'
              AND a.created_by = $1
            `,
            [userId]
          ),

          pool.query(
            `
            SELECT ROUND(
              AVG(score), 2
            ) AS avg
            FROM submissions s

            JOIN assignments a
              ON a.id = s.assignment_id

            WHERE
              a.created_by = $1
              AND score IS NOT NULL
            `,
            [userId]
          )

        ]);

        return res.json({

          assignments:
            assignments.rows[0].count,

          submissions:
            submissions.rows[0].count,

          pending_requests:
            pendingRequests.rows[0].count,

          average_score:
            averageScore.rows[0].avg || 0
        });
      }

      // =========================
      // STUDENT
      // =========================
      const [
        submitted,
        pending,
        averageScore,
        latestGrade
      ] = await Promise.all([

        pool.query(
          `
          SELECT COUNT(*)
          FROM submissions
          WHERE student_id = $1
          `,
          [userId]
        ),

        pool.query(
          `
          SELECT COUNT(*)
          FROM assignments a

          WHERE a.id NOT IN (
            SELECT assignment_id
            FROM submissions
            WHERE student_id = $1
          )
          `,
          [userId]
        ),

        pool.query(
          `
          SELECT ROUND(
            AVG(score), 2
          ) AS avg

          FROM submissions

          WHERE
            student_id = $1
            AND score IS NOT NULL
          `,
          [userId]
        ),

        pool.query(
          `
          SELECT
            score,
            grade_letter

          FROM submissions

          WHERE
            student_id = $1
            AND score IS NOT NULL

          ORDER BY submitted_at DESC
          LIMIT 1
          `,
          [userId]
        )

      ]);

      res.json({

        submitted:
          submitted.rows[0].count,

        pending:
          pending.rows[0].count,

        average_score:
          averageScore.rows[0].avg || 0,

        latest_grade:
          latestGrade.rows[0] || null
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message: 'Error fetching dashboard stats'
      });
    }
  }
);

// ==============================
// ANALYTICS
// ==============================
router.get(
  '/analytics',
  authMiddleware,

  async (req, res) => {

    try {

      const role = req.user.role;
      const userId = req.user.id;

      // =========================
      // ADMIN
      // =========================
      if (role === 'admin') {

        const users = await pool.query(`
          SELECT
            r.name AS role,
            COUNT(*)::int AS total
          FROM users u
          JOIN roles r
            ON r.id = u.role_id
          GROUP BY r.name
        `);

        const assignments = await pool.query(`
          SELECT COUNT(*)::int AS total
          FROM assignments
        `);

        const submissions = await pool.query(`
          SELECT COUNT(*)::int AS total
          FROM submissions
        `);

        return res.json({
          users: users.rows,
          assignments:
            assignments.rows[0].total,
          submissions:
            submissions.rows[0].total
        });
      }

      // =========================
      // TEACHER
      // =========================
      if (role === 'teacher') {

        const grades = await pool.query(
          `
          SELECT
            grade_letter,
            COUNT(*)::int AS total

          FROM submissions s

          JOIN assignments a
            ON a.id = s.assignment_id

          JOIN courses c
            ON c.id = a.course_id

          WHERE c.teacher_id = $1
          AND grade_letter IS NOT NULL

          GROUP BY grade_letter
          `,
          [userId]
        );

        const pending = await pool.query(
          `
          SELECT COUNT(*)::int AS total

          FROM submissions s

          JOIN assignments a
            ON a.id = s.assignment_id

          JOIN courses c
            ON c.id = a.course_id

          WHERE
            c.teacher_id = $1
            AND s.status != 'graded'
          `,
          [userId]
        );

        return res.json({
          grades: grades.rows,
          pending:
            pending.rows[0].total
        });
      }

      // =========================
      // STUDENT
      // =========================
      const scores = await pool.query(
        `
        SELECT
          a.title,
          s.score

        FROM submissions s

        JOIN assignments a
          ON a.id = s.assignment_id

        WHERE
          s.student_id = $1
          AND s.score IS NOT NULL

        ORDER BY s.submitted_at ASC
        `,
        [userId]
      );

      const completed = await pool.query(
        `
        SELECT COUNT(*)::int AS total
        FROM submissions
        WHERE student_id = $1
        `,
        [userId]
      );

      return res.json({
        scores: scores.rows,
        completed:
          completed.rows[0].total
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message: 'Error fetching analytics'
      });
    }
  }
);

module.exports = router;