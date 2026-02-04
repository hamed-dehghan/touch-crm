import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  SENT = 'SENT',
  CANCELLED = 'CANCELLED',
}

interface CampaignAttributes {
  id: number;
  name: string;
  messageTemplate: string;
  filterConditionsJson?: string;
  scheduledSendTime?: Date;
  status: CampaignStatus;
  createdByUserId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CampaignCreationAttributes
  extends Optional<CampaignAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

class Campaign
  extends Model<CampaignAttributes, CampaignCreationAttributes>
  implements CampaignAttributes
{
  public id!: number;
  public name!: string;
  public messageTemplate!: string;
  public filterConditionsJson?: string;
  public scheduledSendTime?: Date;
  public status!: CampaignStatus;
  public createdByUserId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Campaign.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    messageTemplate: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'message_template',
    },
    filterConditionsJson: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'filter_conditions_json',
    },
    scheduledSendTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'scheduled_send_time',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(CampaignStatus)),
      allowNull: false,
      defaultValue: CampaignStatus.DRAFT,
    },
    createdByUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'created_by_user_id',
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
    tableName: 'campaigns',
    timestamps: true,
  }
);

export default Campaign;
