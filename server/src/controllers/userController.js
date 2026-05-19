
const pool = require('../../config/db');
const bcrypt = require('bcrypt');
const { createUserSchema } = require('../validators/userValidator');
const jwt = require('jsonwebtoken');

//  CREATE USER
exports.createUser = async (req, res) => {
  try {
    const { error } = createUserSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { name, username, email, password, role_id } = req.body;

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, username, email, password, role_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, username, email, role_id`,
      [name, username, email, hashedPassword, role_id]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error(err);

    // duplicate email
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Email already exists' });
    }

    res.status(500).json({ message: 'Error creating user' });
  }
};

//  GET USERS
exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.username, u.email, r.name AS role, u.is_active
       FROM users u
       JOIN roles r ON u.role_id = r.id`
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // FIND USER BASE USERNAME
    const result = await pool.query(
      `SELECT u.*, r.name AS role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.username = $1`,
      [username]
    );

    const user = result.rows[0];

    // user not found
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // user not active
    if (!user.is_active) {
      return res.status(403).json({ message: 'Account is disabled' });
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    try {
      await pool.query(
        `
          INSERT INTO login_logs
          (user_id, name, role)
          VALUES ($1, $2, $3)
        `,
        [
          user.id,
          user.name,
          user.role
        ]
      );
    } catch (logErr) {
      console.log('Login log error:', logErr);
    }

    // generate token
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h'
      }
    );

    // response
    res.json({
      message: 'Login successful',
      token
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login error' });
  }
};

exports.getLoginLogs = async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT  
        id,
        name,
        role,
        login_time
      FROM login_logs
      ORDER BY login_time DESC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Error fetching login logs'
    });
  }
};