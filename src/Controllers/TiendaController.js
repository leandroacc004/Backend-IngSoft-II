// src/Controllers/tiendaController.js

const { Tienda, Producto } = require('../../db/models'); // Importamos los modelos

// GET /api/tiendas?q=buscar
exports.listAll = async (req, res) => {
    try {
        const { q } = req.query; // q viene de la búsqueda en TiendasList.tsx
        let where = {};
        
        // Si hay un término de búsqueda (q), filtramos por nombre o ubicación
        if (q) {
            const searchQuery = `%${q.toLowerCase()}%`;
            where = {
                [Tienda.sequelize.Op.or]: [
                    { nombre: { [Tienda.sequelize.Op.iLike]: searchQuery } },
                    { ubicacion: { [Tienda.sequelize.Op.iLike]: searchQuery } },
                ]
            };
        }

        const tiendas = await Tienda.findAll({
            where,
            attributes: ['id', 'nombre', 'ubicacion', 'logo_url'], // Solo los campos públicos
            order: [['nombre', 'ASC']]
        });

        // Mapeamos los resultados para que coincidan con la estructura del frontend (TiendasList.tsx)
        const response = tiendas.map(t => ({
            idTienda: t.id,
            nombre: t.nombre,
            ubicacion: t.ubicacion,
            logo: t.logo_url,
        }));

        return res.json(response);
    } catch (error) {
        console.error('Error al listar tiendas:', error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
};


// GET /api/tiendas/:id
exports.getById = async (req, res) => {
    const { id } = req.params;
    try {
        const tienda = await Tienda.findByPk(id, {
            // Incluimos el catálogo de productos automáticamente
            include: [{ 
                model: Producto, 
                as: 'catalogo' // Debe coincidir con el "as" en tu modelo Tienda.js
            }]
        });

        if (!tienda) {
            return res.status(404).json({ message: 'Tienda no encontrada' });
        }

        return res.json(tienda);
    } catch (error) {
        console.error('Error al obtener tienda:', error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
};


// ... (Aquí irá la lógica para obtener el detalle de la tienda)

// src/Controllers/tiendaController.js (Continuación)

// ... (exports.listAll, exports.getTiendaAndProducts)

// --- FUNCIONES DE ADMINISTRACIÓN DE TIENDA (Requieren Rol 'tienda') ---

// POST /api/tienda/productos - Añadir nuevo producto
exports.addProduct = async (req, res) => {
    // req.user.tiendaId se obtiene del token JWT si el rol es 'tienda'
    const tiendaId = req.user.tiendaId; 
    const { nombre, precio, imagen, stock } = req.body;

    if (!tiendaId) {
        return res.status(403).json({ message: 'Solo los usuarios de tienda pueden agregar productos.' });
    }
    
    if (!nombre || !precio || !imagen) {
        return res.status(400).json({ message: 'Faltan campos: nombre, precio, imagen.' });
    }

    try {
        const nuevoProducto = await Producto.create({
            tiendaId,
            nombre,
            precio: Number(precio),
            imagen_url: imagen,
            stock: stock !== undefined ? stock : true,
        });

        // Respuesta que imita el mock de frontend (TiendaNuevo.tsx)
        return res.status(201).json({
            message: 'Producto creado exitosamente.',
            idProducto: nuevoProducto.id,
            nombre: nuevoProducto.nombre,
        });

    } catch (error) {
        console.error('Error al añadir producto:', error);
        return res.status(500).json({ message: 'Error interno del servidor al crear producto.' });
    }
};

// PATCH /api/tienda/productos/:id/stock - Actualizar stock
exports.updateStock = async (req, res) => {
    const tiendaId = req.user.tiendaId; 
    const { id } = req.params; // ID del producto
    const { stock } = req.body; // Nuevo valor de stock (true/false)

    if (!tiendaId) {
        return res.status(403).json({ message: 'Acceso denegado.' });
    }

    try {
        const [updated] = await Producto.update(
            { stock: stock },
            { 
                where: { id, tiendaId }, // Asegurarse de que la tienda solo pueda modificar sus propios productos
            }
        );

        if (updated === 0) {
            return res.status(404).json({ message: 'Producto no encontrado o no pertenece a esta tienda.' });
        }

        return res.json({ message: 'Stock actualizado correctamente.', idProducto: id, stock });

    } catch (error) {
        console.error('Error al actualizar stock:', error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// PATCH /api/tienda/productos/:id/precio - Actualizar precio
exports.updatePrice = async (req, res) => {
    const tiendaId = req.user.tiendaId; 
    const { id } = req.params; // ID del producto
    const { precio } = req.body; // Nuevo valor de precio

    if (!tiendaId) {
        return res.status(403).json({ message: 'Acceso denegado.' });
    }
    if (precio === undefined || isNaN(Number(precio))) {
        return res.status(400).json({ message: 'Precio inválido.' });
    }

    try {
        const [updated] = await Producto.update(
            { precio: Number(precio) },
            { 
                where: { id, tiendaId }, // Asegurarse de que la tienda solo pueda modificar sus propios productos
            }
        );

        if (updated === 0) {
            return res.status(404).json({ message: 'Producto no encontrado o no pertenece a esta tienda.' });
        }

        return res.json({ message: 'Precio actualizado correctamente.', idProducto: id, precio });

    } catch (error) {
        console.error('Error al actualizar precio:', error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
};