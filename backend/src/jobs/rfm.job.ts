import cron from 'node-cron';
import { processAllCustomersRFM } from '../services/rfm.service';

/**
 * RFM Scoring Job
 * Runs daily at 2:00 AM
 */
export const startRFMJob = () => {
  // Schedule: Daily at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('Starting RFM scoring job...');
    const startTime = Date.now();

    try {
      const result = await processAllCustomersRFM();
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(`RFM scoring job completed in ${duration}s`);
      console.log(`Processed: ${result.processed}, Updated: ${result.updated}, Errors: ${result.errors}`);
    } catch (error) {
      console.error('RFM scoring job failed:', error);
    }
  });

  console.log('RFM scoring job scheduled: Daily at 2:00 AM');
};
