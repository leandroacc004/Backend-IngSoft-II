const { Carrito, ItemCarrito, Producto } = require('../../db/models');

// Helper: Buscar o crear carrito del usuario
const getOrCreateCart = async (usuarioId) => {
    let carrito = await Carrito.findOne({ where: { usuarioId } });
    if (!carrito) {
        carrito = await Carrito.create({ usuarioId });
    }
    return carrito;
};

// GET /api/carrito - Obtener mi carrito
exports.getMyCart = async (req, res) => {
    const usuarioId = req.user.id;
    try {
        const carrito = await Carrito.findOne({
            where: { usuarioId },
            include: [
                {
                    model: ItemCarrito,
                    as: 'items',
                    include: [{ model: Producto, as: 'producto' }] // Traer datos del producto (nombre, precio, img)
                }
            ]
        });

        if (!carrito) return res.json({ items: [] });
        return res.json(carrito);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al obtener carrito' });
    }
};

// POST /api/carrito - Agregar Item
exports.addItem = async (req, res) => {
    const usuarioId = req.user.id;
    const { productoId, cantidad } = req.body;

    try {
        const carrito = await getOrCreateCart(usuarioId);

        // Buscar si el item ya existe en el carrito
        const itemExistente = await ItemCarrito.findOne({
            where: { carritoId: carrito.id, productoId }
        });

        if (itemExistente) {
            // Si existe, actualizamos cantidad
            itemExistente.cantidad += (cantidad || 1);
            await itemExistente.save();
        } else {
            // Si no existe, creamos uno nuevo
            await ItemCarrito.create({
                carritoId: carrito.id,
                productoId,
                cantidad: cantidad || 1
            });
        }

        return res.json({ message: 'Producto agregado al carrito' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al agregar item' });
    }
};

// DELETE /api/carrito/:itemId - Eliminar item especifico
exports.removeItem = async (req, res) => {
    const { itemId } = req.params;
    try {
        await ItemCarrito.destroy({ where: { id: itemId } });
        return res.json({ message: 'Item eliminado' });
    } catch (error) {
        return res.status(500).json({ message: 'Error al eliminar item' });
    }
};