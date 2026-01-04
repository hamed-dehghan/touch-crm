export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('customer_levels', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      level_name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      min_score: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },
      max_score: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
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
    await queryInterface.dropTable('customer_levels');
  },
};
