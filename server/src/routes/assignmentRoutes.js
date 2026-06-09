const express = require('express');
const router = express.Router();
const pool = require('../../config/db');

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const uploadAssignment = require('../middleware/uploadAssignment');
const uploadSubmission = require('../middleware/uploadSubmission');


// ==============================
// CREATE ASSIGNMENT
// ==============================
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['teacher']),
  uploadAssignment.single('file'),
  async (req, res) => {
    const {
      title,
      description,
      difficulty,
      course_id,
      due_date,
      allowed_formats,
      max_file_size,
      type
    } = req.body;

    try {

      if (type === 'quiz') {
        req.file = null;
      }

      const formats = allowed_formats
        ? allowed_formats
            .split(',')
            .map(f => f.trim().toLowerCase())
        : [];

      
      const maxSize = parseInt(max_file_size) || 5;

      const fileUrl = req.file
        ? `/${req.file.path.replace(/\\/g, '/')}`
        : null;

      const assignmentResult =
      await pool.query(
      `
      INSERT INTO assignments
      (
        title,
        description,
        difficulty,
        type,
        course_id,
        due_date,
        file_url,
        allowed_formats,
        max_file_size,
        created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING id
      `,
      [
        title,
        description,
        difficulty,
        type,
        course_id,
        due_date,
        fileUrl,
        formats,
        maxSize,
        req.user.id
      ]
      );

      // =========================
      // NOTIFY STUDENTS
      // =========================
      const assignmentId =
        assignmentResult.rows[0].id;
      const students =
      await pool.query(
      `
      SELECT DISTINCT e.student_id
      FROM enrollments e
      JOIN class_courses cc
        ON cc.class_id = e.class_id
      WHERE cc.course_id = $1
      `,
      [course_id]
      );

      for (const s of students.rows) {

        await pool.query(
        `
        INSERT INTO notifications
        (
          user_id,
          title,
          message,
          link
        )
        VALUES ($1,$2,$3,$4)
        `,
        [
          s.student_id,
          type === 'quiz'
            ? 'New Quiz Available'
            : 'New Assignment Available',

          type === 'quiz'
            ? `${title} quiz has been published`
            : `${title} assignment has been published`,

          `/assignments/${assignmentId}`
        ]
        );

      }

      res.json({
        message: 'Assignment created successfully'
      });

    } catch (err) {
      console.error(err);

      res.status(500).json({
        message: 'Error creating assignment'
      });
    }
  }
);

// ==============================
// GET ASSIGNMENTS
// ==============================
router.get(
  '/',
  authMiddleware,

  async (req, res) => {

    const { course_id } = req.query;

    try {

      const userId = req.user.id;
      const role = req.user.role;

      // =========================
      // STUDENT
      // =========================
      if (role === 'student') {

    let query = `
    SELECT DISTINCT
      a.*,
      c.title AS course_title,

      s.id AS submission_id,

    CASE

      WHEN a.type = 'quiz' THEN (

        EXISTS (

          SELECT 1

          FROM student_answers sa

          JOIN questions q
            ON q.id = sa.question_id

          WHERE q.assignment_id = a.id
          AND sa.student_id = $1

        )

      )

      ELSE (

        s.id IS NOT NULL

      )

    END AS submission_status,

CASE

  WHEN a.type = 'quiz' THEN (

    SELECT COALESCE(
      SUM(sa.score),
      0
    )

    FROM student_answers sa

    JOIN questions q
      ON q.id = sa.question_id

    WHERE q.assignment_id = a.id
    AND sa.student_id = $1

  )

  ELSE s.score

END AS score,

      CASE

        WHEN a.type = 'quiz' THEN (

          EXISTS (

            SELECT 1

            FROM student_answers sa

            JOIN questions q
              ON q.id = sa.question_id

            WHERE q.assignment_id = a.id
            AND sa.student_id = $1

            AND q.question_type = 'subjective'
            AND sa.score IS NULL

          )

        )

        ELSE (

          s.id IS NOT NULL
          AND s.score IS NULL

        )

      END AS pending_review,    

      (
        SELECT rr.status
        FROM resubmit_requests rr
        WHERE rr.submission_id = s.id
        ORDER BY rr.created_at DESC
        LIMIT 1
      ) AS resubmit_status

    FROM assignments a

    JOIN courses c
      ON c.id = a.course_id

    JOIN class_courses cc
      ON cc.course_id = c.id

    JOIN enrollments e
      ON e.class_id = cc.class_id

    LEFT JOIN submissions s
      ON s.assignment_id = a.id
      AND s.student_id = $1

    WHERE e.student_id = $1
    `;

        const values = [userId];

        // OPTIONAL FILTER
        if (course_id) {

          query += `
            AND a.course_id = $2
          `;

          values.push(course_id);
        }

        query += `
          ORDER BY a.due_date ASC
        `;

        const result =
          await pool.query(query, values);

        return res.json(result.rows);
      }

      // =========================
      // TEACHER
      // =========================
      let query = `
      SELECT
        a.*,
        c.title AS course_title,

        /* ======================
          SUBMISSION COUNT
        ====================== */
        CASE

          WHEN a.type = 'quiz' THEN (

            SELECT COUNT(
              DISTINCT sa.student_id
            )

            FROM student_answers sa

            JOIN questions q
              ON q.id = sa.question_id

            WHERE q.assignment_id = a.id

          )

          ELSE

            COUNT(
              DISTINCT s.id
            )

        END::int AS submission_count,

        /* ======================
          PENDING REVIEW
        ====================== */
        CASE

          WHEN a.type = 'quiz' THEN (

            SELECT COUNT(
              DISTINCT sa.student_id
            )

            FROM student_answers sa

            JOIN questions q
              ON q.id = sa.question_id

            WHERE q.assignment_id = a.id

            AND q.question_type = 'subjective'

            AND sa.score IS NULL

          )

          ELSE

            COUNT(
              DISTINCT CASE
                WHEN s.score IS NULL
                THEN s.id
              END
            )

        END::int AS pending_review,

        /* ======================
          RESUBMIT REQUEST
        ====================== */
        COUNT(
          DISTINCT CASE
            WHEN rr.status = 'pending'
            THEN rr.id
          END
        )::int AS pending_requests

      FROM assignments a

      JOIN courses c
        ON c.id = a.course_id

      LEFT JOIN submissions s
        ON s.assignment_id = a.id

      LEFT JOIN resubmit_requests rr
        ON rr.submission_id = s.id

      WHERE c.teacher_id = $1
      `;

      const values = [userId];

      // OPTIONAL FILTER
      if (course_id) {

        query += `
          AND a.course_id = $2
        `;

        values.push(course_id);
      }

      query += `
        GROUP BY a.id, c.title
        ORDER BY a.due_date ASC
      `;

      const result =
        await pool.query(query, values);

      res.json(result.rows);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message: 'Error fetching assignments'
      });
    }
  }
);

