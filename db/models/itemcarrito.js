const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ItemCarrito = sequelize.define('ItemCarrito', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    carritoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'carrito_id',
    },
    productoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'producto_id',
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    }
  }, {
    tableName: 'items_carrito',
    timestamps: false,
  });

  ItemCarrito.associate = (models) => {
    ItemCarrito.belongsTo(models.Carrito, { foreignKey: 'carritoId', as: 'carrito' });
    ItemCarrito.belongsTo(models.Producto, { foreignKey: 'productoId', as: 'producto' });
  };

  return ItemCarrito;
};