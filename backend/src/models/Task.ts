// backend/src/models/Task.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

export enum TaskStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

interface TaskAttributes {
  id: number;
  title: string;
  description?: string;
  customerId?: number;
  projectId?: number;
  assignedToUserId: number;
  createdByUserId: number;
  dueDate?: Date;
  dueTime?: string;
  reminderDaysBefore?: number;
  status: TaskStatus;
  isRecurring: boolean;
  recurringIntervalDays?: number;
  recurringStartDate?: string;
  recurringEndDate?: string;
  lastTriggeredAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TaskCreationAttributes
  extends Optional<TaskAttributes, 'id' | 'status' | 'isRecurring' | 'createdAt' | 'updatedAt'> {}

class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
  declare id: number;
  declare title: string;
  declare description?: string;
  declare customerId?: number;
  declare projectId?: number;
  declare assignedToUserId: number;
  declare createdByUserId: number;
  declare dueDate?: Date;
  declare dueTime?: string;
  declare reminderDaysBefore?: number;
  declare status: TaskStatus;
  declare isRecurring: boolean;
  declare recurringIntervalDays?: number;
  declare recurringStartDate?: string;
  declare recurringEndDate?: string;
  declare lastTriggeredAt?: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Task.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'customer_id',
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'project_id',
    },
    assignedToUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'assigned_to_user_id',
    },
    createdByUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'created_by_user_id',
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'due_date',
    },
    dueTime: {
      type: DataTypes.STRING(5),
      allowNull: true,
      field: 'due_time',
    },
    reminderDaysBefore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'reminder_days_before',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(TaskStatus)),
      allowNull: false,
      defaultValue: TaskStatus.PENDING,
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_recurring',
    },
    recurringIntervalDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'recurring_interval_days',
    },
    recurringStartDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'recurring_start_date',
    },
    recurringEndDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'recurring_end_date',
    },
    lastTriggeredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_triggered_at',
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
    tableName: 'tasks',
    timestamps: true,
  }
);

export default Task;
