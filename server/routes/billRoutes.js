const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', authenticateToken, billController.getAllBills);
router.get('/:id', authenticateToken, billController.getBillById);
router.post('/generate', authenticateToken, authorizeRoles('Admin', 'Manager', 'Receptionist'), billController.generateBill);

module.exports = router;
