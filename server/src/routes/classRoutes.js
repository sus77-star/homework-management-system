const express = require('express');
const router = express.Router();
const pool = require('../../config/db');

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// ==============================
// CREATE CLASS (ADMIN)
// ==============================
router.post('/', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  const { code, name } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO classes (code, name)
       VALUES ($1, $2)
       RETURNING *`,
      [code, name]
    );

    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error creating class' });
  }
});


// ==============================
// GET CLASSES
// ==============================
router.get('/', authMiddleware, async (req, res) => {
  const { status } = req.query;

  try {
    let query = `SELECT * FROM classes`;

    if (status === 'active') {
      query += ` WHERE is_active = true`;
    } else if (status === 'inactive') {
      query += ` WHERE is_active = false`;
    }
    
    query += ` ORDER BY id DESC`;

    const result = await pool.query(query);

    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching classes' });
  }
});


// ==============================
// UPDATE CLASS (ADMIN)
// ==============================
router.put('/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  const { id } = req.params;
  const { code, name } = req.body;

  try {
    await pool.query(
      `UPDATE classes 
       SET code = $1, name = $2 
       WHERE id = $3`,
      [code, name, id]
    );

    return res.json({ message: 'Class updated' });
  } catch (err) {
    return res.status(500).json({ message: 'Update failed' });
  }
});


// ==============================
// TOGGLE STATUS (ADMIN)
// ==============================
router.patch('/:id/status', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  try {
    await pool.query(
      `UPDATE classes 
       SET is_active = $1 
       WHERE id = $2`,
      [is_active, id]
    );

    return res.json({ message: 'Status updated' });
  } catch (err) {
    return res.status(500).json({ message: 'Error updating status' });
  }
});


// ==============================
// DELETE CLASS (ADMIN)
// ==============================
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      `DELETE FROM classes WHERE id = $1`,
      [id]
    );

    return res.json({ message: 'Deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Delete failed' });
  }
});

module.exports = router;