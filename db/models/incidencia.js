const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Incidencia = sequelize.define('Incidencia', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    pedidoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'pedido_id', // Mapeo a la columna de la DB
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'usuario_id', // Mapeo a la columna de la DB
    },
    tipo: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    estado: {
      type: DataTypes.STRING(20),
      defaultValue: 'PENDIENTE',
    },
    fecha: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    }
  }, {
    tableName: 'incidencias',
    timestamps: false,
  });

  Incidencia.associate = (models) => {
    // Relaciones
    Incidencia.belongsTo(models.Pedido, { foreignKey: 'pedidoId', as: 'pedido' });
    Incidencia.belongsTo(models.User, { foreignKey: 'usuarioId', as: 'usuario' });
  };

  return Incidencia;
};