'use strict';

const bcrypt = require('bcryptjs'); 

module.exports = {
  async up (queryInterface, Sequelize) {
    // Usaremos la contraseña '1234' para todos
    const pass = '1234'; 
    //const hashedPassword = await bcrypt.hash(pass, 10);
    
    await queryInterface.bulkInsert('Users', [
      // --- ALUMNOS ---
      {
        codigo: "20194613", 
        nombre: "Piero S.",
        rol: "alumno",
        email: 'piero.s@ulima.pe',
        password: "pieros",
        // createdAt y updatedAt eliminados porque tu tabla no los tiene
      },

      {
        codigo: "20222909", 
        nombre: "Leandro",
        rol: "alumno",
        email: 'leandro.s@ulima.pe',
        password: "leandro123",
        // createdAt y updatedAt eliminados porque tu tabla no los tiene
      },
      
      
      // --- REPARTIDORES ---
      {
        codigo: "R001", 
        nombre: "Piero Rodrigo",
        rol: "repartidor",
        email: 'piero.r@ulexpress.pe',
        password: "pierosegundo12334",
      },
      {
        codigo: "20220165", 
        nombre: "Gerardo",
        rol: "repartidor",
        email: 'gerardo@ulexpress.pe',
        password: "gerarditope",
      },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    // Elimina todos los usuarios si deshaces el seed
    await queryInterface.bulkDelete('Users', null, {});
  }
};