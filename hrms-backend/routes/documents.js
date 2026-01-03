const express = require('express');
const router = express.Router();
const multer = require('multer');
const documentController = require('../controllers/documentController');
const { auth, checkRole, checkFirstLogin } = require('../middleware/auth');

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documents/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Upload document
router.post('/', auth, checkFirstLogin, upload.single('file'), documentController.uploadDocument);

// Get documents
router.get('/', auth, checkFirstLogin, documentController.getDocuments);

// Download document
router.get('/:id/download', auth, checkFirstLogin, documentController.downloadDocument);

// Delete document
router.delete('/:id', auth, checkFirstLogin, documentController.deleteDocument);

module.exports = router;
