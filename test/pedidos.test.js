const request = require('supertest');
const app = require('../app');
const db = require('../db/models');

let tokenAlumno = '';
let idProducto = 0;
let idPedidoCreado = 0;

// 1. PREPARACIÓN (Setup)
beforeAll(async () => {
    await db.sequelize.authenticate();
    
    // A. Crear un Alumno para la prueba
    const alumno = await db.User.create({
        codigo: "TEST-ALUMNO",
        nombre: "Alumno Test",
        email: "alumno.test@ulima.edu.pe",
        password: "123",
        rol: "alumno",
        activo: true
    });

    // B. Loguearlo para obtener su TOKEN
    const resLogin = await request(app).post('/api/auth/login').send({
        codigo: "TEST-ALUMNO",
        password: "123"
    });
    tokenAlumno = resLogin.body.token;

    // C. Crear una Tienda y un Producto falso para comprar
    const tienda = await db.Tienda.create({ nombre: "Tienda Test", ubicacion: "N", logo_url: "x" });
    const producto = await db.Producto.create({
        tiendaId: tienda.id,
        nombre: "Café Test",
        precio: 10.00, // Precio Real
        stock: true
    });
    idProducto = producto.id;
});

// 2. LIMPIEZA (Teardown)
afterAll(async () => {
    // Borramos lo que ensuciamos
    await db.ItemPedido.destroy({ where: {} }); // Ojo: borra detalles
    await db.Pedido.destroy({ where: {} });     // Ojo: borra pedidos
    await db.User.destroy({ where: { codigo: "TEST-ALUMNO" } });
    await db.Producto.destroy({ where: { id: idProducto } });
    await db.Tienda.destroy({ where: { nombre: "Tienda Test" } });
    await db.sequelize.close();
});

describe('Flujo de Pedidos (Checkout)', () => {

    test('POST /api/pedidos - Debe crear un pedido correctamente', async () => {
        const res = await request(app)
            .post('/api/pedidos')
            .set('Authorization', `Bearer ${tokenAlumno}`) // ¡Importante!
            .send({
                metodoPago: "yape",
                // Mandamos "precios falsos" para probar que el backend los corrija
                subtotal: 1.00, 
                delivery: 5.00, 
                total: 6.00,
                items: [
                    {
                        cantidad: 2,
                        producto: { idProducto: idProducto } 
                    }
                ]
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('id');
        
        // VERIFICACIÓN DE SEGURIDAD (HU 2.8)
        // 2 cafés de 10.00 = 20.00 + 5.00 delivery = 25.00
        expect(Number(res.body.total)).toBe(25.00); 
        
        idPedidoCreado = res.body.id; // Guardamos el ID para el siguiente test
    });

    test('GET /api/pedidos - El alumno debe ver su historial', async () => {
        const res = await request(app)
            .get('/api/pedidos')
            .set('Authorization', `Bearer ${tokenAlumno}`);

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        // Verificar que el último pedido sea el que creamos
        expect(res.body[0].id).toBe(idPedidoCreado);
    });

});