router.get(
  '/:id/reminders',
  authMiddleware,
  roleMiddleware(['student']),
  async (req, res) => {

    const assignmentId = req.params.id;
    const studentId = req.user.id;

    try {

      const assignment =
        await pool.query(
          `
          SELECT due_date
          FROM assignments
          WHERE id = $1
          `,
          [assignmentId]
        );

      const dueDate =
        new Date(
          assignment.rows[0].due_date
        );

      const result =
        await pool.query(
          `
          SELECT reminder_time
          FROM assignment_reminders
          WHERE assignment_id = $1
          AND student_id = $2
          `,
          [assignmentId, studentId]
        );

      const reminders =
        result.rows.map(r => {

          const diff =
            dueDate - new Date(r.reminder_time);

          const days =
            diff / (1000*60*60*24);

          return Math.round(days);
        });

      res.json({ reminders });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message: 'Error fetching reminders'
      });

    }

  }
);

router.post(
  '/:id/reminders',
  authMiddleware,
  roleMiddleware(['student']),
  async (req, res) => {

    const assignmentId =
      req.params.id;

    const studentId =
      req.user.id;

    const { reminders } =
      req.body;

    try {

      const assignment =
        await pool.query(
          `
          SELECT due_date
          FROM assignments
          WHERE id = $1
          `,
          [assignmentId]
        );

      const dueDate =
        new Date(
          assignment.rows[0].due_date
        );

      // Delete Existing Reminders
      await pool.query(
        `
        DELETE
        FROM assignment_reminders
        WHERE assignment_id = $1
        AND student_id = $2
        `,
        [assignmentId, studentId]
      );

      const skipped = [];
      // Insert New Reminders
      for (const day of reminders) {

        const reminderTime =
          new Date(dueDate);

        reminderTime.setHours(
          reminderTime.getHours() -
          day * 24
        );

      if (
        reminderTime <= new Date()
      ) {

        skipped.push(day);

        continue;

      }

        await pool.query(
          `
          INSERT INTO assignment_reminders
          (
            assignment_id,
            student_id,
            reminder_time
          )
          VALUES ($1,$2,$3)
          `,
          [
            assignmentId,
            studentId,
            reminderTime
          ]
        );

      }

      res.json({
        message:
          'Reminder saved',
          skipped
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          'Error saving reminder'
      });

    }

  }
);

// ==============================
// GET PENDING REQUEST COUNT
// ==============================
router.get(
  '/resubmit-requests-count',
  authMiddleware,
  roleMiddleware(['teacher']),
  async (req, res) => {

    try {

      const result = await pool.query(
        `SELECT COUNT(*) 
         FROM resubmit_requests
         WHERE status = 'pending'`
      );

      res.json({
        count: Number(result.rows[0].count)
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message: 'Error fetching count'
      });
    }
  }
);

// ==============================
// GET RESUBMIT NOTIFICATIONS
// ==============================
router.get(
  '/resubmit-notifications',
  authMiddleware,
  roleMiddleware(['teacher']),
  async (req, res) => {

    try {

      const result = await pool.query(
        `SELECT
          rr.id,
          rr.created_at,
          u.name AS student_name,
          a.title AS assignment_title
         FROM resubmit_requests rr
         JOIN users u
           ON u.id = rr.student_id
         JOIN submissions s
           ON s.id = rr.submission_id
         JOIN assignments a
           ON a.id = s.assignment_id
         WHERE rr.status = 'pending'
         ORDER BY rr.created_at DESC
         LIMIT 5`
      );

      res.json(result.rows);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message: 'Error fetching notifications'
      });
    }
  }
);

// ==============================
// UPDATE ASSIGNMENT
// ==============================
router.patch(
  '/:id',
  authMiddleware,
  roleMiddleware(['teacher']),
  async (req, res) => {

    const { id } = req.params;

    const {
      title,
      description,
      due_date,
      difficulty,
      allowed_formats,
      max_file_size
    } = req.body;

    try {

      await pool.query(
        `UPDATE assignments
         SET
           title = $1,
           description = $2,
           due_date = $3,
           difficulty = $4,
           allowed_formats = $5,
           max_file_size = $6
         WHERE id = $7`,
        [
          title,
          description,
          due_date,
          difficulty,
          allowed_formats,
          max_file_size,
          id
        ]
      );

      const assignmentInfo =
      await pool.query(
      `
      SELECT
        title,
        course_id
      FROM assignments
      WHERE id = $1
      `,
      [id]
      );

      const students =
      await pool.query(
      `
      SELECT DISTINCT e.student_id
      FROM enrollments e
      JOIN class_courses cc
        ON cc.class_id = e.class_id
      WHERE cc.course_id = $1
      `,
      [
        assignmentInfo.rows[0].course_id
      ]
      );

      for (const s of students.rows) {

        await pool.query(
        `
        INSERT INTO notifications
        (
          user_id,
          title,
          message,
          link
        )
        VALUES ($1,$2,$3,$4)
        `,
        [
          s.student_id,
          'Assignment Updated',
          `${assignmentInfo.rows[0].title} has been updated`,
          `/assignments/${id}`
        ]
        );

      }

      res.json({
        message: 'Assignment updated'
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message: 'Error updating assignment'
      });
    }
  }
);


