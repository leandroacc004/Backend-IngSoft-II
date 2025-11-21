// db/models/itempedido.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ItemPedido = sequelize.define('ItemPedido', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    pedidoId: {
      type: DataTypes.INTEGER, // Debe coincidir con el tipo del ID de Pedido
      allowNull: false,
      field: 'pedido_id',
    },
    productoId: { // Para referencia al producto original
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'producto_id',
    },
    nombreSnapshot: { // Nombre del producto al momento de la compra
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'nombre_snapshot',
    },
    precioUnitarioSnapshot: { // Precio al momento de la compra (snapshot)
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'precio_unitario_snapshot',
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'items_pedido',
    timestamps: false,
  });

  ItemPedido.associate = (models) => {
    ItemPedido.belongsTo(models.Pedido, { foreignKey: 'pedidoId', as: 'pedido' });
    ItemPedido.belongsTo(models.Producto, { foreignKey: 'productoId', as: 'producto' });
  };

  return ItemPedido;
};