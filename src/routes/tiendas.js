// src/routes/tienda.js

const express = require('express');
const router = express.Router();
const verifyToken = require('../Middleware/authMiddleware');
const tiendaController = require('../Controllers/TiendaController');

// Middleware para verificar que el rol sea 'tienda'
const isTiendaAdmin = (req, res, next) => {
    if (req.user.rol !== 'tienda') {
        return res.status(403).json({ message: 'Acceso prohibido. Rol requerido: Administrador de Tienda.' });
    }
    if (!req.user.tiendaId) {
        return res.status(403).json({ message: 'Esta cuenta de tienda no está vinculada a una Tienda.' });
    }
    next();
};

// Todas las rutas de administración están protegidas y requieren rol 'tienda'
//Llamada a todas las tiendas
router.get('/', tiendaController.listAll);

//Llamada a tienda por ID
router.get('/:id', tiendaController.getById);

// POST /api/tienda/productos (Añadir)
router.post('/productos', verifyToken, isTiendaAdmin, tiendaController.addProduct); 

// PATCH /api/tienda/productos/:id/stock (Actualizar Stock)
router.patch('/productos/:id/stock', verifyToken, isTiendaAdmin, tiendaController.updateStock);

// PATCH /api/tienda/productos/:id/precio (Actualizar Precio)
router.patch('/productos/:id/precio', verifyToken, isTiendaAdmin, tiendaController.updatePrice);

module.exports = router;