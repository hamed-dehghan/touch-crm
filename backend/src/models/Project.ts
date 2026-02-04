import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

export enum ProjectStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

interface ProjectAttributes {
  id: number;
  projectName: string;
  customerId: number;
  status: ProjectStatus;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProjectCreationAttributes
  extends Optional<ProjectAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

class Project
  extends Model<ProjectAttributes, ProjectCreationAttributes>
  implements ProjectAttributes
{
  public id!: number;
  public projectName!: string;
  public customerId!: number;
  public status!: ProjectStatus;
  public description?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Project.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    projectName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'project_name',
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'customer_id',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ProjectStatus)),
      allowNull: false,
      defaultValue: ProjectStatus.OPEN,
    },
    description: {
      type: DataTypes.TEXT,
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
    tableName: 'projects',
    timestamps: true,
  }
);

export default Project;
