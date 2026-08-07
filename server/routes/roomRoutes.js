const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Public GET routes for room inventory
router.get('/', roomController.getAllRooms);
router.get('/available', roomController.getAvailableRooms);

// Protected routes for room creation & management
router.post('/', authenticateToken, authorizeRoles('Admin', 'Manager'), roomController.createRoom);
router.put('/:id', authenticateToken, authorizeRoles('Admin', 'Manager', 'Receptionist'), roomController.updateRoom);
router.delete('/:id', authenticateToken, authorizeRoles('Admin'), roomController.deleteRoom);

module.exports = router;
