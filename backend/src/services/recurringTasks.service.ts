import { Op } from 'sequelize';
import Task, { TaskStatus } from '';
import sequelize from '../config/database';

/**
 * Process recurring tasks - duplicate tasks when interval has passed
 */
export const processRecurringTasks = async (): Promise<{
  processed: number;
  created: number;
  errors: number;
}> => {
  const now = new Date();

  // Find all recurring tasks
  const recurringTasks = await Task.findAll({
    where: {
      isRecurring: true,
      status: { [Op.in]: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] }, // Only process completed/cancelled tasks
    },
  });

  let processed = 0;
  let created = 0;
  let errors = 0;

  for (const task of recurringTasks) {
    try {
      if (!task.recurringIntervalDays || !task.lastTriggeredAt) {
        continue;
      }

      // Calculate next trigger date
      const nextTriggerDate = new Date(task.lastTriggeredAt);
      nextTriggerDate.setDate(nextTriggerDate.getDate() + task.recurringIntervalDays);

      // Check if it's time to create a new task
      if (now >= nextTriggerDate) {
        // Create duplicate task
        const newTask = await Task.create({
          title: task.title,
          description: task.description,
          projectId: task.projectId,
          assignedToUserId: task.assignedToUserId,
          createdByUserId: task.createdByUserId,
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
          status: TaskStatus.PENDING,
          isRecurring: true,
          recurringIntervalDays: task.recurringIntervalDays,
          lastTriggeredAt: now,
        });

        // Update original task's lastTriggeredAt
        await task.update({
          lastTriggeredAt: now,
        });

        created++;
      }

      processed++;
    } catch (error) {
      console.error(`Error processing recurring task ${task.id}:`, error);
      errors++;
      processed++;
    }
  }

  return { processed, created, errors };
};
