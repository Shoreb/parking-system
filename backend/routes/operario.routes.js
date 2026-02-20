const router = require('express').Router();
const entradaController = require('../controllers/entrada.controller');
const salidaController = require('../controllers/salida.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

router.post('/entrada',
  authMiddleware,
  roleMiddleware('Operario'),
  entradaController.registrarEntrada
);

router.post('/salida',
  authMiddleware,
  roleMiddleware('Operario'),
  salidaController.registrarSalida
);

module.exports = router;