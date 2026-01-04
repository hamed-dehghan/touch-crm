import cron from 'node-cron';
import { processRecurringTasks } from '';

/**
 * Recurring Tasks Job
 * Runs daily at 6:00 AM
 */
export const startRecurringTasksJob = () => {
  cron.schedule('0 6 * * *', async () => {
    console.log('Starting recurring tasks job...');
    const startTime = Date.now();

    try {
      const result = await processRecurringTasks();
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(`Recurring tasks job completed in ${duration}s`);
      console.log(`Processed: ${result.processed}, Created: ${result.created}, Errors: ${result.errors}`);
    } catch (error) {
      console.error('Recurring tasks job failed:', error);
    }
  });

  console.log('Recurring tasks job scheduled: Daily at 6:00 AM');
};
