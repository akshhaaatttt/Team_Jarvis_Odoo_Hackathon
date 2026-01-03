const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth, checkRole } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/change-password', auth, authController.changePassword);
router.post('/signup', authController.signUp);
router.get('/pending-signups', auth, checkRole(['admin', 'hr']), authController.getPendingSignups);
router.post('/approve-signup/:id', auth, checkRole(['admin', 'hr']), authController.approveSignup);
router.delete('/reject-signup/:id', auth, checkRole(['admin', 'hr']), authController.rejectSignup);

module.exports = router;
