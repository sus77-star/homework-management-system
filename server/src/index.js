require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');
const helmet = require('helmet');

const pool = require('../config/db');

const startReminderJob = require('./jobs/reminderJob');
//  ROUTES
const userRoutes = require('./routes/userRoutes');
const classRoutes = require('./routes/classRoutes');
const courseRoutes = require('./routes/courseRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const gradesRoutes = require('./routes/gradesRoutes')
const notificationRoutes = require('./routes/notificationRoutes');

// MIDDLEWARE
app.use(cors());
app.use(helmet());
app.use(express.json());

// ==============================
//  TEST DB
// ==============================
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.send(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.send('Database error');
  }
});

// ==============================
//  ROUTES
// ==============================
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/grades', gradesRoutes)
app.use('/uploads', express.static('uploads'));
app.use('/api/notifications', notificationRoutes);


app.use((err, req, res, next) => {
  if (err.message === 'Invalid file type') {
    return res.status(400).json({ message: err.message });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large' });
  }

  next(err);
});

// ==============================
//  START SERVER
// ==============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

startReminderJob();