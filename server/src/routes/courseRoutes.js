const express = require('express');
const router = express.Router();
const pool = require('../../config/db');

const auth = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.delete(
  '/assign',
  auth,
  roleMiddleware(['admin']),
  async (req, res) => {

    const {
      course_id,
      class_id
    } = req.body;

    try {

      await pool.query(
        `
        DELETE FROM class_courses
        WHERE
          course_id = $1
          AND class_id = $2
        `,
        [
          course_id,
          class_id
        ]
      );

      res.json({
        message:
          'Course unassigned'
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          'Failed to unassign course'
      });

    }
  }
);


router.delete(
  '/:id',
  auth,
  roleMiddleware(['admin']),
  async (req, res) => {

    const { id } = req.params;

    try {

      await pool.query(
        'DELETE FROM courses WHERE id = $1',
        [id]
      );

      res.json({
        message: 'Course deleted'
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message: 'Error deleting course'
      });

    }
  }
);

// ==============================
// CREATE COURSE (ADMIN ONLY)
// ==============================
router.post('/', auth, roleMiddleware(['admin']), async (req, res) => {
  const { title, description, teacher_id } = req.body;

  if (!teacher_id) {
    return res.status(400).json({ message: 'Teacher is required' });
  }

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO courses (title, description, teacher_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [title, description, teacher_id]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating course' });
  }
});

// ==============================
// ASSIGN COURSE  CLASS (ADMIN)
// ==============================
router.post('/assign', auth, roleMiddleware(['admin']), async (req, res) => {
  const { course_id, class_id } = req.body;

  try {
    const check = await pool.query(
      `SELECT * FROM class_courses
       WHERE class_id = $1 AND course_id = $2`,
      [class_id, course_id]
    );

    if (check.rows.length > 0) {
      return res.json({ message: 'Already assigned' });
    }

    await pool.query(
      `INSERT INTO class_courses (class_id, course_id)
       VALUES ($1, $2)`,
      [class_id, course_id]
    );

    res.json({ message: 'Assigned' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error assigning course' });
  }
});


router.get(
  '/:id/classes',
  auth,
  async (req, res) => {

    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        c.id,
        c.name

      FROM classes c

      JOIN class_courses cc
        ON cc.class_id = c.id

      WHERE cc.course_id = $1
      `,
      [id]
    );

    res.json(result.rows);
  }
);

// ==============================
// GET COURSES BASED ON ROLE
// ==============================
router.get('/', auth, async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  const {
    page = 1,
    limit = 10,
    sortBy = 'c.id',
    order = 'desc'
  } = req.query;

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const offset = (pageNum - 1) * limitNum;

  try {
    const validSort = ['c.id', 'c.title', 'c.created_at'];
    const sortColumn = validSort.includes(sortBy) ? sortBy : 'c.id';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    let query = '';
    let params = [];

    // =========================
    // ADMIN
    // =========================
    if (role === 'admin') {
      query = `
        SELECT c.*, u.name AS teacher_name
        FROM courses c
        LEFT JOIN users u ON u.id = c.teacher_id
        ORDER BY ${sortColumn} ${sortOrder}
        LIMIT $1 OFFSET $2
      `;
      params = [limitNum, offset];
    }

    // =========================
    // TEACHER
    // =========================
    else if (role === 'teacher') {
      query = `
        SELECT c.*, u.name AS teacher_name
        FROM courses c
        LEFT JOIN users u ON u.id = c.teacher_id
        WHERE c.teacher_id = $1
        ORDER BY ${sortColumn} ${sortOrder}
        LIMIT $2 OFFSET $3
      `;
      params = [userId, limitNum, offset];
    }

    // =========================
    // STUDENT
    // =========================
    else if (role === 'student') {
      query = `
        SELECT DISTINCT c.*, u.name AS teacher_name
        FROM courses c
        JOIN class_courses cc ON cc.course_id = c.id
        JOIN enrollments e ON e.class_id = cc.class_id
        LEFT JOIN users u ON u.id = c.teacher_id
        WHERE e.student_id = $1
        ORDER BY ${sortColumn} ${sortOrder}
        LIMIT $2 OFFSET $3
      `;
      params = [userId, limitNum, offset];
    }

  
    if (!query) {
      return res.status(403).json({ message: 'Invalid role' });
    }

    const result = await pool.query(query, params);

    // =========================
    // COUNT
    // =========================
    let countQuery = '';
    let countParams = [];

    if (role === 'admin') {
      countQuery = `SELECT COUNT(*) FROM courses`;
    }
    else if (role === 'teacher') {
      countQuery = `SELECT COUNT(*) FROM courses WHERE teacher_id = $1`;
      countParams = [userId];
    }
    else if (role === 'student') {
      countQuery = `
        SELECT COUNT(DISTINCT c.id)
        FROM courses c
        JOIN class_courses cc ON cc.course_id = c.id
        JOIN enrollments e ON e.class_id = cc.class_id
        WHERE e.student_id = $1
      `;
      countParams = [userId];
    }

    const count = await pool.query(countQuery, countParams);

    res.json({
      data: result.rows,
      total: Number(count.rows[0].count),
      page: pageNum,
      limit: limitNum
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching courses' });
  }
});

router.get(
  '/:id/classes',
  auth,
  async (req, res) => {

    const { id } = req.params;

    try {

      const result = await pool.query(
        `
        SELECT
          c.id,
          c.name

        FROM classes c

        JOIN class_courses cc
          ON cc.class_id = c.id

        WHERE cc.course_id = $1
        `,
        [id]
      );

      res.json(result.rows);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          'Error fetching classes'
      });

    }
  }
);
// ==============================
// GET COURSE DETAIL
// ==============================
router.get('/:id', auth, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT c.*, u.name as teacher_name
       FROM courses c
       LEFT JOIN users u ON u.id = c.teacher_id
       WHERE c.id = $1`,
      [id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching course' });
  }
});

router.put('/:id', auth, roleMiddleware(['admin']), async (req, res) => {
  const { id } = req.params;
  const { title, description, teacher_id } = req.body;

  //  VALIDATION
  if (!title || !description || !teacher_id) {
    return res.status(400).json({
      message: 'Title, description, dan teacher wajib diisi'
    });
  }

  try {
    // CHECK COURSE EXIST
    const check = await pool.query(
      'SELECT * FROM courses WHERE id = $1',
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Course tidak ditemukan' });
    }

    // UPDATE
    const result = await pool.query(
      `UPDATE courses
       SET title = $1,
           description = $2,
           teacher_id = $3
       WHERE id = $4
       RETURNING *`,
      [title, description, teacher_id, id]
    );

    res.json({
      message: 'Course Update Success',
      data: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating course ' });
  }
});



module.exports = router;