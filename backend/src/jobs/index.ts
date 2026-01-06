import { startRFMJob } from './rfm.job';
import { startBirthdayMessagesJob, startInactivityMessagesJob } from './automatedMessages.job';
import { startRecurringTasksJob } from './recurringTasks.job';
import { startMessageWorker } from '../workers/messageWorker';

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
