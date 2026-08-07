const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Public GET routes for hotel list & details
router.get('/', hotelController.getAllHotels);
router.get('/:id', hotelController.getHotelById);

// Protected Admin/Manager routes for hotel management
router.post('/', authenticateToken, authorizeRoles('Admin', 'Manager'), hotelController.createHotel);
router.put('/:id', authenticateToken, authorizeRoles('Admin', 'Manager'), hotelController.updateHotel);
router.delete('/:id', authenticateToken, authorizeRoles('Admin'), hotelController.deleteHotel);

module.exports = router;
