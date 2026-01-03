const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const authController = require('../controllers/authController');
const { auth, checkRole, checkFirstLogin } = require('../middleware/auth');

// Create user (admin/hr only)
router.post('/', auth, checkRole('admin', 'hr'), authController.createUser);

// Get all employees (dashboard)
router.get('/', auth, checkFirstLogin, employeeController.getAllEmployees);

// Get my profile
router.get('/me', auth, checkFirstLogin, employeeController.getMyProfile);

// Get employee by ID
router.get('/:id', auth, checkFirstLogin, employeeController.getEmployeeById);

// Update profile
router.put('/:id', auth, checkFirstLogin, employeeController.updateProfile);

module.exports = router;
