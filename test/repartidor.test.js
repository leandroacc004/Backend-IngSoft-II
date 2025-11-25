const request = require('supertest');
const app = require('../app');
const db = require('../db/models');

let tokenRepartidor = '';
let idPedidoDisponible = 0;

beforeAll(async () => {
    await db.sequelize.authenticate();

    // 1. Crear Repartidor
    const repartidor = await db.User.create({
        codigo: "TEST-MOTO",
        nombre: "Moto Test",
        email: "moto.test@ulexpress.pe",
        password: "123",
        rol: "repartidor",
        activo: true
    });

    // 2. Login Repartidor
    const resLogin = await request(app).post('/api/auth/login').send({
        codigo: "TEST-MOTO",
        password: "123"
    });
    tokenRepartidor = resLogin.body.token;

    // 3. Crear un Pedido "Huérfano" (CREADO y sin repartidor) para robar
    // Necesitamos un usuario cliente dummy
    const cliente = await db.User.create({ codigo: "CLI-DUMMY", nombre: "X", password: "X", rol: "alumno", email: "x@x.com" });
    
    const pedido = await db.Pedido.create({
        usuarioId: cliente.id,
        repartidorId: null, // Libre
        estado: 'CREADO',
        metodoPago: 'efectivo',
        subtotal: 10, delivery: 5, total: 15
    });
    idPedidoDisponible = pedido.id;
});

afterAll(async () => {
    // Limpieza básica
    await db.Pedido.destroy({ where: { id: idPedidoDisponible } });
    await db.User.destroy({ where: { codigo: ["TEST-MOTO", "CLI-DUMMY"] } });
    await db.sequelize.close();
});

describe('Flujo de Repartidor', () => {

    test('GET /api/repartidor/pedidos/disponibles - Debe ver el pedido libre', async () => {
        const res = await request(app)
            .get('/api/repartidor/pedidos/disponibles')
            .set('Authorization', `Bearer ${tokenRepartidor}`);

        expect(res.statusCode).toEqual(200);
        // Buscamos si nuestro pedido creado está en la lista
        const encontrado = res.body.find(p => String(p.id) === String(idPedidoDisponible).padStart(8, '0'));
        expect(encontrado).toBeDefined();
    });

    test('PATCH /api/repartidor/pedidos/:id/aceptar - Debe poder aceptar el pedido', async () => {
        const res = await request(app)
            .patch(`/api/repartidor/pedidos/${idPedidoDisponible}/aceptar`)
            .set('Authorization', `Bearer ${tokenRepartidor}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toContain('aceptado');
        expect(res.body.pedido.estado).toBe('ACEPTADO');
    });

});