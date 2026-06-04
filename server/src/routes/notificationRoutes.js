const express = require('express');
const router = express.Router();
const pool = require('../../config/db');

const authMiddleware =
  require('../middleware/authMiddleware');

router.get(
  '/',
  authMiddleware,
  async (req, res) => {

    const userId = req.user.id;

    const page =
      parseInt(req.query.page) || 1;

    const limit = 5;

    const offset =
      (page - 1) * limit;

    const search =
      req.query.search || '';

    const status =
      req.query.status || 'all';

    let conditions =
      ['user_id = $1'];

    let values =
      [userId];

    let idx = 2;

    if (search) {

      conditions.push(`
        (
          title ILIKE $${idx}
          OR
          message ILIKE $${idx}
        )
      `);

      values.push(`%${search}%`);

      idx++;
    }

    if (status === 'unread') {

      conditions.push(
        `is_read = false`
      );

    }

    if (status === 'read') {

      conditions.push(
        `is_read = true`
      );

    }

    const where =
      conditions.join(' AND ');

    const totalResult =
      await pool.query(
        `
        SELECT COUNT(*)
        FROM notifications
        WHERE ${where}
        `,
        values
      );

    values.push(limit);
    values.push(offset);

    const result =
      await pool.query(
        `
        SELECT *
        FROM notifications
        WHERE ${where}
        ORDER BY created_at DESC
        LIMIT $${idx}
        OFFSET $${idx + 1}
        `,
        values
      );

    res.json({
      notifications:
        result.rows,

      total:
        Number(
          totalResult.rows[0].count
        ),

      page,
      limit
    });

  }
);

router.get(
  '/unread-count',
  authMiddleware,
  async (req, res) => {

    const result =
      await pool.query(
        `
        SELECT COUNT(*)
        FROM notifications
        WHERE user_id = $1
        AND is_read = false
        `,
        [req.user.id]
      );

    res.json({
      count:
      Number(
        result.rows[0].count
      )
    });

  }
);

router.put(
  '/:id/read',
  authMiddleware,
  async (req, res) => {

    try {

      await pool.query(
        `
        UPDATE notifications
        SET is_read = true
        WHERE id = $1
        `,
        [req.params.id]
      );

      res.json({
        message:
          'Notification marked as read'
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          'Error updating notification'
      });

    }

  }
);

router.put(
  '/read-all',
  authMiddleware,
  async (req, res) => {

    await pool.query(
      `
      UPDATE notifications
      SET is_read = true
      WHERE user_id = $1
      `,
      [req.user.id]
    );

    res.json({
      message:
        'All notifications marked as read'
    });

  }
);

router.delete(
  '/read',
  authMiddleware,
  async (req, res) => {

    await pool.query(
      `
      DELETE
      FROM notifications
      WHERE user_id = $1
      AND is_read = true
      `,
      [req.user.id]
    );

    res.json({
      message:
        'Read notifications cleared'
    });

  }
);

router.get(
  '/recent',
  authMiddleware,
  async (req, res) => {

    const result =
      await pool.query(
        `
        SELECT *
        FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 5
        `,
        [req.user.id]
      );

    res.json(
      result.rows
    );

  }
);
module.exports = router;