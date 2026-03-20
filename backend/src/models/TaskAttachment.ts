// backend/src/models/TaskAttachment.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface TaskAttachmentAttributes {
  id: number;
  taskId: number;
  fileName: string;
  filePath: string;
  fileType?: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TaskAttachmentCreationAttributes
  extends Optional<TaskAttachmentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class TaskAttachment
  extends Model<TaskAttachmentAttributes, TaskAttachmentCreationAttributes>
  implements TaskAttachmentAttributes
{
  declare id: number;
  declare taskId: number;
  declare fileName: string;
  declare filePath: string;
  declare fileType?: string;
  declare description?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

TaskAttachment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'task_id',
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'file_name',
    },
    filePath: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'file_path',
    },
    fileType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'file_type',
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
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
    tableName: 'task_attachments',
    timestamps: true,
  }
);

export default TaskAttachment;