// ==============================
// SUBMIT ASSIGNMENT
// ==============================
router.post(
  '/:id/submit',
  authMiddleware,
  roleMiddleware(['student']),

  // =========================
  // PRE-CHECK (RESUBMIT + RULES)
  // =========================
  async (req, res, next) => {
    const assignmentId = req.params.id;
    const studentId = req.user.id;

    try {
      // Get Assignment Rules
      const assign = await pool.query(
        `SELECT allowed_formats, max_file_size, due_date
         FROM assignments
         WHERE id = $1`,
        [assignmentId]
      );

      if (!assign.rows.length) {
        return res.status(404).json({ message: 'Assignment not found' });
      }

      const { allowed_formats, max_file_size } = assign.rows[0];

      // Save rules to req for later use in upload middleware
      req.allowedFormats = allowed_formats || [];
      req.maxSizeMB = max_file_size || 5;

      // =========================
      // CEK EXISTING SUBMISSION
      // =========================
      const existing = await pool.query(
  `SELECT id, status
   FROM submissions
   WHERE assignment_id = $1
   AND student_id = $2`,
  [assignmentId, studentId]
);

      if (existing.rows.length) {
        const submissionId = existing.rows[0].id;

        // LOCK if already graded
if (existing.rows[0].status === 'graded') {
  return res.status(403).json({
    message: 'Submission finalized after grading'
  });
}

        const request = await pool.query(
          `SELECT status
           FROM resubmit_requests
           WHERE submission_id = $1
           ORDER BY created_at DESC
           LIMIT 1`,
          [submissionId]
        );

        if (
  !request.rows.length ||
  request.rows[0].status !== 'approved'
) {
          return res.status(403).json({
            message: 'Resubmit not allowed'
          });
        }
      }

      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Pre-check error' });
    }
  },

  // =========================
  // UPLOAD FILE
  // =========================
  uploadSubmission.single('file'),

  // =========================
  // FINAL PROCESS
  // =========================
  async (req, res) => {
    const assignmentId = req.params.id;
    const studentId = req.user.id;

    try {
      if (!req.file) {
        return res.status(400).json({ message: 'File required' });
      }

      const fileExt = req.file.originalname.split('.').pop().toLowerCase();
      const fileSizeMB = req.file.size / (1024 * 1024);

      const allowedFormats = req.allowedFormats;
      const maxSizeMB = req.maxSizeMB;

      // =========================
      // VALIDASI FORMAT
      // =========================
      if (allowedFormats.length && !allowedFormats.includes(fileExt)) {
        return res.status(400).json({
          message: `Format not allowed. Allowed: ${allowedFormats.join(', ')}`
        });
      }

      // =========================
      // VALIDASI SIZE
      // =========================
      if (fileSizeMB > maxSizeMB) {
        return res.status(400).json({
          message: `File too large. Max ${maxSizeMB} MB`
        });
      }

      const fileUrl = `/${req.file.path.replace(/\\/g, '/')}`;

      // =========================
      // CEK EXISTING SUBMISSION
      // =========================
      const existingSubmission = await pool.query(
        `SELECT id FROM submissions
         WHERE assignment_id = $1 AND student_id = $2`,
        [assignmentId, studentId]
      );

      // =========================
      // FIRST SUBMIT
      // =========================
      if (!existingSubmission.rows.length) {
        await pool.query(
          `INSERT INTO submissions
           (assignment_id, student_id, file_url, submitted_at)
           VALUES ($1,$2,$3,NOW())`,
          [assignmentId, studentId, fileUrl]
        );

      // =========================
      // NOTIFICATION TO TEACHER
      // =========================

      const info = await pool.query(
      `
      SELECT
        u.name AS student_name,
        a.title AS assignment_title,
        c.teacher_id
      FROM users u
      JOIN assignments a
        ON a.id = $1
      JOIN courses c
        ON c.id = a.course_id
      WHERE u.id = $2
      `,
      [assignmentId, studentId]
      );

      const data = info.rows[0];

      await pool.query(
      `
      INSERT INTO notifications
      (
        user_id,
        title,
        message,
        link
      )
      VALUES ($1,$2,$3,$4)
      `,
      [
        data.teacher_id,
        'New Submission',
        `${data.student_name} submitted ${data.assignment_title}`,
        `/assignments/${assignmentId}`
      ]
      );

        await pool.query(
          `
          UPDATE assignment_reminders
          SET is_sent = true
          WHERE assignment_id = $1
          AND student_id = $2
          `,
          [assignmentId, studentId]
        );

        return res.json({ message: 'Submitted' });
      }

      // =========================
      // RESUBMIT
      // =========================
      const submissionId = existingSubmission.rows[0].id;

      await pool.query(
        `UPDATE submissions
         SET file_url = $1,
             submitted_at = NOW()
         WHERE id = $2`,
        [fileUrl, submissionId]
      );

      // =========================
      // NOTIFICATION TO TEACHER
      // =========================

      const info = await pool.query(
      `
      SELECT
        u.name AS student_name,
        a.title AS assignment_title,
        c.teacher_id
      FROM users u
      JOIN assignments a
        ON a.id = $1
      JOIN courses c
        ON c.id = a.course_id
      WHERE u.id = $2
      `,
      [
        assignmentId,
        studentId
      ]
      );

      const data = info.rows[0];

      await pool.query(
      `
      INSERT INTO notifications
      (
        user_id,
        title,
        message,
        link
      )
      VALUES ($1,$2,$3,$4)
      `,
      [
        data.teacher_id,
        'Resubmission Received',
        `${data.student_name} resubmitted ${data.assignment_title}`,
        `/assignments/${assignmentId}`
      ]
      );

          // =========================
          // MARK APPROVAL AS USED
          // =========================
          await pool.query(
            `UPDATE resubmit_requests
            SET status = 'used'
            WHERE submission_id = $1
            AND status = 'approved'`,
            [submissionId]
          );

                return res.json({ message: 'Resubmitted successfully' });

              } catch (err) {
                console.error(err);
                res.status(500).json({ message: 'Submit error' });
              }

            }
          );

