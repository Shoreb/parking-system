const db = require('../config/db');

exports.crearTarifa = async (req, res) => {
  const { tipo_vehiculo_id, nombre, tipo_cobro, valor, fecha_inicio, fecha_fin } = req.body;

  if (!tipo_vehiculo_id || !nombre || !tipo_cobro || !valor || !fecha_inicio) {
    return res.send("Datos inválidos");
  }

  await db.query(
    `INSERT INTO TARIFAS 
     (tipo_vehiculo_id,nombre,tipo_cobro,valor,activo,fecha_inicio,fecha_fin)
     VALUES (?,?,?,?,1,?,?)`,
    [tipo_vehiculo_id, nombre, tipo_cobro, valor, fecha_inicio, fecha_fin || null]
  );

  res.send("Tarifa creada correctamente");
};