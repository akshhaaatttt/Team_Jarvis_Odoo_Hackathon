const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salaryController');
const { auth, checkRole, checkFirstLogin } = require('../middleware/auth');

// All salary routes are admin-only
router.get('/:employee_id', auth, checkFirstLogin, checkRole('admin'), salaryController.getSalaryInfo);
router.put('/:employee_id', auth, checkFirstLogin, checkRole('admin'), salaryController.updateSalaryInfo);
router.get('/:employee_id/payable-days', auth, checkFirstLogin, checkRole('admin'), salaryController.getPayableDays);

module.exports = router;