// ==============================
// GET SUBMISSIONS
// ==============================
router.get(
  '/:id/submissions',
  authMiddleware,
  async (req, res) => {
    const { id } = req.params;
    const role = req.user.role;
    const userId = req.user.id;

    try {
      let query = '';
      let params = [];

      // =========================
      // TEACHER → lihat semua
      // =========================
      if (role === 'teacher') {
        query = `
          SELECT s.*, u.name as student_name
          FROM submissions s
          JOIN users u ON u.id = s.student_id
          WHERE s.assignment_id = $1
        `;
        params = [id];
      }

      // =========================
      // STUDENT → lihat sendiri
      // =========================
      else if (role === 'student') {
        query = `
          SELECT s.*, u.name as student_name
          FROM submissions s
          JOIN users u ON u.id = s.student_id
          WHERE s.assignment_id = $1
          AND s.student_id = $2
        `;
        params = [id, userId];
      }

      // =========================
      // ADMIN (optional)
      // =========================
      else if (role === 'admin') {
        query = `
          SELECT s.*, u.name as student_name
          FROM submissions s
          JOIN users u ON u.id = s.student_id
          WHERE s.assignment_id = $1
        `;
        params = [id];
      }

      const result = await pool.query(query, params);

      res.json(result.rows);

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error fetching submissions' });
    }
  }
);


// ==============================
// GRADE LETTER HELPER
// ==============================
const getGradeLetter = (score) => {

  if (score >= 90) return 'A';
  if (score >= 85) return 'A-';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'B-';

  return 'C';
};

// ==============================
// GRADE SUBMISSION
// ==============================
router.patch(
  '/submissions/:id/grade',
  authMiddleware,
  roleMiddleware(['teacher']),
  async (req, res) => {

    const { id } = req.params;

    const {
      score,
      feedback
    } = req.body;

    try {

      const gradeLetter =
        getGradeLetter(Number(score));

      const submissionInfo = await pool.query(
      `
      SELECT
        s.student_id,
        s.assignment_id,
        a.title
      FROM submissions s
      JOIN assignments a
        ON a.id = s.assignment_id
      WHERE s.id = $1
      `,
      [id]
      );

      const data =
        submissionInfo.rows[0];

      await pool.query(
        `UPDATE submissions
         SET
           score = $1,
           grade_letter = $2,
           feedback = $3,
           status = 'graded'
         WHERE id = $4`,
        [
          score,
          gradeLetter,
          feedback,
          id
        ]
      );

      await pool.query(
      `
      INSERT INTO notifications
      (
        user_id,
        title,
        message,
        link
      )
      VALUES ($1,$2,$3,$4)
      `,
      [
        data.student_id,
        'Assignment Graded',
        `${data.title} has been graded`,
        `/assignments/${data.assignment_id}`
      ]
      );

      res.json({
        message: 'Submission graded'
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message: 'Error grading'
      });
    }
  }
);

 // ==============================
// GET SINGLE ASSIGNMENT
// ==============================
router.get('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM assignments WHERE id = $1`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'Not found' });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching assignment' });
  }
});

// ==============================
// REQUEST RESUBMIT
// ==============================
router.post(
  '/:id/resubmit-requests',
  authMiddleware,
  roleMiddleware(['student']),
  async (req, res) => {

    const assignmentId = req.params.id;
    const studentId = req.user.id;
    const { reason } = req.body;

    try {

      // =========================
      // GET SUBMISSION
      // =========================
      const submission = await pool.query(
        `SELECT id, status
         FROM submissions
         WHERE assignment_id = $1
         AND student_id = $2`,
        [assignmentId, studentId]
      );

      if (!submission.rows.length) {
        return res.status(404).json({
          message: 'Submission not found'
        });
      }

      const submissionData = submission.rows[0];
      const submissionId = submissionData.id;

      // =========================
      // BLOCK IF GRADED
      // =========================
      if (submissionData.status === 'graded') {
        return res.status(403).json({
          message: 'Assignment already graded'
        });
      }

      // =========================
      // BLOCK IF STILL PENDING
      // =========================
      const existing = await pool.query(
        `SELECT id
         FROM resubmit_requests
         WHERE submission_id = $1
         AND status = 'pending'`,
        [submissionId]
      );

      if (existing.rows.length) {
        return res.status(400).json({
          message: 'Already requested, waiting approval'
        });
      }

      // =========================
      // CREATE REQUEST
      // =========================
      await pool.query(
        `INSERT INTO resubmit_requests
         (submission_id, student_id, reason)
         VALUES ($1,$2,$3)`,
        [submissionId, studentId, reason]
      );

      const info = await pool.query(
      `
      SELECT
        u.name AS student_name,
        a.title AS assignment_title,
        c.teacher_id
      FROM users u
      JOIN assignments a
        ON a.id = $1
      JOIN courses c
        ON c.id = a.course_id
      WHERE u.id = $2
      `,
      [assignmentId, studentId]
      );

      const data = info.rows[0];

      await pool.query(
      `
      INSERT INTO notifications
      (
        user_id,
        title,
        message,
        link
      )
      VALUES ($1,$2,$3,$4)
      `,
      [
        data.teacher_id,
        'Resubmit Request',
        `${data.student_name} requested resubmission for ${data.assignment_title}`,
        `/assignments/${assignmentId}`
      ]
      );

      res.json({
        message: 'Request sent'
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message: 'Error requesting resubmit'
      });
    }
  }
);



