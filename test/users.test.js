const request = require('supertest');
const app = require('../app');
const db = require('../db/models');

let token = '';
let idUsuarioCreado = 0;

beforeAll(async () => {
    await db.sequelize.authenticate();
    // Creamos un admin o usuario cualquiera para tener token y poder consultar
    const user = await db.User.create({
        codigo: "ADMIN-TEST",
        nombre: "Admin",
        password: "123",
        rol: "tienda", // Asumimos que tienda tiene permisos o es público (según tu middleware)
        email: "admin@test.com"
    });
    const res = await request(app).post('/api/auth/login').send({ codigo: "ADMIN-TEST", password: "123" });
    token = res.body.token;
    idUsuarioCreado = user.id;
});

afterAll(async () => {
    await db.User.destroy({ where: { codigo: ["ADMIN-TEST", "USR-NUEVO"] } });
    await db.sequelize.close();
});

describe('Gestión de Usuarios', () => {

    test('GET /api/users - Listar usuarios', async () => {
        const res = await request(app).get('/api/users'); // Si es pública
        // Si la protegiste, agrega .set('Authorization', `Bearer ${token}`)
        
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('PUT /api/users/:id - Actualizar nombre', async () => {
        const res = await request(app)
            .put(`/api/users/${idUsuarioCreado}`)
            .send({ nombre: "Admin Editado" });

        expect(res.statusCode).toEqual(200);
        
        // Verificamos en DB
        const actualizado = await db.User.findByPk(idUsuarioCreado);
        expect(actualizado.nombre).toBe("Admin Editado");
    });

});