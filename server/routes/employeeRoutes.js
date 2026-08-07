const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', authenticateToken, employeeController.getAllEmployees);
router.get('/:id', authenticateToken, employeeController.getEmployeeById);
router.post('/', authenticateToken, authorizeRoles('Admin', 'Manager'), employeeController.createEmployee);
router.put('/:id', authenticateToken, authorizeRoles('Admin', 'Manager'), employeeController.updateEmployee);
router.delete('/:id', authenticateToken, authorizeRoles('Admin'), employeeController.deleteEmployee);

module.exports = router;
