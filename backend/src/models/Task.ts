import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

interface TaskAttributes {
  id: number;
  title: string;
  description?: string;
  projectId?: number;
  assignedToUserId: number;
  createdByUserId: number;
  dueDate?: Date;
  status: TaskStatus;
  isRecurring: boolean;
  recurringIntervalDays?: number;
  lastTriggeredAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TaskCreationAttributes
  extends Optional<TaskAttributes, 'id' | 'status' | 'isRecurring' | 'createdAt' | 'updatedAt'> {}

class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
  public id!: number;
  public title!: string;
  public description?: string;
  public projectId?: number;
  public assignedToUserId!: number;
  public createdByUserId!: number;
  public dueDate?: Date;
  public status!: TaskStatus;
  public isRecurring!: boolean;
  public recurringIntervalDays?: number;
  public lastTriggeredAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
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
