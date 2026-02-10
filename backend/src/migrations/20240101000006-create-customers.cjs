'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('customers', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      // -- Identity --
      customer_code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      customer_type: {
        type: Sequelize.ENUM('NATURAL', 'LEGAL'),
        allowNull: false,
        defaultValue: 'NATURAL',
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      company_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      brand_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      prefix: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      gender: {
        type: Sequelize.ENUM('MALE', 'FEMALE'),
        allowNull: true,
      },
      // -- Contact (simple) --
      email: {
        type: Sequelize.STRING(150),
        allowNull: true,
        unique: true,
      },
      website: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      // -- Marketing / Supplementary --
      status: {
        type: Sequelize.ENUM('LEAD', 'OPPORTUNITY', 'CUSTOMER', 'LOST'),
        allowNull: false,
        defaultValue: 'LEAD',
      },
      relationship_type: {
        type: Sequelize.ENUM('CUSTOMER', 'SUPPLIER', 'AGENT', 'COMPETITOR', 'INTERNAL_STAFF'),
        allowNull: false,
        defaultValue: 'CUSTOMER',
      },
      acquisition_channel: {
        type: Sequelize.ENUM('INSTAGRAM', 'EXHIBITION', 'WEBSITE', 'REFERRAL', 'EVENT', 'PREVIOUS_ACQUAINTANCE', 'OTHER'),
        allowNull: true,
      },
      customer_level_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'customer_levels',
          key: 'id',
        },
      },
      referred_by_customer_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'customers',
          key: 'id',
        },
      },
      // -- Psychology / Notes --
      interests: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      psychology: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      catchphrases: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      notable_points: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      birth_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      wedding_anniversary: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      // -- Documents --
      profile_image_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      // -- Timestamps --
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('customers');
  },
};