// ==============================
// GET RESUBMIT REQUESTS
// ==============================
router.get('/:id/resubmit-requests', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  const assignmentId = req.params.id;

  const result = await pool.query(
    `SELECT DISTINCT ON (rr.submission_id)
      rr.*,
      u.name AS student_name
     FROM resubmit_requests rr
     JOIN submissions s ON s.id = rr.submission_id
     JOIN users u ON u.id = rr.student_id
     WHERE s.assignment_id = $1
     ORDER BY rr.submission_id, rr.created_at DESC`,
    [assignmentId]
  );

  res.json(result.rows);
});

// ==============================
// APPROVE / REJECT
// ==============================
router.patch('/resubmit-requests/:id', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // approved / rejected

  const requestInfo = await pool.query(
  `
  SELECT
    rr.student_id,
    s.assignment_id,
    a.title
  FROM resubmit_requests rr
  JOIN submissions s
    ON s.id = rr.submission_id
  JOIN assignments a
    ON a.id = s.assignment_id
  WHERE rr.id = $1
  `,
  [id]
  );

  const data = requestInfo.rows[0];

  await pool.query(
    `UPDATE resubmit_requests
     SET status = $1,
         reviewed_at = NOW(),
         reviewed_by = $2
     WHERE id = $3`,
    [status, req.user.id, id]
  );


  await pool.query(
  `
  INSERT INTO notifications
  (
    user_id,
    title,
    message,
    link
  )
  VALUES ($1,$2,$3,$4)
  `,
  [
    data.student_id,

    status === 'approved'
      ? 'Resubmit Approved'
      : 'Resubmit Rejected',

    status === 'approved'
      ? `Your request for ${data.title} was approved`
      : `Your request for ${data.title} was rejected`,

    `/assignments/${data.assignment_id}`
  ]
  );

  res.json({
  message: 'Updated'});

});

router.get('/:id/my-submission', authMiddleware, async (req, res) => {
  const assignmentId = req.params.id;
  const userId = req.user.id;

  const result = await pool.query(
    `SELECT *
     FROM submissions
     WHERE assignment_id = $1
     AND student_id = $2`,
    [assignmentId, userId]
  );

  res.json(result.rows[0] || null);
});

