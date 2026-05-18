const multer = require('multer');
const fs = require('fs');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const courseId = req.body.course_id || req.query.course_id;

      if (!course_id) {
        return cb(new Error('course_id required'));
      }

      const dir = `uploads/courses/course_${course_id}/assignments/materials`;
      fs.mkdirSync(dir, { recursive: true });

      cb(null, dir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `material_${Date.now()}${ext}`);
  }
});

module.exports = multer({ storage });