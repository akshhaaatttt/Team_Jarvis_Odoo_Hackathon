const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollSummaryController');
const { auth, checkRole, checkFirstLogin } = require('../middleware/auth');

// Generate payroll (Admin-only)
router.post(
  '/generate',
  auth,
  checkFirstLogin,
  checkRole(['admin', 'hr']),
  payrollController.generatePayroll
);

// Get payroll reports (Admin-only)
router.get(
  '/reports',
  auth,
  checkFirstLogin,
  checkRole(['admin', 'hr']),
  payrollController.getPayrollReports
);

// Get salary slip (Employee can see their own, Admin can see any)
router.get(
  '/salary-slip',
  auth,
  checkFirstLogin,
  payrollController.getSalarySlip
);

// Approve payroll (Admin-only)
router.put(
  '/:id/approve',
  auth,
  checkFirstLogin,
  checkRole(['admin', 'hr']),
  payrollController.approvePayroll
);

module.exports = router;
