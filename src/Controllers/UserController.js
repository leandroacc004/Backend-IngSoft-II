// src/Controllers/UserController.js
const { User } = require('../../db/models');

// 1. LISTAR TODOS (Soporta filtro ?rol=repartidor)
exports.getAll = async (req, res) => {
    const { rol } = req.query; // Leemos si pidieron filtrar por rol
    try {
        const where = rol ? { rol } : {}; // Si hay rol en la URL, filtramos
        
        const users = await User.findAll({ 
            where,
            // Ocultamos la contraseña por seguridad, mostramos lo importante
            attributes: ['id', 'nombre', 'codigo', 'email', 'rol', 'activo', 'tiendaId'] 
        });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al listar usuarios' });
    }
};

// 2. OBTENER UNO POR ID (Para el Perfil)
exports.getById = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findByPk(id, {
            attributes: ['id', 'nombre', 'codigo', 'email', 'rol', 'activo', 'tiendaId'] 
        });

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener usuario' });
    }
};

// 3. CREAR USUARIO (Registro manual o Admin)
exports.create = async (req, res) => {
    try {
        let { codigo, nombre, email, password, rol, tiendaId } = req.body;

        // Lógica inteligente: Si es repartidor y no mandan código, lo generamos
        if (!codigo && rol === 'repartidor') {
            codigo = 'REP-' + Date.now().toString().slice(-4); // Ej: REP-4821
        }

        // Si no mandan correo, generamos uno falso para cumplir la DB
        if (!email && codigo) {
            email = `${codigo.toLowerCase()}@ulexpress.pe`;
        }

        const nuevoUsuario = await User.create({
            codigo,
            nombre,
            email,
            password: password || '1234', // Contraseña default si no la mandan
            rol: rol || 'alumno',
            tiendaId: rol === 'tienda' ? tiendaId : null,
            activo: true // Por defecto todos nacen activos
        });

        res.status(201).json({ message: 'Usuario creado', user: nuevoUsuario });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear usuario', error: error.message });
    }
};

// 4. ACTUALIZAR (Editar perfil o cambiar estado activo/inactivo)
exports.update = async (req, res) => {
    const { id } = req.params;
    try {
        // Solo permitimos actualizar campos específicos por seguridad
        const { nombre, email, activo, password } = req.body;
        
        const [updated] = await User.update(
            { nombre, email, activo, password }, // Campos actualizables
            { where: { id } }
        );

        if (updated === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json({ message: 'Usuario actualizado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar' });
    }
};

// 5. ELIMINAR USUARIO
exports.delete = async (req, res) => {
    try {
        const deleted = await User.destroy({ where: { id: req.params.id } });

        if (deleted === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar' });
    }
};