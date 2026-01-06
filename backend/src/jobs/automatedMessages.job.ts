import cron from 'node-cron';
import { sendBirthdayMessages, sendInactivityMessages } from '../services/automatedMessages.service';

/**
 * Birthday Messages Job
 * Runs daily at 9:00 AM
 */
export const startBirthdayMessagesJob = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('Starting birthday messages job...');
    try {
      const count = await sendBirthdayMessages();
      console.log(`Birthday messages job completed. ${count} messages queued.`);
    } catch (error) {
      console.error('Birthday messages job failed:', error);
    }
  });

  console.log('Birthday messages job scheduled: Daily at 9:00 AM');
};

/**
 * Inactivity Messages Job
 * Runs weekly on Mondays at 10:00 AM
 */
export const startInactivityMessagesJob = () => {
  cron.schedule('0 10 * * 1', async () => {
    console.log('Starting inactivity messages job...');
    try {
      const count = await sendInactivityMessages(60); // 60 days inactive
      console.log(`Inactivity messages job completed. ${count} messages queued.`);
    } catch (error) {
      console.error('Inactivity messages job failed:', error);
    }
  });

  console.log('Inactivity messages job scheduled: Weekly on Mondays at 10:00 AM');
};
