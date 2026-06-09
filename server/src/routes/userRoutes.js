const express = require('express');
const router = express.Router();
const pool = require('../../config/db');

const { createUser, getUsers, loginUser, getLoginLogs } = require('../controllers/userController');
const {updateProfileSchema} = require('../validators/userValidator')
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
// PUBLIC
router.post('/', createUser);
router.post('/login', loginUser);


router.get('/me', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT
      u.id,

      u.name,
      u.username,
      u.email,

      u.bio,
      u.phone,
      u.github,
      u.linkedin,

      r.name as role,

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
      id: user.id,

      name: user.name,

      username: user.username,
      email: user.email,

      bio: user.bio,
      phone: user.phone,
      github: user.github,
      linkedin: user.linkedin,

      role: user.role,

      class_name:
        user.class_name || null
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

router.put(
  '/me',
  authMiddleware,
  async (req, res) => {
    const userId = req.user.id;

    const {
      username,
      email,

      bio,
      phone,
      github,
      linkedin
    } = req.body;

    const {
      error
    } = updateProfileSchema.validate(
      req.body
    );

    if (error) {
      return res.status(400).json({
        message: error.details[0].message
      });
    }
    
    try {
          const {
      error
    } = updateProfileSchema.validate(
      req.body
    );

    if (error) {
      return res.status(400).json({
        message: error.details[0].message
      });
    }

      await pool.query(
        `
        UPDATE users
        SET

          username = $1,
          email = $2,

          bio = $3,
          phone = $4,
          github = $5,
          linkedin = $6

        WHERE id = $7
        `,
        [
          username,
          email,

          bio,
          phone,
          github,
          linkedin,

          userId
        ]
      );

      res.json({
        message:
          'Profile updated'
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          'Update failed'
      });

    }
  }
);

router.put(
  '/me/password',
  authMiddleware,

  async (req, res) => {

    const bcrypt =
      require('bcrypt');

    const userId =
      req.user.id;

    const {
      current_password,
      new_password
    } = req.body;

    try {

      const result =
        await pool.query(
          `
          SELECT password
          FROM users
          WHERE id = $1
          `,
          [userId]
        );

      const valid =
        await bcrypt.compare(
          current_password,
          result.rows[0].password
        );

      if (!valid) {

        return res.status(400).json({
          message:
            'Current password is incorrect'
        });

      }

      const hashed =
        await bcrypt.hash(
          new_password,
          10
        );

      await pool.query(
        `
        UPDATE users
        SET password = $1
        WHERE id = $2
        `,
        [
          hashed,
          userId
        ]
      );

      res.json({
        message:
          'Password updated'
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          'Update failed'
      });

    }
  }
);

router.get(
  '/login-logs',
  authMiddleware,
  roleMiddleware(['admin']),
  getLoginLogs
);

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
    await pool.query('DELETE FROM enrollments WHERE student_id = $1', [id]);

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