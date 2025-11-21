const express = require('express');
const router = express.Router();
const verifyToken = require('../Middleware/authMiddleware');
const carritoController = require('../Controllers/CarritoController');

// Todas las rutas requieren estar logueado
router.get('/', verifyToken, carritoController.getMyCart);
router.post('/', verifyToken, carritoController.addItem);
router.delete('/:itemId', verifyToken, carritoController.removeItem);

module.exports = router;