const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guestController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', authenticateToken, guestController.getAllGuests);
router.get('/search', authenticateToken, guestController.searchGuests);
router.get('/profile/:id', authenticateToken, guestController.getGuestProfile);
router.get('/:id', authenticateToken, guestController.getGuestById);
router.post('/', authenticateToken, authorizeRoles('Admin', 'Manager', 'Receptionist'), guestController.createGuest);
router.put('/:id', authenticateToken, authorizeRoles('Admin', 'Manager', 'Receptionist'), guestController.updateGuest);
router.delete('/:id', authenticateToken, authorizeRoles('Admin'), guestController.deleteGuest);

module.exports = router;
