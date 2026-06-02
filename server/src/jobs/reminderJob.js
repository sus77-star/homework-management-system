const cron = require('node-cron');
const pool = require('../../config/db');

function startReminderJob() {

  cron.schedule('*/1 * * * *', async () => {

    try {
    
      console.log('Running reminder job...');
      const result =
        await pool.query(
          `
          SELECT
            r.id,
            r.student_id,
            r.assignment_id,
            a.title
          FROM assignment_reminders r
          JOIN assignments a
            ON a.id = r.assignment_id
          WHERE r.is_sent = false
          AND r.reminder_time <= NOW()
          `
        );

      for (const row of result.rows) {

        await pool.query(
          `
          INSERT INTO notifications
          (
            user_id,
            title,
            message,
            link
          )
          VALUES ($1,$2,$3,$4)
          `,
          [
            row.student_id,
            'Homework Reminder',
            `Your assignment "${row.title}" is approaching its deadline.`,
            `/assignments/${row.assignment_id}`
          ]
        );

        await pool.query(
          `
          UPDATE assignment_reminders
          SET is_sent = true
          WHERE id = $1
          `,
          [row.id]
        );

      }

    } catch (err) {

      console.error(
        'Reminder Job Error:',
        err
      );

    }

  });

}

module.exports =
  startReminderJob;