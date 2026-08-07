const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guestController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Public route for checking username availability during guest registration
router.get('/check-username', guestController.checkUsernameAvailability);

// Public route for guest self-registration
router.post('/', guestController.createGuest);

router.get('/', authenticateToken, guestController.getAllGuests);
router.get('/search', authenticateToken, guestController.searchGuests);
router.get('/profile/:id', authenticateToken, guestController.getGuestProfile);
router.get('/:id', authenticateToken, guestController.getGuestById);
router.put('/:id', authenticateToken, authorizeRoles('Admin', 'Manager', 'Receptionist'), guestController.updateGuest);
router.delete('/:id', authenticateToken, authorizeRoles('Admin'), guestController.deleteGuest);

module.exports = router;
