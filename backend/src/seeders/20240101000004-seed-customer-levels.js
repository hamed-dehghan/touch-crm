module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('customer_levels', [
      {
        level_name: 'Bronze',
        min_score: 1.0,
        max_score: 2.5,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        level_name: 'Silver',
        min_score: 2.6,
        max_score: 3.5,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        level_name: 'Gold',
        min_score: 3.6,
        max_score: 4.5,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        level_name: 'Platinum',
        min_score: 4.6,
        max_score: 5.0,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('customer_levels', null, {});
  },
};
