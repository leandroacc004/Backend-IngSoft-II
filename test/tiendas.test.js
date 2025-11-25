const request = require('supertest');
const app = require('../app'); // Importamos tu aplicación
const db = require('../db/models');

// Antes de todas las pruebas, nos aseguramos de que la DB conecte
beforeAll(async () => {
    await db.sequelize.authenticate();
});

// Después de todo, cerramos la conexión para que Jest no se quede colgado
afterAll(async () => {
    await db.sequelize.close();
});

describe('GET /api/tiendas', () => {
    
    it('Debería responder con un código 200 y una lista de tiendas', async () => {
        // Simulamos una petición GET
        const res = await request(app).get('/api/tiendas');

        // 1. Verificamos que el status sea 200 (OK)
        expect(res.statusCode).toEqual(200);

        // 2. Verificamos que la respuesta sea un Array (una lista)
        expect(Array.isArray(res.body)).toBe(true);

        // 3. (Opcional) Verificamos que venga Dunkin Donuts si ya sembraste datos
        if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('nombre');
            expect(res.body[0]).toHaveProperty('ubicacion');
        }
    });

});