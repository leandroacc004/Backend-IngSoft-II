'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    nombre: DataTypes.STRING,
    correo: DataTypes.STRING,
    password: DataTypes.STRING
  }, {});

  return User;
};
