const db = require('../config/db');

exports.registrarSalida = async (req, res) => {
  const { placa, descuento = 0, cortesia = false } = req.body;

  const [registros] = await db.query(
    "SELECT * FROM REGISTROS WHERE placa = ? AND estado = 'EN_CURSO'",
    [placa]
  );

  if (registros.length === 0) {
    return res.send("No existe registro EN_CURSO");
  }

  const registro = registros[0];
  const salida = new Date();

  const minutos = Math.floor((salida - new Date(registro.fecha_hora_entrada)) / 60000);

  const [tarifa] = await db.query(
    'SELECT * FROM TARIFAS WHERE id = ?',
    [registro.tarifa_id]
  );

  let total = 0;

  if (tarifa[0].tipo_cobro === 'POR_MINUTO') {
    total = minutos * tarifa[0].valor;
  }

  if (tarifa[0].tipo_cobro === 'POR_HORA') {
    total = Math.ceil(minutos / 60) * tarifa[0].valor;
  }

  if (tarifa[0].tipo_cobro === 'POR_DIA') {
    total = Math.ceil(minutos / 1440) * tarifa[0].valor;
  }

  if (tarifa[0].tipo_cobro === 'FRACCION') {
    total = tarifa[0].valor;
  }

  if (cortesia) {
    total = 0;
  } else if (descuento > 0) {
    total = total - descuento;
  }

  await db.query(
    `UPDATE REGISTROS SET 
     fecha_hora_salida=?, minutos_totales=?, valor_calculado=?, estado='FINALIZADO', usuario_salida_id=? 
     WHERE id=?`,
    [salida, minutos, total, req.session.usuario.id, registro.id]
  );

  await db.query(
    'UPDATE ESPACIOS SET disponible=1 WHERE id=?',
    [registro.espacio_id]
  );

  const codigo = 'TK-' + Date.now();

  await db.query(
    `INSERT INTO TICKETS (registro_id,codigo_ticket,enviado_email,fecha_emision)
     VALUES (?,?,0,?)`,
    [registro.id, codigo, new Date()]
  );

  res.send(`Salida registrada. Total a pagar: $${total}`);
};