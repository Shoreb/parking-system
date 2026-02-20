module.exports = (rol) => {
  return (req, res, next) => {
    if (!req.session.usuario || req.session.usuario.rol !== rol) {
      return res.status(403).send("Acceso denegado");
    }
    next();
  };
};