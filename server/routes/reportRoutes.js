const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/dashboard', authenticateToken, reportController.getDashboardStats);
router.get('/top-spenders', authenticateToken, reportController.getHighestSpendingGuests);
router.get('/upcoming-checkins', authenticateToken, reportController.getUpcomingCheckins);
router.get('/employee-salary', authenticateToken, authorizeRoles('Admin', 'Manager'), reportController.getEmployeeSalaryReport);
router.get('/occupancy', authenticateToken, reportController.getOccupancyReport);

module.exports = router;
