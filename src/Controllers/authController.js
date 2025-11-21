// src/Controllers/authController.js
const jwt = require('jsonwebtoken');
const db = require('../../db/models'); 
const User = db.User || db.user; 

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_temporal'; 

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    // 1. Recibimos los datos
    const { codigo, password, nombre, rol, email, tiendaId } = req.body;

    // 2. Validamos
    if (!codigo || !password || !nombre || !rol) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    // 3. Verificamos duplicados
    const existingUser = await User.findOne({ where: { codigo } });
    if (existingUser) {
      return res.status(409).json({ message: 'El código ya existe' });
    }

    // 4. CREAMOS EL USUARIO (SIN HASHEAR NADA)
    const newUser = await User.create({
      codigo,
      nombre,
      rol,
      email,
      tiendaId: rol === 'tienda' ? tiendaId : null,
      password, // <--- Se guarda tal cual vino del Postman (ej: "123456")
    });

    return res.status(201).json({
      message: 'Usuario creado',
      user: newUser
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { codigo, password } = req.body;

    // 1. Buscamos usuario
    const user = await User.findOne({ where: { codigo } });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // 2. COMPARACIÓN DIRECTA (TEXTO PLANO)
    // Si la contraseña en la DB es igual a la que envías:
    if (user.password !== password) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // 3. Generar Token
    const token = jwt.sign(
      { id: user.id, codigo: user.codigo, rol: user.rol, tiendaId: user.tiendaId },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        rol: user.rol
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error en el login' });
  }
};