import { startRFMJob } from '';
import { startBirthdayMessagesJob, startInactivityMessagesJob } from '';
import { startRecurringTasksJob } from '';
import { startMessageWorker } from '';

/**
 * Initialize all background jobs
 */
export const startJobs = () => {
  startRFMJob();
  startBirthdayMessagesJob();
  startInactivityMessagesJob();
  startRecurringTasksJob();
  startMessageWorker();
  console.log('All background jobs started');
};
