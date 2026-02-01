module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('products', [
      {
        product_name: 'Product A',
        price: 100.0,
        tax_rate: 9.0,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        product_name: 'Product B',
        price: 250.0,
        tax_rate: 9.0,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        product_name: 'Product C',
        price: 500.0,
        tax_rate: 9.0,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        product_name: 'Product D',
        price: 1000.0,
        tax_rate: 9.0,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        product_name: 'Product E',
        price: 2000.0,
        tax_rate: 9.0,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('products', null, {});
  },
};
