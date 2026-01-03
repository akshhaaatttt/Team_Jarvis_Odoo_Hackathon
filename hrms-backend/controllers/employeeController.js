const db = require('../config/database');

// Get all employees with status
exports.getAllEmployees = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const [employees] = await db.query(
      `SELECT 
        e.id,
        e.first_name,
        e.last_name,
        e.job_position,
        e.department,
        e.profile_picture,
        u.login_id,
        COALESCE(a.status, 'absent') as status,
        a.check_in
      FROM employees e
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN attendance a ON e.id = a.employee_id AND a.attendance_date = ?
      ORDER BY e.first_name, e.last_name`,
      [today]
    );

    // Determine status icon
    const employeesWithStatus = employees.map(emp => {
      let statusIcon = '🟡'; // Yellow - absent
      
      if (emp.status === 'present') {
        statusIcon = '🟢'; // Green - present
      } else if (emp.status === 'leave') {
        statusIcon = '✈️'; // Airplane - on leave
      }
      
      return {
        ...emp,
        name: `${emp.first_name} ${emp.last_name}`,
        statusIcon
      };
    });

    res.json(employeesWithStatus);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get employee by ID
exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'hr';
    
    const [employees] = await db.query(
      `SELECT e.*, u.login_id, u.role 
       FROM employees e 
       JOIN users u ON e.user_id = u.id 
       WHERE e.id = ?`,
      [id]
    );

    if (employees.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const employee = employees[0];

    // Get salary info if admin
    if (isAdmin) {
      const [salary] = await db.query('SELECT * FROM salary_info WHERE employee_id = ?', [id]);
      employee.salary_info = salary[0] || null;
    }

    res.json(employee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get current user profile
exports.getMyProfile = async (req, res) => {
  try {
    console.log('getMyProfile called for user:', req.user.id, 'role:', req.user.role);
    
    const [employees] = await db.query(
      `SELECT e.*, u.login_id, u.role 
       FROM employees e 
       JOIN users u ON e.user_id = u.id 
       WHERE u.id = ?`,
      [req.user.id]
    );

    console.log('Query result - found', employees.length, 'employees');

    if (employees.length === 0) {
      console.error('No employee found for user_id:', req.user.id);
      return res.status(404).json({ error: 'Profile not found' });
    }

    const employee = employees[0];
    const isAdmin = req.user.role === 'admin' || req.user.role === 'hr';

    // Get salary info if admin
    if (isAdmin) {
      const [salary] = await db.query('SELECT * FROM salary_info WHERE employee_id = ?', [employee.id]);
      employee.salary_info = salary[0] || null;
    }

    res.json(employee);
  } catch (error) {
    console.error('Error in getMyProfile:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update employee profile
exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'hr';

    // Only allow updating own profile unless admin/hr
    if (!isAdmin) {
      const [emp] = await db.query('SELECT user_id FROM employees WHERE id = ?', [id]);
      if (emp[0].user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Employee can only edit limited fields
    const employeeEditableFields = ['address', 'mobile', 'personal_email'];
    
    const adminEditableFields = [
      'email', 'mobile', 'personal_email', 'address', 'nationality', 
      'gender', 'marital_status', 'account_number', 'bank_name', 
      'ifsc_code', 'pan_number', 'uan_number', 'esi_number',
      'about', 'why_love_job', 'interests', 'skills', 'certifications',
      'job_position', 'department', 'manager', 'location', 'company'
    ];

    const allowedFields = isAdmin ? adminEditableFields : employeeEditableFields;

    const updateFields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(id);
    await db.query(
      `UPDATE employees SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
