'use strict';

const bcrypt = require('bcryptjs'); // para encriptar el password

module.exports = {
  async up (queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('123456', 10);
    await queryInterface.bulkInsert('Users', [{
      nombre: 'Leandro',
      correo: 'leandro@example.com',
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
