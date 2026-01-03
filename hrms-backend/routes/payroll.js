const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const { auth, checkRole, checkFirstLogin } = require('../middleware/auth');

// Generate payroll (Admin only)
router.post('/generate', auth, checkFirstLogin, checkRole('admin', 'hr'), payrollController.generatePayroll);

// Get salary slip
router.get('/salary-slip', auth, checkFirstLogin, payrollController.getSalarySlip);

// Get payroll reports (Admin only)
router.get('/reports', auth, checkFirstLogin, checkRole('admin', 'hr'), payrollController.getPayrollReports);

// Approve payroll (Admin only)
router.put('/:id/approve', auth, checkFirstLogin, checkRole('admin'), payrollController.approvePayroll);

module.exports = router;
