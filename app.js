var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const dotenv = require('dotenv');
const cors = require('cors');

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
// var tiendaAdminRoutes = require('./src/routes/tienda'); // Actívame si existe

var app = express();

// --- MIDDLEWARE GENERALES ---
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// --- CORS (si lo necesitas para frontend) ---
// app.use(cors());

// --- MONTAJE DE RUTAS (API REST) ---
app.use('/api/auth', authRoutes);
app.use('/api/tiendas', tiendaRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/repartidor', repartidorRoutes);
app.use('/api/users', userRoutes);
// app.use('/api/tienda', tiendaAdminRoutes); // Activa esta línea solo si el archivo existe

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
const startServer = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida correctamente.');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor Express API corriendo en http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error('❌ ERROR: Fallo al conectar o arrancar el servidor:', err.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
