const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', authenticateToken, serviceController.getAllServices);
router.post('/', authenticateToken, authorizeRoles('Admin', 'Manager'), serviceController.createService);
router.put('/:id', authenticateToken, authorizeRoles('Admin', 'Manager'), serviceController.updateService);
router.delete('/:id', authenticateToken, authorizeRoles('Admin'), serviceController.deleteService);

// Service Records
router.get('/records', authenticateToken, serviceController.getGuestServiceRecords);
router.post('/assign', authenticateToken, serviceController.assignServiceToGuest);
router.post('/records', authenticateToken, serviceController.assignServiceToGuest);

module.exports = router;
