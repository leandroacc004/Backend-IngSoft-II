// src/controllers/pedidoController.js
const { Pedido, ItemPedido, Producto, User, Incidencia } = require('../../db/models'); 


// POST /api/pedidos - Crea un nuevo pedido (VALIDANDO PRECIOS)
exports.createOrder = async (req, res) => {
    const { items, metodoPago } = req.body; // Ya no leemos 'total' ni 'subtotal' del body
    const usuarioId = req.user.id;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'El pedido no puede estar vacío.' });
    }

    try {
        let subtotalCalculado = 0;
        const itemsToSave = [];

        // 1. Recorremos los items para buscar sus precios REALES en la DB
        for (const item of items) {
            // Buscamos el producto en la DB
            const productoDB = await Producto.findByPk(item.producto.idProducto);

            if (!productoDB) {
                return res.status(400).json({ message: `Producto con ID ${item.producto.idProducto} no existe.` });
            }

            // Verificamos stock (Opcional pero recomendado)
            if (!productoDB.stock) {
                return res.status(400).json({ message: `El producto ${productoDB.nombre} no tiene stock.` });
            }

            // Usamos el precio de la DB, NO el del frontend
            const precioReal = Number(productoDB.precio);
            const cantidad = item.cantidad;
            
            subtotalCalculado += precioReal * cantidad;

            // Preparamos el objeto para guardar (con el precio real snapshot)
            itemsToSave.push({
                productoId: productoDB.id,
                nombreSnapshot: productoDB.nombre,
                precioUnitarioSnapshot: precioReal, // <--- Precio seguro
                cantidad: cantidad
            });
        }

        // 2. Definir Delivery (Fijo o Dinámico)
        const costoDelivery = 5.00; // Aquí podrías poner lógica dinámica si quisieras
        const totalCalculado = subtotalCalculado + costoDelivery;

        // 3. Crear el Pedido con los montos calculados
        const newPedido = await Pedido.create({
            usuarioId,
            repartidorId: null,
            metodoPago,
            subtotal: subtotalCalculado, // <--- Valor del backend
            delivery: costoDelivery,
            total: totalCalculado,       // <--- Valor del backend
            estado: 'CREADO',
        });

        // 4. Asignar el ID del pedido a los items y guardarlos
        const itemsFinales = itemsToSave.map(i => ({ ...i, pedidoId: newPedido.id }));
        await ItemPedido.bulkCreate(itemsFinales);

        const idFormateado = String(newPedido.id).padStart(8, '0');

        return res.status(201).json({
            message: 'Pedido creado con precios validados.',
            id: idFormateado,
            fecha: newPedido.fecha,
            estado: newPedido.estado,
            // Devolvemos al front los valores que NOSOTROS calculamos
            subtotal: subtotalCalculado, 
            delivery: costoDelivery,
            total: totalCalculado,
            metodo: newPedido.metodoPago,
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


// PUT /api/pedidos/:id (Actualizar estado + Notificar)
exports.updateOrder = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    
    // 1. RECUPERAMOS 'io' DE LA APP (Esto es lo nuevo)
    const io = req.app.get('io'); 

    try {
        const pedido = await Pedido.findByPk(id);

        if (!pedido) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }

        // 2. Actualizamos el estado en la BD
        pedido.estado = estado;
        await pedido.save();

        // 3. MAGIA DE NOTIFICACIONES (HU 8.7)
        // Si existe 'io', enviamos un mensaje a la "sala" de este pedido
        if (io) {
            io.to(`pedido_${id}`).emit('notification', {
                titulo: 'Estado Actualizado',
                mensaje: `Tu pedido #${id} ha cambiado a: ${estado}`,
                nuevoEstado: estado,
                pedidoId: id
            });
            console.log(`🔔 Notificación enviada al pedido ${id}: ${estado}`);
        }

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


// PATCH CALIFICAR PEDIDOS
exports.rateOrder = async (req, res) => {
    const { id } = req.params;
    const { puntaje } = req.body; // Esperamos un número del 1 al 5

    if (!puntaje || puntaje < 1 || puntaje > 5) {
        return res.status(400).json({ message: 'La calificación debe ser entre 1 y 5.' });
    }

    try {
        const pedido = await Pedido.findByPk(id);

        if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado.' });

        // Validar que el pedido esté entregado (regla de negocio)
        if (pedido.estado !== 'ENTREGADO') {
            return res.status(400).json({ message: 'Solo puedes calificar pedidos entregados.' });
        }

        pedido.calificacion = puntaje;
        await pedido.save();

        return res.json({ message: 'Calificación guardada exitosamente.', pedido });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al calificar.' });
    }

};

exports.reportIssue = async (req, res) => {
    const { id } = req.params; // ID del pedido
    const { tipo, descripcion } = req.body;
    const usuarioId = req.user.id; // ID del alumno logueado

    if (!tipo || !descripcion) {
        return res.status(400).json({ message: 'Falta el tipo o la descripción del problema.' });
    }

    try {
        // 1. Validar que el pedido exista
        const pedido = await Pedido.findByPk(id);

        if (!pedido) {
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }

        // 2. Seguridad: Solo el dueño del pedido puede reportarlo
        if (pedido.usuarioId !== usuarioId) {
            return res.status(403).json({ message: 'No puedes reportar un pedido que no es tuyo.' });
        }

        // 3. Crear la incidencia
        const nuevaIncidencia = await Incidencia.create({
            pedidoId: id,
            usuarioId,
            tipo,
            descripcion
        });

        return res.status(201).json({ 
            message: 'Incidencia reportada correctamente.', 
            incidencia: nuevaIncidencia 
        });

    } catch (error) {
        console.error('Error al reportar incidencia:', error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
};