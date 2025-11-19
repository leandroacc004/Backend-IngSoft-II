const { User } = require('../db/models');

module.exports = {
  // REGISTRO 
  register: async (req, res) => {
    try {
      const { nombre, correo, password } = req.body;
      const user = await User.create({
        nombre,
        correo,
        password // SE GUARDA TAL CUAL
      });
      res.status(201).json({ message: "Usuario registrado", user });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // LOGIN 
  login: async (req, res) => {
    try {
      const { correo, password } = req.body;
      const user = await User.findOne({ where: { correo } });
      if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
      if (password !== user.password) {
        return res.status(401).json({ message: "Contraseña incorrecta" });
      }
      res.json({ message: "Login exitoso", user });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
