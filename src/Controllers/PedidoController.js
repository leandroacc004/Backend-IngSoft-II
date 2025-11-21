// src/controllers/pedidoController.js
const { Pedido, ItemPedido, Producto, User } = require('../../db/models'); 

// POST /api/pedidos - Crea un nuevo pedido (CHECKOUT)
exports.createOrder = async (req, res) => {
    // req.user viene del middleware JWT (req.user.id es el ID del estudiante)
    const { items, subtotal, delivery, total, metodoPago } = req.body;
    const usuarioId = req.user.id; // ID del estudiante logueado

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'El pedido no puede estar vacío.' });
    }

    try {
        // 1. Generar un ID único (como lo hace el frontend con crypto.randomUUID())
        //const pedidoId = uuidv4(); 

        // 2. Crear el Pedido (la orden principal)
        const newPedido = await Pedido.create({
            // id: pedidoId, lo hace la DB
            usuarioId,
            repartidorId: null, // Sin repartidor asignado al inicio
            metodoPago,
            subtotal,
            delivery,
            total,
            estado: 'CREADO',
        });

        // 3. Preparar los ítems del pedido (el carrito)
        const itemsToSave = items.map(item => ({
            pedidoId: newPedido.id,
            productoId: item.producto.idProducto, // El ID del producto
            nombreSnapshot: item.producto.nombre, 
            precioUnitarioSnapshot: item.producto.precio,
            cantidad: item.cantidad,
        }));
        
        // 4. Crear los ItemPedido
        await ItemPedido.bulkCreate(itemsToSave);
        const idFormateado = String(newPedido.id).padStart(8, '0');
        // 5. Devolver el objeto Pedido que el frontend espera (CheckoutFacade.ts)
        return res.status(201).json({
            id: idFormateado,
            fecha: newPedido.fecha,
            estado: newPedido.estado,
            total: Number(newPedido.total),
            delivery: Number(newPedido.delivery),
            subtotal: Number(newPedido.subtotal),
            metodo: newPedido.metodoPago,
            // Nota: No devolvemos 'items' aquí, el frontend confía en que los guardamos.
        });

    } catch (error) {
        console.error('Error al crear pedido:', error);
        return res.status(500).json({ message: 'Error interno al procesar el pedido.' });
    }

    
};


// GET /api/pedidos
exports.getMyOrders = async (req, res) => {
    const userId = req.user.id;
    const userRol = req.user.rol;

    try {
        let where = {};

        // Si es alumno, filtrar por usuarioId
        if (userRol === 'alumno') {
            where = { usuarioId: userId };
        } 
        // Si es repartidor, filtrar por repartidorId
        else if (userRol === 'repartidor') {
            where = { repartidorId: userId };
        }
        // Si es tienda, habría que filtrar por items que incluyan productos de esa tienda (más complejo, lo dejamos para luego)

        const pedidos = await Pedido.findAll({
            where,
            include: [
                { 
                    model: ItemPedido, 
                    as: 'items',
                    // Incluimos datos del producto para que se vea bonito
                    include: [{ model: Producto, as: 'producto' }] 
                },
                { model: User, as: 'repartidor', attributes: ['nombre', 'codigo'] } // Para ver quién lo trae
            ],
            order: [['fecha', 'DESC']] // Los más recientes primero
        });

        return res.json(pedidos);
    } catch (error) {
        console.error('Error al obtener historial:', error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
};


// PUT /api/pedidos/:id
//Actualizar pedido
exports.updateOrder = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    try {
        const pedido = await Pedido.findByPk(id);

        if (!pedido) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }

        // Actualizamos el estado
        pedido.estado = estado;
        await pedido.save();

        return res.json({ message: `Pedido actualizado a ${estado}`, pedido });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al actualizar pedido' });
    }
};


// DELETE /api/pedidos/:id
// BORRAR PEDIDO POR ID
exports.deleteOrder = async (req, res) => {
    const { id } = req.params;

    try {
        const pedido = await Pedido.findByPk(id);

        if (!pedido) {
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }

        // Validación opcional: Solo borrar si nadie lo ha tomado aún
        if (pedido.estado !== 'CREADO') {
            return res.status(400).json({ message: 'No se puede eliminar un pedido que ya está en proceso o entregado.' });
        }

        // Borrar el pedido (y sus items se borran solos si configuraste CASCADE en la DB, 
        // pero Sequelize lo suele manejar bien)
        await pedido.destroy();

        return res.json({ message: 'Pedido eliminado correctamente.' });

    } catch (error) {
        console.error('Error al eliminar pedido:', error);
        return res.status(500).json({ message: 'Error interno al eliminar el pedido.' });
    }
};


// src/controllers/pedidoController.js (Continuación)

// ... (requires, exports.createOrder, exports.getHistory)

// GET /api/pedidos/repartidor/disponibles
// Busca pedidos con estado 'CREADO' y que no tienen repartidor asignado.
exports.getAvailableOrders = async (req, res) => {
    try {
        const pedidos = await Pedido.findAll({
            where: {
                estado: 'CREADO',
                repartidorId: null,
            },
            // Incluir el cliente (estudiante) y la tienda donde recoger el pedido.
            include: [
                { model: ItemPedido, as: 'items', include: [{ model: Producto, as: 'producto', include: ['tienda'] }] },
                { model: User, as: 'cliente', attributes: ['nombre', 'codigo'] }
            ],
            attributes: ['id', 'fecha', 'total', 'metodoPago'],
            order: [['fecha', 'ASC']]
        });

        // Formatear la respuesta para el Repartidor
        const response = pedidos.map(p => {
            // Asumiendo que todos los items son de la misma tienda (Simplificación de ULEXPRESS)
            const tienda = p.items[0]?.producto.tienda;

            return {
                id: String(p.id).padStart(8, '0'),
                fecha: p.fecha,
                total: Number(p.total),
                metodoPago: p.metodoPago,
                tienda: tienda ? tienda.nombre : 'Tienda Desconocida',
                ubicacionTienda: tienda ? tienda.ubicacion : '',
                cliente: p.cliente.nombre,
                destino: 'ULima - Edificio (pendiente de campo de entrega en Pedido)',
            };
        });

        return res.json(response);
    } catch (error) {
        console.error('Error al obtener pedidos disponibles:', error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
};


// PATCH /api/pedidos/repartidor/:id/aceptar
// El repartidor acepta la entrega, cambiando el estado y asignando su ID.
exports.acceptOrder = async (req, res) => {
    // req.user viene del middleware JWT
    const repartidorId = req.user.id; 
    const pedidoId = req.params.id;

    try {
        const pedido = await Pedido.findByPk(pedidoId);

        if (!pedido) {
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }
        
        // Regla: Solo se puede aceptar si está en estado CREADO y no tiene repartidor asignado
        if (pedido.estado !== 'CREADO' || pedido.repartidorId !== null) {
            return res.status(400).json({ message: 'El pedido ya fue aceptado o no está disponible.' });
        }

        // Actualizar el pedido
        pedido.repartidorId = repartidorId;
        pedido.estado = 'ACEPTADO';
        await pedido.save();

        return res.json({ message: 'Pedido aceptado y asignado correctamente.', pedido });

    } catch (error) {
        console.error('Error al aceptar pedido:', error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
};