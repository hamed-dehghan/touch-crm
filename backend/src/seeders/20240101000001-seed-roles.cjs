'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('roles', [
      {
        role_name: 'Sales Representative',
        description: 'Front-line staff handling daily customer interactions',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        role_name: 'Sales Manager',
        description: 'Team supervision, campaign management, reporting',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        role_name: 'Administrator',
        description: 'Full system management and administration',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('roles', null, {});
  },
};
