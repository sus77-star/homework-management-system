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

      await pool.query(
        `INSERT INTO assignments 
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
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
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
            c.title AS course_title

          FROM assignments a

          JOIN courses c
            ON c.id = a.course_id

          JOIN class_courses cc
            ON cc.course_id = c.id

          JOIN enrollments e
            ON e.class_id = cc.class_id

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
          COUNT(s.id) AS submission_count

        FROM assignments a

        JOIN courses c
          ON c.id = a.course_id

        LEFT JOIN submissions s
          ON s.assignment_id = a.id

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
      // ambil rules assignment
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

      // simpan ke req biar bisa dipakai multer & next handler
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

        // ❌ LOCK kalau sudah graded
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

  await pool.query(
    `UPDATE resubmit_requests
     SET status = $1,
         reviewed_at = NOW(),
         reviewed_by = $2
     WHERE id = $3`,
    [status, req.user.id, id]
  );

  res.json({ message: 'Updated' });
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
        ) {

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
          SELECT id
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
              question_text
            FROM questions
            WHERE assignment_id = $1
            AND question_type = 'single_choice'
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

        // TOTAL ANSWERS
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

        // OPTIONS
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

              GROUP BY
                qc.id

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
          total_answers: total,
          options
        });
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
module.exports = router;