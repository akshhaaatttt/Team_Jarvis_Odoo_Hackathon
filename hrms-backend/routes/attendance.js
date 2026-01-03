const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { auth, checkRole, checkFirstLogin } = require('../middleware/auth');

// Check in/out
router.post('/check-in', auth, checkFirstLogin, attendanceController.checkIn);
router.post('/check-out', auth, checkFirstLogin, attendanceController.checkOut);

// Get my attendance
router.get('/me', auth, checkFirstLogin, attendanceController.getMyAttendance);

// Get all attendance (admin/hr)
router.get('/', auth, checkFirstLogin, checkRole('admin', 'hr'), attendanceController.getAllAttendance);

module.exports = router;
