const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Carrito = sequelize.define('Carrito', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'usuario_id',
    }
  }, {
    tableName: 'carritos',
    timestamps: true, // Usaremos timestamps para saber cuándo se actualizó
    updatedAt: 'updatedAt',
    createdAt: false // No necesitamos saber cuándo se creó, solo cuándo se modificó
  });

  Carrito.associate = (models) => {
    Carrito.belongsTo(models.User, { foreignKey: 'usuarioId', as: 'usuario' });
    Carrito.hasMany(models.ItemCarrito, { foreignKey: 'carritoId', as: 'items' });
  };

  return Carrito;
};