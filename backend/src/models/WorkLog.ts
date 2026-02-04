import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface WorkLogAttributes {
  id: number;
  userId: number;
  customerId?: number;
  taskId?: number;
  logDate: Date;
  durationMinutes?: number;
  description: string;
  result: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface WorkLogCreationAttributes
  extends Optional<WorkLogAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class WorkLog
  extends Model<WorkLogAttributes, WorkLogCreationAttributes>
  implements WorkLogAttributes
{
  public id!: number;
  public userId!: number;
  public customerId?: number;
  public taskId?: number;
  public logDate!: Date;
  public durationMinutes?: number;
  public description!: string;
  public result!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

WorkLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'customer_id',
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'task_id',
    },
    logDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'log_date',
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'duration_minutes',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    result: {
      type: DataTypes.TEXT,
      allowNull: false,
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
    tableName: 'work_logs',
    timestamps: true,
  }
);

export default WorkLog;
