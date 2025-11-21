'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('incidencias', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      pedido_id: { // Vinculado al pedido problemático
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'pedidos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      usuario_id: { // El alumno que reporta
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' }, // Ojo: tu tabla se llama 'Users' con mayúscula en la migración de usuario
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tipo: { // Ej: "Pedido incompleto", "Comida fría", "Nunca llegó"
        type: Sequelize.STRING(50),
        allowNull: false
      },
      descripcion: { // Detalles del problema
        type: Sequelize.TEXT,
        allowNull: true
      },
      estado: { // PENDIENTE, REVISADO, RESUELTO
        type: Sequelize.STRING(20),
        defaultValue: 'PENDIENTE'
      },
      fecha: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      // Timestamps opcionales si quieres created/updatedAt
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('incidencias');
  }
};