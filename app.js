var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http'); // 1. Importamos HTTP
const { Server } = require('socket.io'); // 2. Importamos Socket.io

// --- CONFIGURACIÓN DE DB Y VARIABLES DE ENTORNO ---
dotenv.config();
const db = require('./db/models');
const PORT = process.env.PORT || 3000;

// --- IMPORTACIÓN DE RUTAS DE API ---
var userRoutes = require('./src/routes/users');
var authRoutes = require('./src/routes/auth');
var tiendaRoutes = require('./src/routes/tiendas');
var pedidoRoutes = require('./src/routes/pedidos');
var repartidorRoutes = require('./src/routes/repartidor');
var carritoRoutes = require('./src/routes/carrito'); 

var app = express();

// 3. CREAMOS EL SERVIDOR HTTP Y EL IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Permitir conexión desde cualquier frontend (React/Angular/Postman)
    methods: ["GET", "POST"]
  }
});

// 4. GUARDAMOS 'io' EN APP PARA USARLO EN CONTROLADORES (Para Notificaciones)
app.set('io', io);

// --- MIDDLEWARE GENERALES ---
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

// --- MONTAJE DE RUTAS (API REST) ---
app.use('/api/auth', authRoutes);
app.use('/api/tiendas', tiendaRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/repartidor', repartidorRoutes);
app.use('/api/users', userRoutes);
app.use('/api/carrito', carritoRoutes);

// --- LÓGICA DE SOCKETS (CHAT) ---
io.on('connection', (socket) => {
  console.log('⚡ Cliente conectado:', socket.id);

  // Evento: Unirse a la sala de un pedido específico
  socket.on('join_pedido', (pedidoId) => {
    socket.join(`pedido_${pedidoId}`);
    console.log(`Usuario ${socket.id} se unió al pedido ${pedidoId}`);
  });

  // Evento: Enviar mensaje (HU 7.5)
  socket.on('send_message', async (data) => {
    // data = { pedidoId, usuarioId, texto }
    try {
        // 1. Guardar en Base de Datos
        await db.Mensaje.create({
            pedidoId: data.pedidoId,
            usuarioId: data.usuarioId,
            texto: data.texto
        });

        // 2. Reenviar a todos en la sala (incluido el remitente para confirmar)
        io.to(`pedido_${data.pedidoId}`).emit('receive_message', data);
    } catch (error) {
        console.error("Error guardando mensaje:", error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// --- MANEJO DE ERRORES ---
app.use(function (req, res, next) {
  res.status(404).json({ message: 'Ruta no encontrada', url: req.originalUrl });
});

app.use(function (err, req, res, next) {
  res.status(err.status || 500).json({
    message: err.message,
    error: req.app.get('env') === 'development' ? err : {}
  });
});

// --- ARRANQUE DEL SERVIDOR ---
// Nota: Ahora usamos server.listen en lugar de app.listen
const startServer = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida correctamente.');

    server.listen(PORT, () => {
      console.log(`🚀 Servidor SOCKETS + API corriendo en http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error('❌ ERROR: Fallo al conectar o arrancar el servidor:', err.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;