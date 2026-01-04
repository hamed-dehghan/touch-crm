import { Op } from 'sequelize';
import MessageQueue, { MessageStatus } from '';
import { getSMSProvider } from '';

const MAX_RETRIES = 3;
const POLL_INTERVAL = 10000; // 10 seconds

/**
 * Process a single message from the queue
 */
const processMessage = async (message: MessageQueue): Promise<void> => {
  const smsProvider = getSMSProvider();

  try {
    const result = await smsProvider.sendSMS(message.phoneNumber, message.messageText);

    if (result.success) {
      await message.update({
        status: MessageStatus.SENT,
        sentAt: new Date(),
        errorMessage: null,
      });
      console.log(`Message ${message.id} sent successfully to ${message.phoneNumber}`);
    } else {
      const retryCount = message.retryCount + 1;

      if (retryCount >= MAX_RETRIES) {
        await message.update({
          status: MessageStatus.FAILED,
          errorMessage: result.error || 'Max retries exceeded',
          retryCount,
        });
        console.error(`Message ${message.id} failed after ${retryCount} retries`);
      } else {
        await message.update({
          retryCount,
          errorMessage: result.error || 'SMS send failed',
        });
        console.warn(`Message ${message.id} failed, retry ${retryCount}/${MAX_RETRIES}`);
      }
    }
  } catch (error: any) {
    const retryCount = message.retryCount + 1;

    if (retryCount >= MAX_RETRIES) {
      await message.update({
        status: MessageStatus.FAILED,
        errorMessage: error.message || 'Unknown error',
        retryCount,
      });
    } else {
      await message.update({
        retryCount,
        errorMessage: error.message || 'Unknown error',
      });
    }

    console.error(`Error processing message ${message.id}:`, error);
  }
};

/**
 * Process pending messages from the queue
 */
const processMessageQueue = async (): Promise<void> => {
  try {
    const now = new Date();

    // Fetch pending messages that are scheduled for now or earlier
    const pendingMessages = await MessageQueue.findAll({
      where: {
        status: MessageStatus.PENDING,
        [Op.or]: [
          { scheduledFor: null },
          { scheduledFor: { [Op.lte]: now } },
        ],
      },
      limit: 10, // Process 10 messages at a time
      order: [['createdAt', 'ASC']],
    });

    if (pendingMessages.length === 0) {
      return;
    }

    console.log(`Processing ${pendingMessages.length} messages from queue`);

    // Process messages sequentially to avoid rate limiting
    for (const message of pendingMessages) {
      await processMessage(message);
      // Small delay between messages to avoid overwhelming SMS provider
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  } catch (error) {
    console.error('Error processing message queue:', error);
  }
};

/**
 * Start the message queue worker
 */
export const startMessageWorker = (): void => {
  console.log('Starting message queue worker...');

  // Process immediately on start
  processMessageQueue();

  // Then process every POLL_INTERVAL milliseconds
  setInterval(() => {
    processMessageQueue();
  }, POLL_INTERVAL);

  console.log(`Message queue worker started (polling every ${POLL_INTERVAL / 1000}s)`);
};
