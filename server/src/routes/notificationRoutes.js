const express = require('express');
const router = express.Router();
const pool = require('../../config/db');

const authMiddleware =
  require('../middleware/authMiddleware');

router.get(
  '/',
  authMiddleware,
  async (req, res) => {

    try {

      const result =
        await pool.query(
          `
          SELECT *
          FROM notifications
          WHERE user_id = $1
          ORDER BY created_at DESC
          `,
          [req.user.id]
        );

      res.json(
        result.rows
      );

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          'Error fetching notifications'
      });

    }

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
module.exports = router;