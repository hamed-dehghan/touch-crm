// backend/src/migrations/20240101000008-create-tasks.cjs
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tasks', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      customer_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'customers',
          key: 'id',
        },
      },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'projects',
          key: 'id',
        },
      },
      assigned_to_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      created_by_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      due_time: {
        type: Sequelize.STRING(5),
        allowNull: true,
      },
      reminder_days_before: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'COMPLETED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      is_recurring: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      recurring_interval_days: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      recurring_start_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      recurring_end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      last_triggered_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
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

    // Task attachments table
    await queryInterface.createTable('task_attachments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      task_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tasks',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      file_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      file_path: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      file_type: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      description: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
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
    await queryInterface.dropTable('task_attachments');
    await queryInterface.dropTable('tasks');
  },
};
