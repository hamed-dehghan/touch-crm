// backend/src/services/recurringTasks.service.ts
import { Op } from 'sequelize';
import Task, { TaskStatus } from '../models/Task.js';

/**
 * Process recurring tasks - duplicate tasks when interval has passed.
 * Respects recurringEndDate to stop creating new instances.
 */
export const processRecurringTasks = async (): Promise<{
  processed: number;
  created: number;
  errors: number;
}> => {
  const now = new Date();

  // Find all recurring tasks that are completed or cancelled
  const recurringTasks = await Task.findAll({
    where: {
      isRecurring: true,
      status: { [Op.in]: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
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

      // Skip if past recurring end date
      if (task.recurringEndDate && new Date(task.recurringEndDate) < now) {
        processed++;
        continue;
      }

      // Calculate next trigger date
      const nextTriggerDate = new Date(task.lastTriggeredAt);
      nextTriggerDate.setDate(nextTriggerDate.getDate() + task.recurringIntervalDays);

      // Check if it's time to create a new task
      if (now >= nextTriggerDate) {
        await Task.create({
          title: task.title,
          description: task.description,
          customerId: task.customerId,
          projectId: task.projectId,
          assignedToUserId: task.assignedToUserId,
          createdByUserId: task.createdByUserId,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          dueTime: task.dueTime,
          reminderDaysBefore: task.reminderDaysBefore,
          status: TaskStatus.PENDING,
          isRecurring: true,
          recurringIntervalDays: task.recurringIntervalDays,
          recurringStartDate: task.recurringStartDate,
          recurringEndDate: task.recurringEndDate,
          lastTriggeredAt: now,
        });

        await task.update({ lastTriggeredAt: now });

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
