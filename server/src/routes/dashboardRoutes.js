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
averageScore,
pendingUploadReview,
pendingQuizReview
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
    AVG(score),
    2
  ) AS avg
  FROM submissions s
  JOIN assignments a
    ON a.id = s.assignment_id
  WHERE
    a.created_by = $1
    AND score IS NOT NULL
  `,
  [userId]
),

/* Upload Assignment Review */
pool.query(
  `
  SELECT COUNT(*)::int AS total

  FROM submissions s

  JOIN assignments a
    ON a.id = s.assignment_id

  WHERE
    a.created_by = $1
    AND a.type = 'upload'
    AND s.score IS NULL
  `,
  [userId]
),

/* Quiz Subjective Review */
pool.query(
  `
  SELECT COUNT(
    DISTINCT sa.student_id
  )::int AS total

  FROM student_answers sa

  JOIN questions q
    ON q.id = sa.question_id

  JOIN assignments a
    ON a.id = q.assignment_id

  WHERE
    a.created_by = $1
    AND q.question_type = 'subjective'
    AND sa.score IS NULL
  `,
  [userId]
)


]);

return res.json({


assignments:
  assignments.rows[0].count,

submissions:
  submissions.rows[0].count,

pending_review:
  Number(
    pendingUploadReview.rows[0].total
  ) +
  Number(
    pendingQuizReview.rows[0].total
  ),

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
        submittedUpload,
        submittedQuiz,
        pending,
        pendingReview,
        averageScore
      ] = await Promise.all([

        // Upload assignments submitted
        pool.query(
          `
          SELECT COUNT(*)::int AS total
          FROM submissions
          WHERE student_id = $1
          `,
          [userId]
        ),

        // Quiz submitted
        pool.query(
          `
          SELECT COUNT(
            DISTINCT q.assignment_id
          )::int AS total

          FROM student_answers sa

          JOIN questions q
            ON q.id = sa.question_id

          WHERE sa.student_id = $1
          `,
          [userId]
        ),

        // Pending assignments (class based)
        pool.query(
          `
          SELECT COUNT(*)::int AS total

          FROM assignments a

          JOIN class_courses cc
            ON cc.course_id = a.course_id

          JOIN enrollments e
            ON e.class_id = cc.class_id

          WHERE e.student_id = $1

          AND a.id NOT IN (

            SELECT assignment_id
            FROM submissions
            WHERE student_id = $1

            UNION

            SELECT DISTINCT q.assignment_id
            FROM student_answers sa
            JOIN questions q
              ON q.id = sa.question_id
            WHERE sa.student_id = $1


          )
          `,
          [userId]
        ),

        // Waiting review
        pool.query(
          `
          SELECT COUNT(*)::int AS total

          FROM submissions

          WHERE
            student_id = $1
            AND score IS NULL
          `,
          [userId]
        ),

        // Upload assignment average
        pool.query(
          `
          SELECT ROUND(
            AVG(score),
            2
          ) AS avg

          FROM submissions

          WHERE
            student_id = $1
            AND score IS NOT NULL
          `,
          [userId]
        )

      ]);

      res.json({

        submitted:
          Number(submittedUpload.rows[0].total)
          +
          Number(submittedQuiz.rows[0].total),

        pending:
          pending.rows[0].total,

        pending_review:
          pendingReview.rows[0].total,

        average_score:
          averageScore.rows[0].avg || 0

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

const pendingUploadReview = await pool.query(
`
SELECT COUNT(*)::int AS total

FROM submissions s

JOIN assignments a
ON a.id = s.assignment_id

JOIN courses c
ON c.id = a.course_id

WHERE
c.teacher_id = $1
AND a.type = 'upload'
AND s.score IS NULL
`,
[userId]
);

const pendingQuizReview = await pool.query(
`
SELECT COUNT(
DISTINCT sa.student_id
)::int AS total

FROM student_answers sa

JOIN questions q
ON q.id = sa.question_id

JOIN assignments a
ON a.id = q.assignment_id

JOIN courses c
ON c.id = a.course_id

WHERE
c.teacher_id = $1
AND q.question_type = 'subjective'
AND sa.score IS NULL
`,
[userId]
);

const pendingRequests = await pool.query(
`
SELECT COUNT(*)::int AS total

FROM resubmit_requests rr

JOIN submissions s
ON s.id = rr.submission_id

JOIN assignments a
ON a.id = s.assignment_id

JOIN courses c
ON c.id = a.course_id

WHERE
c.teacher_id = $1
AND rr.status = 'pending'
`,
[userId]
);

return res.json({

grades: grades.rows,

pending_review:
Number(
pendingUploadReview.rows[0].total
) +
Number(
pendingQuizReview.rows[0].total
),

pending_requests:
pendingRequests.rows[0].total

});

      }

      // =========================
      // STUDENT
      // =========================

      // Upload assignment scores
      const uploadScores = await pool.query(
        `
        SELECT
          a.title,
          s.score,
          s.submitted_at

        FROM submissions s

        JOIN assignments a
          ON a.id = s.assignment_id

        WHERE
          s.student_id = $1
          AND s.score IS NOT NULL
        `,
        [userId]
      );

      // Quiz scores
      const quizScores = await pool.query(
        `
        SELECT

          a.title,

          COALESCE(
            SUM(sa.score),
            0
          )::numeric AS score,

          MAX(sa.submitted_at) AS submitted_at

        FROM student_answers sa

        JOIN questions q
          ON q.id = sa.question_id

        JOIN assignments a
          ON a.id = q.assignment_id

        WHERE
          sa.student_id = $1

        GROUP BY
          a.id,
          a.title
        `,
        [userId]
      );
    
      const mergedScores = [

        ...uploadScores.rows.map(item => ({
          title: item.title,
          score: Number(item.score),
          type: 'upload',
          submitted_at: item.submitted_at
        })),

        ...quizScores.rows.map(item => ({
          title: item.title,
          score: Number(item.score),
          type: 'quiz',
          submitted_at: item.submitted_at
        }))

      ].sort(
        (a, b) =>
          new Date(a.submitted_at) -
          new Date(b.submitted_at)
      );

      const completed =

        uploadScores.rows.length +

        quizScores.rows.length;

      return res.json({

        scores: mergedScores,

        completed

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