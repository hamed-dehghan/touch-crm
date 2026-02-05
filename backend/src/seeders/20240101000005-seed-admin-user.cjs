'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    // Get Administrator role ID
    const [roles] = await queryInterface.sequelize.query(
      "SELECT id FROM roles WHERE role_name = 'Administrator' LIMIT 1"
    );

    if (roles.length === 0) {
      throw new Error('Administrator role not found');
    }

    const adminRoleId = roles[0].id;
    const passwordHash = await bcrypt.hash('Admin123!', 10);

    await queryInterface.bulkInsert('users', [
      {
        username: 'admin',
        password_hash: passwordHash,
        full_name: 'System Administrator',
        email: 'admin@example.com',
        role_id: adminRoleId,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { username: 'admin' }, {});
  },
};