router.get('/:id/resubmit-status', authMiddleware, async (req, res) => {
  const assignmentId = req.params.id;
  const studentId = req.user.id;

  try {
    const submission = await pool.query(
      `SELECT id FROM submissions
       WHERE assignment_id = $1 AND student_id = $2`,
      [assignmentId, studentId]
    );

    if (!submission.rows.length) {
      return res.json(null); // belum submit
    }

    const submissionId = submission.rows[0].id;

    const request = await pool.query(
      `SELECT status
       FROM resubmit_requests
       WHERE submission_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [submissionId]
    );

    if (!request.rows.length) {
      return res.json(null);
    }

    res.json(request.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching status' });
  }
});

 // ==============================
 // GET QUESTIONS
 // ==============================
router.get(
  '/:id/questions',

  authMiddleware,

  async (req, res) => {

    const assignmentId = req.params.id;

    try {

      // =========================
      // QUESTIONS
      // =========================
      const questionResult =
        await pool.query(
          `
            SELECT *
            FROM questions
            WHERE assignment_id = $1
            ORDER BY id ASC
          `,
          [assignmentId]
        );

      const questions =
        questionResult.rows;

      // =========================
      // ATTACH OPTIONS
      // =========================
      for (const q of questions) {

        if (
          q.question_type ===
          'single_choice'
        ) {

          const optionResult =
            await pool.query(
              `
                SELECT
                  id,
                  option_text,
                  is_correct
                FROM question_choices
                WHERE question_id = $1
                ORDER BY id ASC
              `,
              [q.id]
            );

          q.options =
            optionResult.rows;
        }
      }

      res.json(questions);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          'Error fetching questions'
      });
    }
  }
);

 // ==============================
 // CREATE QUESTION
 // ==============================
router.post(
  '/:id/questions',

  authMiddleware,
  roleMiddleware(['teacher']),

  async (req, res) => {

    const assignmentId = req.params.id;

    const {
      question_text,
      question_type,
      points,
      options,
      correct_index
    } = req.body;

// =========================
// CHECK EXISTING SUBMISSION
// =========================
const submittedCheck =
  await pool.query(
    `
      SELECT sa.id
      FROM student_answers sa
      JOIN questions q
        ON q.id = sa.question_id
      WHERE q.assignment_id = $1
      LIMIT 1
    `,
    [assignmentId]
  );

if (submittedCheck.rows.length) {

  return res.status(403).json({
    message:
      'Cannot add questions after students submitted quiz'
  });
}

    try {

      // =========================
      // INSERT QUESTION
      // =========================
      const questionResult =
        await pool.query(
          `
            INSERT INTO questions
            (
              assignment_id,
              question_text,
              question_type,
              points
            )
            VALUES ($1,$2,$3,$4)
            RETURNING id
          `,
          [
            assignmentId,
            question_text,
            question_type,
            points
          ]
        );

      const questionId =
        questionResult.rows[0].id;

      // =========================
      // SINGLE CHOICE OPTIONS
      // =========================
      if (
        question_type === 'single_choice'
      ) {

        for (
          let i = 0;
          i < options.length;
          i++
        )   {

          if (!options[i]?.trim()) continue;

          await pool.query(
            `
              INSERT INTO question_choices
              (
                question_id,
                option_text,
                is_correct
              )
              VALUES ($1,$2,$3)
            `,
            [
              questionId,
              options[i],
              i === correct_index
            ]
          );
        }
      }

      res.json({
        message:
          'Question created successfully'
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          'Error creating question'
      });
    }
  }
);

 // ==============================
 // SUBMIT QUIZ ANSWERS
 // ==============================
router.post(
  '/:id/quiz-submit',

  authMiddleware,
  roleMiddleware(['student']),

  async (req, res) => {

    const assignmentId = req.params.id;

    const studentId = req.user.id;

    const { answers } = req.body;

    // =========================
    // PREVENT DOUBLE SUBMIT
    // =========================
    const existing =
      await pool.query(
        `
          SELECT sa.id
          FROM student_answers sa
          JOIN questions q
            ON q.id = sa.question_id
          WHERE q.assignment_id = $1
          AND sa.student_id = $2
          LIMIT 1
        `,
        [
          assignmentId,
          studentId
        ]
      );

    if (existing.rows.length) {
      return res.status(400).json({
        message:
          'Quiz already submitted'
      });
    }

    try {

      // =========================
      // GET QUESTIONS
      // =========================
      const questionResult =
        await pool.query(
          `
            SELECT id, question_type
            FROM questions
            WHERE assignment_id = $1
          `,
          [assignmentId]
        );

      const questions =
        questionResult.rows;

      // =========================
      // SAVE ANSWERS
      // =========================
      for (const q of questions) {

        const answer =
          answers[q.id];

        // SUBJECTIVE
        if (
          q.question_type ===
          'subjective'
        ) {

          await pool.query(
            `
              INSERT INTO student_answers
              (
                question_id,
                student_id,
                answer_text
              )
              VALUES ($1,$2,$3)
            `,
            [
              q.id,
              studentId,
              answer || ''
            ]
          );
        }

        // SINGLE CHOICE
        if (
          q.question_type ===
          'single_choice'
        ) {

          // =====================
          // GET CORRECT ANSWER
          // =====================
          const correctResult =
            await pool.query(
              `
                SELECT
                  id
                FROM question_choices
                WHERE question_id = $1
                AND is_correct = true
                LIMIT 1
              `,
              [q.id]
            );

          const correctChoiceId =
            correctResult.rows[0]?.id;

          // =====================
          // GET QUESTION POINTS
          // =====================
          const pointResult =
            await pool.query(
              `
                SELECT points
                FROM questions
                WHERE id = $1
              `,
              [q.id]
            );

          const points =
            pointResult.rows[0]?.points || 0;

          // =====================
          // AUTO SCORE
          // =====================
          const isCorrect =
            Number(answer) ===
            Number(correctChoiceId);

          await pool.query(
            `
              INSERT INTO student_answers
              (
                question_id,
                student_id,
                choice_id,
                score
              )
              VALUES ($1,$2,$3,$4)
            `,
            [
              q.id,
              studentId,
              answer || null,

              isCorrect
                ? points
                : 0
            ]
          );
        }
      }

      // =========================
      // NOTIFICATION TO TEACHER
      // =========================

      const info = await pool.query(
      `
      SELECT
        u.name AS student_name,
        a.title AS assignment_title,
        c.teacher_id
      FROM users u
      JOIN assignments a
        ON a.id = $1
      JOIN courses c
        ON c.id = a.course_id
      WHERE u.id = $2
      `,
      [
        assignmentId,
        studentId
      ]
      );

      const data = info.rows[0];

      await pool.query(
      `
      INSERT INTO notifications
      (
        user_id,
        title,
        message,
        link
      )
      VALUES ($1,$2,$3,$4)
      `,
      [
        data.teacher_id,
        'New Quiz Submission',
        `${data.student_name} submitted quiz "${data.assignment_title}"`,
        `/assignments/${assignmentId}`
      ]
      );

      res.json({
        message:
          'Quiz submitted successfully'
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          'Error submitting quiz'
      });
    }
  }
);

      // ==============================
      // GET QUIZ ANSWERS
      // ==============================
      router.get(
        '/:id/quiz-answers',

        authMiddleware,
        roleMiddleware(['teacher']),

        async (req, res) => {

          const assignmentId = req.params.id;

          try {

            const result =
              await pool.query(
                `
                  SELECT
                    sa.id AS answer_id,

                    q.id AS question_id,
                    q.question_text,
                    q.question_type,
                    q.points,

                    u.id AS student_id,
                    u.name AS student_name,

                    sa.answer_text,
                    sa.choice_id,
                    sa.score,
                    sa.teacher_comment,

                    qc.option_text,

                    (
                      SELECT option_text
                      FROM question_choices
                      WHERE question_id = q.id
                      AND is_correct = true
                      LIMIT 1
                    ) AS correct_answer

                  FROM student_answers sa

                  JOIN questions q
                    ON q.id = sa.question_id

                  JOIN users u
                    ON u.id = sa.student_id

                  LEFT JOIN question_choices qc
                    ON qc.id = sa.choice_id

                  WHERE q.assignment_id = $1

                  ORDER BY
                    u.name ASC,
                    q.id ASC
                `,
                [assignmentId]
              );

            res.json(result.rows);

          } catch (err) {

            console.error(err);

            res.status(500).json({
              message:
                'Error fetching quiz answers'
            });
          }
        }
      );


      // ==============================
      // GRADE QUIZ ANSWER
      // ==============================
      router.patch(
        '/quiz-answers/:answerId/grade',

        authMiddleware,
        roleMiddleware(['teacher']),

        async (req, res) => {

          const { answerId } = req.params;

          const {
            score,
            teacher_comment
          } = req.body;

          try {
            // =========================
            // GET MAX QUESTION POINTS
            // =========================
            const pointResult =
              await pool.query(
                `
                  SELECT q.points
                  FROM student_answers sa
                  JOIN questions q
                    ON q.id = sa.question_id
                  WHERE sa.id = $1
                `,
                [answerId]
              );

            const maxPoints =
              Number(
                pointResult.rows[0]?.points || 0
              );

            // =========================
            // VALIDATE SCORE
            // =========================
            if (
              Number(score) < 0 ||
              Number(score) > maxPoints
            ) {

              return res.status(400).json({
                message:
                  `Score must be between 0 and ${maxPoints}`
              });
            }

            const answerInfo = await pool.query(
            `
            SELECT
              sa.student_id,
              a.id AS assignment_id,
              a.title
            FROM student_answers sa
            JOIN questions q
              ON q.id = sa.question_id
            JOIN assignments a
              ON a.id = q.assignment_id
            WHERE sa.id = $1
            `,
            [answerId]
            );

            const data =
              answerInfo.rows[0];

            await pool.query(
              `
                UPDATE student_answers
                SET
                  score = $1,
                  teacher_comment = $2
                WHERE id = $3
              `,
              [
                score,
                teacher_comment,
                answerId
              ]
            );

            await pool.query(
            `
            INSERT INTO notifications
            (
              user_id,
              title,
              message,
              link
            )
            VALUES ($1,$2,$3,$4)
            `,
            [
              data.student_id,
              'Quiz Reviewed',
              `${data.title} quiz has been reviewed`,
              `/assignments/${data.assignment_id}`
            ]
            );

            res.json({
              message:
                'Quiz answer graded successfully'
            });

          } catch (err) {

            console.error(err);

            res.status(500).json({
              message:
                'Error grading answer'
            });
          }
        }
      );

 // ==============================
 // SINGLE CHOICE ANALYTICS
 // ==============================
router.get(
  '/:id/quiz-analytics',

  authMiddleware,
  roleMiddleware(['teacher']),

  async (req, res) => {

    const assignmentId = req.params.id;

    try {

      // =========================
      // GET QUESTIONS
      // =========================
      const questionResult =
        await pool.query(
          `
          SELECT
            id,
            question_text,
            question_type,
            points
          FROM questions
          WHERE assignment_id = $1
          `,
          [assignmentId]
        );

      const questions =
        questionResult.rows;

      const analytics = [];

      // =========================
      // ANALYTICS PER QUESTION
      // =========================
      for (const q of questions) {

      if (q.question_type === 'single_choice') {

        const totalResult =
          await pool.query(
            `
            SELECT COUNT(*)::int AS total
            FROM student_answers
            WHERE question_id = $1
            `,
            [q.id]
          );

        const total =
          totalResult.rows[0].total;

        const optionResult =
          await pool.query(
            `
            SELECT
              qc.id,
              qc.option_text,
              qc.is_correct,

              COUNT(sa.id)::int
                AS selected_count,

              ARRAY_REMOVE(
                ARRAY_AGG(u.name),
                NULL
              ) AS students

            FROM question_choices qc

            LEFT JOIN student_answers sa
              ON sa.choice_id = qc.id

            LEFT JOIN users u
              ON u.id = sa.student_id

            WHERE qc.question_id = $1

            GROUP BY qc.id
            ORDER BY qc.id ASC
            `,
            [q.id]
          );

        const options =
          optionResult.rows.map(opt => ({
            ...opt,
            selection_rate:
              total > 0
                ? (
                    opt.selected_count /
                    total * 100
                  ).toFixed(1)
                : 0
          }));

        analytics.push({
          question_id: q.id,
          question_text: q.question_text,
          question_type: 'single_choice',
          points: q.points,
          total_answers: total,
          options
        });

        } else {

          const answerResult =
            await pool.query(
              `
              SELECT
                COUNT(*)::int AS total_answers,
                ROUND(AVG(score),2) AS average_score
              FROM student_answers
              WHERE question_id = $1
              `,
              [q.id]
            );

          analytics.push({
            question_id: q.id,
            question_text: q.question_text,
            question_type: 'subjective',
            points: q.points,

            total_answers:
              answerResult.rows[0].total_answers,

            average_score:
              answerResult.rows[0].average_score || 0
          });

        }
      }

      res.json(analytics);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          'Error fetching analytics'
      });
    }
  }
);

// ==============================
// QUIZ SUBMISSION STATUS
// ==============================
router.get(
  '/:id/quiz-submission-status',

  authMiddleware,
  roleMiddleware(['student']),

  async (req, res) => {

    const assignmentId =
      req.params.id;

    const studentId =
      req.user.id;

    try {

      const result =
        await pool.query(
          `
            SELECT sa.id
            FROM student_answers sa
            JOIN questions q
              ON q.id = sa.question_id
            WHERE q.assignment_id = $1
            AND sa.student_id = $2
            LIMIT 1
          `,
          [
            assignmentId,
            studentId
          ]
        );

      res.json({
        submitted:
          result.rows.length > 0
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          'Error fetching status'
      });
    }
  }
);

// ==============================
// UPDATE QUESTION
// ==============================
router.patch(
  '/questions/:questionId',

  authMiddleware,
  roleMiddleware(['teacher']),

  async (req, res) => {

    const { questionId } =
      req.params;

    const {
      question_text,
      question_type,
      points,
      options,
      correct_index
    } = req.body;

try {

  // =========================
  // CHECK STUDENT ANSWERS
  // =========================
  const answerCheck =
    await pool.query(
      `
        SELECT id
        FROM student_answers
        WHERE question_id = $1
        LIMIT 1
      `,
      [questionId]
    );

  // =========================
  // LOCK STRUCTURAL EDIT
  // =========================
  if (answerCheck.rows.length) {

    const oldQuestion =
      await pool.query(
        `
        SELECT
          question_type,
          points
        FROM questions
        WHERE id = $1
        `,
        [questionId]
      );

    const oldType =
      oldQuestion.rows[0]
        ?.question_type;

    const oldPoints =
      Number(
        oldQuestion.rows[0]
          ?.points
      );

    // =========================
    // BLOCK TYPE CHANGE
    // =========================
    if (
      oldType !== question_type
    ) {

      return res.status(403).json({
        message:
          'Question type cannot be changed after submission'
      });

    }

    // =========================
    // BLOCK POINT CHANGE
    // =========================
    if (
      oldPoints !==
      Number(points)
    ) {

      return res.status(403).json({
        message:
          'Question points cannot be changed after submission'
      });

    }

    // =========================
    // BLOCK ALL SINGLE CHOICE EDIT
    // =========================
    if (
      oldType === 'single_choice'
    ) {

      return res.status(403).json({
        message:
          'Single choice question cannot be modified after submission'
      });

    }

  }

  // =========================
  // UPDATE QUESTION
  // =========================
  await pool.query(
    `
      UPDATE questions
      SET
        question_text = $1,
        question_type = $2,
        points = $3
      WHERE id = $4
    `,
    [
      question_text,
      question_type,
      points,
      questionId
    ]
  );

  // =========================
  // UPDATE OPTIONS
  // =========================
  if (
    question_type ===
    'single_choice'
  ) {

    await pool.query(
      `
        DELETE FROM question_choices
        WHERE question_id = $1
      `,
      [questionId]
    );

    for (
      let i = 0;
      i < (options || []).length;
      i++
    ) {

      if (!options[i]?.trim())
        continue;

      await pool.query(
        `
          INSERT INTO question_choices
          (
            question_id,
            option_text,
            is_correct
          )
          VALUES ($1,$2,$3)
        `,
        [
          questionId,
          options[i],
          i === Number(correct_index)
        ]
      );
    }
  }

  res.json({
    message:
      'Question updated successfully'
  });

} catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          'Error updating question'
      });
    }
  }
);

router.get(
  '/:id/quiz-scores',
  authMiddleware,
  roleMiddleware(['teacher']),

  async (req, res) => {

    const assignmentId = req.params.id;

    try {

      const result = await pool.query(
        `
          SELECT
            u.id,
            u.name,

            COALESCE(
              SUM(sa.score),
              0
            ) AS total_score

          FROM student_answers sa

          JOIN users u
            ON u.id = sa.student_id

          JOIN questions q
            ON q.id = sa.question_id

          WHERE q.assignment_id = $1

          GROUP BY
            u.id,
            u.name

          ORDER BY
            total_score DESC
        `,
        [assignmentId]
      );

      res.json(result.rows);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message: 'Error fetching scores'
      });
    }
  }
);

router.get(
  '/:id/quiz-review',
  authMiddleware,
  roleMiddleware(['student']),
  async (req, res) => {

    const assignmentId = req.params.id;
    const studentId = req.user.id;

    try {

      const totalResult = await pool.query(
        `
        SELECT
          COALESCE(SUM(sa.score),0) AS total_score
        FROM student_answers sa
        JOIN questions q
          ON q.id = sa.question_id
        WHERE q.assignment_id = $1
        AND sa.student_id = $2
        `,
        [assignmentId, studentId]
      );

      const totalScore =
        Number(totalResult.rows[0].total_score);

      const result = await pool.query(
        `
        SELECT

          q.id,
          q.question_text,
          q.question_type,
          q.points,

          sa.answer_text,
          sa.score,
          sa.teacher_comment,

          student_choice.option_text
            AS student_answer,

          correct_choice.option_text
            AS correct_answer

        FROM questions q

        LEFT JOIN student_answers sa
          ON sa.question_id = q.id
          AND sa.student_id = $2

        LEFT JOIN question_choices student_choice
          ON student_choice.id = sa.choice_id

        LEFT JOIN question_choices correct_choice
          ON correct_choice.question_id = q.id
          AND correct_choice.is_correct = true

        WHERE q.assignment_id = $1

        ORDER BY q.id
        `,
        [assignmentId, studentId]
      );

      res.json({
        total_score: totalScore,
        max_score: 100,
        questions: result.rows
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message: 'Error fetching review'
      });

    }
  }
);

router.delete(
  '/questions/:questionId',
  authMiddleware,
  roleMiddleware(['teacher']),
  async (req, res) => {

    const { questionId } = req.params;

    try {

      // =========================
      // CHECK STUDENT ANSWERS
      // =========================
      const answerCheck =
        await pool.query(
          `
          SELECT sa.id
          FROM student_answers sa
          WHERE sa.question_id = $1
          LIMIT 1
          `,
          [questionId]
        );

      if (answerCheck.rows.length) {

        return res.status(403).json({
          message:
            'Cannot delete question after student submission'
        });

      }

      // =========================
      // DELETE OPTIONS
      // =========================
      await pool.query(
        `
        DELETE FROM question_choices
        WHERE question_id = $1
        `,
        [questionId]
      );

      // =========================
      // DELETE QUESTION
      // =========================
      await pool.query(
        `
        DELETE FROM questions
        WHERE id = $1
        `,
        [questionId]
      );

      res.json({
        message:
          'Question deleted successfully'
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          'Error deleting question'
      });

    }

  }
);
module.exports = router;