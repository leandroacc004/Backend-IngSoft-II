// src/routes/pedidos.js

const express = require('express');
const router = express.Router();
const verifyToken = require('../Middleware/authMiddleware'); // Middleware de protección
const pedidoController = require('../Controllers/PedidoController');

// Crear Pedido (Checkout)
router.post('/', verifyToken, pedidoController.createOrder); // POST /api/pedidos

// GET Ver historial completo de pedidos(Protegido)
router.get('/', verifyToken, pedidoController.getMyOrders);

// GET Un solo pedido, por ID
router.get('/:id', verifyToken, pedidoController.getMyOrders);

// PUT Actualizar estado (NUEVA RUTA)
router.put('/:id', verifyToken, pedidoController.updateOrder);

// DELETE Eliminar (NUEVA RUTA)
router.delete('/:id', verifyToken, pedidoController.deleteOrder);

// Calificar pedido (NUEVA)
router.patch('/:id/calificar', verifyToken, pedidoController.rateOrder);

// [Aquí irán otras rutas como Historial y Repartidor]



module.exports = router;