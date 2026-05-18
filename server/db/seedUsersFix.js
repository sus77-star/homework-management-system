const pool = require('../config/db');
const bcrypt = require('bcrypt');

const fixPasswords = async () => {
  try {
    const result = await pool.query('SELECT id FROM users');

    for (let user of result.rows) {
      const newHash = await bcrypt.hash('123456', 10);

      await pool.query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [newHash, user.id]
      );

      console.log(`Updated user ID: ${user.id}`);
    }

    console.log(' Passwords updated with unique hashes');
    process.exit();
  } catch (err) {
    console.error(' Error:', err);
    process.exit(1);
  }
};

fixPasswords();