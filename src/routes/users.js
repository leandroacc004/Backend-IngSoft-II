
// src/routes/users.js
const express = require('express');
const router = express.Router();
const userController = require('../Controllers/UserController'); // Asegúrate de que este archivo exista

// Definición de rutas
router.get('/', userController.getAll);       // GET /api/users
router.get('/:id', userController.getById);   // GET /api/users/:id (Esta es la que te fallaba)
router.post('/', userController.create);      // POST /api/users
router.put('/:id', userController.update);    // PUT /api/users/:id
router.delete('/:id', userController.delete); // DELETE /api/users/:id

module.exports = router;
