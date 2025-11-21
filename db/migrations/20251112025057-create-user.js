'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      // --- 1. ESTE ES EL APARTADO PARA SABER SI ES REPARTIDOR O USUARIO ---
      rol: {
        type: Sequelize.STRING(20), 
        allowNull: false,
        // Aquí se guardará: 'alumno', 'repartidor' o 'tienda'
      },
      // ------------------------------------------------------------------
      
      // Usamos 'codigo' para el login (Ej: 20191234) en lugar de solo correo
      codigo: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      nombre: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      email: { 
        type: Sequelize.STRING(100),
        allowNull: true, // Lo dejamos opcional o único según prefieras
        unique: true
      },
      // Guardamos la contraseña encriptada aquí
      password: { 
        type: Sequelize.STRING(255),
        allowNull: false
      },
      // Campo extra por si es una tienda
      tiendaId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
      
      // Si en tu modelo User.js pusiste timestamps: false, puedes borrar o comentar estas lineas:
      /*
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
      */
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};