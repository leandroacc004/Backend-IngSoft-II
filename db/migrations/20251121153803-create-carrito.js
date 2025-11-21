'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Tabla CARRITOS (Vinculada al User)
    await queryInterface.createTable('carritos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      updatedAt: { allowNull: false, type: Sequelize.DATE }, // Para saber cuándo fue la última vez que movió el carrito
    });

    // 2. Tabla ITEMS_CARRITO (Vinculada al Carrito y al Producto)
    await queryInterface.createTable('items_carrito', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      carrito_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'carritos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      producto_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'productos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      cantidad: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('items_carrito');
    await queryInterface.dropTable('carritos');
  }
};