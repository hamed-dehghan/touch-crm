import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

export enum MessageStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

interface MessageQueueAttributes {
  id: number;
  customerId?: number;
  phoneNumber: string;
  messageText: string;
  status: MessageStatus;
  scheduledFor?: Date;
  sentAt?: Date;
  errorMessage?: string;
  retryCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MessageQueueCreationAttributes
  extends Optional<MessageQueueAttributes, 'id' | 'status' | 'retryCount' | 'createdAt' | 'updatedAt'> {}

class MessageQueue
  extends Model<MessageQueueAttributes, MessageQueueCreationAttributes>
  implements MessageQueueAttributes
{
  declare id: number;
  declare customerId?: number;
  declare phoneNumber: string;
  declare messageText: string;
  declare status: MessageStatus;
  declare scheduledFor?: Date;
  declare sentAt?: Date;
  declare errorMessage?: string;
  declare retryCount: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

MessageQueue.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'customer_id',
    },
    phoneNumber: {
      type: DataTypes.STRING(15),
      allowNull: false,
      field: 'phone_number',
    },
    messageText: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'message_text',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(MessageStatus)),
      allowNull: false,
      defaultValue: MessageStatus.PENDING,
    },
    scheduledFor: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'scheduled_for',
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'sent_at',
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'error_message',
    },
    retryCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'retry_count',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'message_queue',
    timestamps: true,
  }
);

export default MessageQueue;
