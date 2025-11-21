// db/models/pedido.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Pedido = sequelize.define('Pedido', {
    id: { // Se usará un UUID/STRING para que sea como el crypto.randomUUID() del frontend
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    usuarioId: { // El estudiante que realiza el pedido
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'users_id',
    },
    repartidorId: { // El repartidor asignado (puede ser nulo inicialmente)
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'repartidor_id',
    },
    fecha: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    estado: { // CREADO, ACEPTADO, ENTREGADO
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'CREADO',
    },
    metodoPago: { // efectivo, yape
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'metodo_pago',
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    delivery: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  }, {
    tableName: 'pedidos',
    timestamps: false,
  });

  Pedido.associate = (models) => {
    Pedido.belongsTo(models.User, { foreignKey: 'usuarioId', as: 'cliente' });
    Pedido.belongsTo(models.User, { foreignKey: 'repartidorId', as: 'repartidor' });
    Pedido.hasMany(models.ItemPedido, { foreignKey: 'pedidoId', as: 'items' });
  };

  return Pedido;
};