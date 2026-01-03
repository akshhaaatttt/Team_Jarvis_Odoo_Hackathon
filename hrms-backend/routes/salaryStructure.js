const express = require('express');
const router = express.Router();
const salaryStructureController = require('../controllers/salaryStructureController');
const { auth, checkRole, checkFirstLogin } = require('../middleware/auth');

// Admin-only routes for salary structure
router.post(
  '/structure',
  auth,
  checkFirstLogin,
  checkRole(['admin', 'hr']),
  salaryStructureController.createOrUpdateSalaryStructure
);

router.get(
  '/structure',
  auth,
  checkFirstLogin,
  checkRole(['admin', 'hr']),
  salaryStructureController.getAllSalaryStructures
);

router.get(
  '/structure/:employee_id',
  auth,
  checkFirstLogin,
  checkRole(['admin', 'hr']),
  salaryStructureController.getSalaryStructure
);

router.delete(
  '/structure/:employee_id',
  auth,
  checkFirstLogin,
  checkRole(['admin', 'hr']),
  salaryStructureController.deleteSalaryStructure
);

// Admin-only routes for salary revisions
router.post(
  '/revision',
  auth,
  checkFirstLogin,
  checkRole(['admin', 'hr']),
  salaryStructureController.createSalaryRevision
);

router.get(
  '/revision/:employee_id',
  auth,
  checkFirstLogin,
  checkRole(['admin', 'hr']),
  salaryStructureController.getSalaryRevisionHistory
);

module.exports = router;
