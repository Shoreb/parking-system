const db = require('../config/db');
const bcrypt = require('bcrypt');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await db.query(
    'SELECT u.*, r.nombre AS rol FROM USUARIOS u JOIN ROLES r ON u.rol_id = r.id WHERE email = ?',
    [email]
  );

  if (rows.length === 0) {
    return res.send("Email inexistente");
  }

  const usuario = rows[0];

  if (!usuario.activo) {
    return res.send("Usuario inactivo");
  }

  const match = await bcrypt.compare(password, usuario.password_hash);

  if (!match) {
    return res.send("Contraseña incorrecta");
  }

  req.session.usuario = {
    id: usuario.id,
    rol: usuario.rol
  };

  if (usuario.rol === 'Administrador') {
    return res.redirect('/dashboard_admin.html');
  } else {
    return res.redirect('/dashboard_operario.html');
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login.html');
  });
};