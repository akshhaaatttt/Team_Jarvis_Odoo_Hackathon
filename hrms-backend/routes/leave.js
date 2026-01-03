const express = require('express');
const router = express.Router();
const multer = require('multer');
const leaveController = require('../controllers/leaveController');
const { auth, checkRole, checkFirstLogin } = require('../middleware/auth');

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/leave-attachments/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Create leave request
router.post('/', auth, checkFirstLogin, upload.single('attachment'), leaveController.createLeaveRequest);

// Get leave requests
router.get('/', auth, checkFirstLogin, leaveController.getLeaveRequests);

// Approve/reject leave (admin/hr)
router.put('/:id', auth, checkFirstLogin, checkRole('admin', 'hr'), leaveController.updateLeaveStatus);

// Get leave allocation
router.get('/allocation', auth, checkFirstLogin, leaveController.getLeaveAllocation);

module.exports = router;
