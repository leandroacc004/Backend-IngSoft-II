const express = require('express');
const { User } = require('./models'); // importamos el modelo
const bcrypt = require('bcryptjs');
const app = express();

app.use(express.json());

// 🧩 Ruta para registrar usuario
app.post('/register', async (req, res) => {
  const { nombre, correo, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ nombre, correo, password: hashedPassword });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🧩 Ruta para login
app.post('/login', async (req, res) => {
  const { correo, password } = req.body;
  try {
    const user = await User.findOne({ where: { correo } });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Contraseña incorrecta' });

    res.json({ message: 'Login exitoso', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('✅ Servidor en puerto 3000'));
