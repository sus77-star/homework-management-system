const express = require('express');
const router = express.Router();
const pool = require('../../config/db');

const { createUser, getUsers, loginUser, getLoginLogs } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
// PUBLIC
router.post('/', createUser);
router.post('/login', loginUser);

// TOGGLE STATUS
router.patch('/:id/status', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  try {
    await pool.query(
      'UPDATE users SET is_active = $1 WHERE id = $2',
      [is_active, id]
    );

    res.json({ message: 'Updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating status' });
  }
});

// DELETE USER
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// UPDATE USER
router.put('/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  const { id } = req.params;
  const { name, username, email, role_id } = req.body;

  try {
    await pool.query(
      `UPDATE users 
       SET name = $1, username = $2, email = $3, role_id = $4 
       WHERE id = $5`,
      [name, username, email, role_id, id]
    );

    res.json({ message: 'User updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Update failed' });
  }
});

router.put('/:id/password', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  // VALIDATE
  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Password too short' });
  }

  const bcrypt = require('bcrypt');

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, id]
    );

    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating password' });
  }
});

router.post('/assign-class', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  const { student_id, class_id } = req.body;

  try {
    await pool.query(
  `INSERT INTO enrollments (student_id, class_id)
   VALUES ($1, $2)
   ON CONFLICT (student_id)
   DO UPDATE SET class_id = EXCLUDED.class_id`,
  [student_id, class_id]
);

    res.json({ message: 'Student assigned to class' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error assigning student' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT 
        u.name,
        r.name as role,
        u.username,
        u.email,
        c.name as class_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN enrollments e ON e.student_id = u.id
      LEFT JOIN classes c ON c.id = e.class_id
      WHERE u.id = $1`,
      [userId]
    );

    const user = result.rows[0];

    res.json({
      name: user.name,
      role: user.role,
      nim: user.role === 'student' ? user.username : null,
      nip: user.role === 'teacher' ? user.username : null,
      class_name: user.class_name || null
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

router.get(
  '/login-logs',
  authMiddleware,
  roleMiddleware(['admin']),
  getLoginLogs
);

router.get('/', authMiddleware, roleMiddleware(['admin','teacher']), async (req, res) => {
  const { role } = req.query;

  try {
    let query = `
      SELECT 
        u.*, 
        r.name as role,
        c.name as class_name,
        c.id as class_id
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN enrollments e ON e.student_id = u.id
      LEFT JOIN classes c ON c.id = e.class_id
    `;

    if (role) {
      query += ` WHERE r.name = $1`;
      const result = await pool.query(query, [role]);
      return res.json(result.rows);
    }

    const result = await pool.query(query);
    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching users' });
  }
});



module.exports = router;