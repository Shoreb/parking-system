const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: 'parqueadero_secret',
  resave: false,
  saveUninitialized: false
}));

// Servir HTML desde views
app.use(express.static(path.join(__dirname, '../views')));
app.use(express.static(path.join(__dirname, '../public')));

// Ruta raíz → login
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, '../views/login.html'));
});

// Rutas API
app.use('/auth', require('./routes/auth.routes'));
app.use('/operario', require('./routes/operario.routes'));
app.use('/admin', require('./routes/admin.routes'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('Servidor corriendo en puerto', PORT);
});