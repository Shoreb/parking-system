const db = require('../config/db');

exports.registrarEntrada = async (req, res) => {
  const { placa, tipo_vehiculo_id } = req.body;

  const [espacios] = await db.query(
    'SELECT * FROM ESPACIOS WHERE tipo_vehiculo_id = ? AND disponible = 1 LIMIT 1',
    [tipo_vehiculo_id]
  );

  if (espacios.length === 0) {
    return res.send("No hay cupos disponibles");
  }

  const espacio = espacios[0];

  const fecha = new Date();

  const [tarifa] = await db.query(
    'SELECT * FROM TARIFAS WHERE tipo_vehiculo_id = ? AND activo = 1 AND fecha_inicio <= CURDATE() AND (fecha_fin IS NULL OR fecha_fin >= CURDATE()) LIMIT 1',
    [tipo_vehiculo_id]
  );

  await db.query(
    `INSERT INTO REGISTROS 
     (placa,tipo_vehiculo_id,espacio_id,fecha_hora_entrada,estado,usuario_entrada_id,tarifa_id)
     VALUES (?,?,?,?, 'EN_CURSO', ?, ?)`,
    [placa, tipo_vehiculo_id, espacio.id, fecha, req.session.usuario.id, tarifa[0].id]
  );

  await db.query(
    'UPDATE ESPACIOS SET disponible = 0 WHERE id = ?',
    [espacio.id]
  );

  res.send(`Entrada registrada. Espacio asignado: ${espacio.codigo}`);
};