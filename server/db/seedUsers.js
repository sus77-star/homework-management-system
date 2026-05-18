const pool = require('../config/db');
const bcrypt = require('bcrypt');

const users = [
  'Brad Pitstop',
  'Tom Cruisecontrol',
  'Elon Musketeer',
  'Taylor Drift',
  'Justin Beaver',
  'Billie Eyelash',
  'Dwayne Theok',
  'Harry Plotter',
  'Cristanto Ronaldough',
  'Carl Johnson'
];

const seedUsers = async () => {
  try {
    for (let name of users) {
      const firstName = name.split(' ')[0].toLowerCase();

      const hashedPassword = await bcrypt.hash('123456', 10);

      await pool.query(
        `INSERT INTO users (name, username, email, password, role_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          name,
          firstName,
          `${firstName}@mail.com`,
          hashedPassword,
          3
        ]
      );

      console.log(`Inserted: ${name}`);
    }

    console.log('✅ Students seeded successfully');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedUsers();