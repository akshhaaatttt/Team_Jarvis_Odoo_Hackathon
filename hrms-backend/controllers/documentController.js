const db = require('../config/database');
const fs = require('fs');
const path = require('path');

// Upload document
exports.uploadDocument = async (req, res) => {
  try {
    const { document_type, description } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const [emp] = await db.query('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
    const employeeId = emp[0].id;

    await db.query(
      `INSERT INTO employee_documents (employee_id, document_type, file_name, file_path, file_size, description, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [employeeId, document_type, file.originalname, file.path, file.size, description, req.user.id]
    );

    res.status(201).json({ message: 'Document uploaded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get documents
exports.getDocuments = async (req, res) => {
  try {
    const { employee_id } = req.query;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'hr';

    let query = `
      SELECT 
        d.*,
        e.first_name,
        e.last_name,
        u.login_id as uploaded_by_login
      FROM employee_documents d
      JOIN employees e ON d.employee_id = e.id
      LEFT JOIN users u ON d.uploaded_by = u.id
    `;

    const params = [];

    if (!isAdmin) {
      // Employees can only see their own documents
      const [emp] = await db.query('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
      query += ' WHERE d.employee_id = ?';
      params.push(emp[0].id);
    } else if (employee_id) {
      query += ' WHERE d.employee_id = ?';
      params.push(employee_id);
    }

    query += ' ORDER BY d.upload_date DESC';

    const [documents] = await db.query(query, params);

    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete document
exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'hr';

    const [documents] = await db.query('SELECT * FROM employee_documents WHERE id = ?', [id]);
    
    if (documents.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = documents[0];

    // Check permissions
    if (!isAdmin) {
      const [emp] = await db.query('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
      if (document.employee_id !== emp[0].id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Delete file from filesystem
    if (fs.existsSync(document.file_path)) {
      fs.unlinkSync(document.file_path);
    }

    // Delete from database
    await db.query('DELETE FROM employee_documents WHERE id = ?', [id]);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Download document
exports.downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'hr';

    const [documents] = await db.query('SELECT * FROM employee_documents WHERE id = ?', [id]);
    
    if (documents.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = documents[0];

    // Check permissions
    if (!isAdmin) {
      const [emp] = await db.query('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
      if (document.employee_id !== emp[0].id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    if (!fs.existsSync(document.file_path)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(document.file_path, document.file_name);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
