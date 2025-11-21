const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Mensaje = sequelize.define('Mensaje', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    pedidoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'pedido_id',
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'usuario_id',
    },
    texto: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    }
  }, {
    tableName: 'mensajes',
    timestamps: false,
  });

  Mensaje.associate = (models) => {
    Mensaje.belongsTo(models.Pedido, { foreignKey: 'pedidoId', as: 'pedido' });
    Mensaje.belongsTo(models.User, { foreignKey: 'usuarioId', as: 'emisor' });
  };

  return Mensaje;
};