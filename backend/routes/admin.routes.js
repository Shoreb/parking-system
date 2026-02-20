const router = require('express').Router();
const tarifasController = require('../controllers/tarifas.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

router.post('/tarifas',
  authMiddleware,
  roleMiddleware('Administrador'),
  tarifasController.crearTarifa
);

module.exports = router;