const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../../config/db');

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      // 🔥 ambil dari params, bukan body
      const assignmentId = req.params.id;

      const result = await pool.query(
        'SELECT course_id FROM assignments WHERE id = $1',
        [assignmentId]
      );

      if (!result.rows.length) {
        return cb(new Error('Assignment not found'));
      }

      const courseId = result.rows[0].course_id;

      const dir = `uploads/courses/course_${courseId}/assignments/assignment_${assignmentId}/submissions`;

      fs.mkdirSync(dir, { recursive: true });

      cb(null, dir);

    } catch (err) {
      cb(err);
    }
  },

  filename: (req, file, cb) => {
    const userId = req.user.id;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);

    cb(null, `user_${userId}_${timestamp}${ext}`);
  }
});

module.exports = multer({ storage });