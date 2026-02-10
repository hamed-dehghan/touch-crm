import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

export enum SocialMediaPlatform {
  INSTAGRAM = 'INSTAGRAM',
  TELEGRAM = 'TELEGRAM',
  WHATSAPP = 'WHATSAPP',
  LINKEDIN = 'LINKEDIN',
  TWITTER = 'TWITTER',
  OTHER = 'OTHER',
}

interface CustomerSocialMediaAttributes {
  id: number;
  customerId: number;
  platform: SocialMediaPlatform;
  profileUrl: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CustomerSocialMediaCreationAttributes
  extends Optional<CustomerSocialMediaAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class CustomerSocialMedia
  extends Model<CustomerSocialMediaAttributes, CustomerSocialMediaCreationAttributes>
  implements CustomerSocialMediaAttributes
{
  declare id: number;
  declare customerId: number;
  declare platform: SocialMediaPlatform;
  declare profileUrl: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

CustomerSocialMedia.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'customer_id',
    },
    platform: {
      type: DataTypes.ENUM(...Object.values(SocialMediaPlatform)),
      allowNull: false,
    },
    profileUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'profile_url',
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
    tableName: 'customer_social_media',
    timestamps: true,
  }
);

export default CustomerSocialMedia;
