'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    codigo: DataTypes.STRING,
    nombre: DataTypes.STRING,
    email: DataTypes.STRING,     // Asegúrate que sea email
    password: DataTypes.STRING,  // <--- ASÍ DEBE QUEDAR (sin hash)
    rol: DataTypes.STRING,
    tiendaId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'User',
  });

  return User;
};
