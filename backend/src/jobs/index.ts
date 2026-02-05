import { startRFMJob } from './rfm.job.js';
import { startBirthdayMessagesJob, startInactivityMessagesJob } from './automatedMessages.job.js';
import { startRecurringTasksJob } from './recurringTasks.job.js';
import { startMessageWorker } from '../workers/messageWorker.js';

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
