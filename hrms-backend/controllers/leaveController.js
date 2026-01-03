const db = require('../config/database');

// Create leave request
exports.createLeaveRequest = async (req, res) => {
  try {
    const { leave_type_id, from_date, to_date, reason, remarks } = req.body;
    const attachment = req.file ? req.file.path : null;

    const [emp] = await db.query('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
    const employeeId = emp[0].id;

    // Calculate days
    const start = new Date(from_date);
    const end = new Date(to_date);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Check leave type
    const [leaveType] = await db.query('SELECT * FROM leave_types WHERE id = ?', [leave_type_id]);
    if (leaveType.length === 0) {
      return res.status(400).json({ error: 'Invalid leave type' });
    }

    // Check if attachment required
    if (leaveType[0].requires_attachment && !attachment) {
      return res.status(400).json({ error: 'Attachment required for this leave type' });
    }

    // Check balance
    const currentYear = new Date().getFullYear();
    const [allocation] = await db.query(
      'SELECT * FROM leave_allocation WHERE employee_id = ? AND leave_type_id = ? AND year = ?',
      [employeeId, leave_type_id, currentYear]
    );

    if (allocation.length === 0) {
      return res.status(400).json({ error: 'No leave allocation found' });
    }

    if (allocation[0].remaining_days < days) {
      return res.status(400).json({ error: 'Insufficient leave balance' });
    }

    // Create request
    await db.query(
      `INSERT INTO leave_requests (employee_id, leave_type_id, from_date, to_date, days, reason, remarks, attachment, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [employeeId, leave_type_id, from_date, to_date, days, reason, remarks, attachment]
    );

    res.status(201).json({ message: 'Leave request submitted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get leave requests
exports.getLeaveRequests = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'hr';
    
    let query = `
      SELECT 
        lr.*,
        e.first_name,
        e.last_name,
        lt.name as leave_type_name,
        lt.is_paid
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      JOIN leave_types lt ON lr.leave_type_id = lt.id
    `;

    const params = [];

    if (!isAdmin) {
      const [emp] = await db.query('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
      query += ' WHERE lr.employee_id = ?';
      params.push(emp[0].id);
    }

    query += ' ORDER BY lr.created_at DESC';

    const [requests] = await db.query(query, params);

    const requestsWithNames = requests.map(r => ({
      ...r,
      employee_name: `${r.first_name} ${r.last_name}`
    }));

    res.json(requestsWithNames);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Approve/Reject leave (admin/hr only)
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason, approval_comment } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const [request] = await db.query('SELECT * FROM leave_requests WHERE id = ?', [id]);
    if (request.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request[0].status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed' });
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Update request status
      await conn.query(
        `UPDATE leave_requests 
         SET status = ?, approved_by = ?, approved_at = NOW(), rejection_reason = ?, approval_comment = ?
         WHERE id = ?`,
        [status, req.user.id, rejection_reason, approval_comment, id]
      );

      if (status === 'approved') {
        const leaveReq = request[0];
        
        // Update leave allocation
        await conn.query(
          `UPDATE leave_allocation 
           SET used_days = used_days + ?, remaining_days = remaining_days - ?
           WHERE employee_id = ? AND leave_type_id = ? AND year = YEAR(CURDATE())`,
          [leaveReq.days, leaveReq.days, leaveReq.employee_id, leaveReq.leave_type_id]
        );

        // Create attendance records for leave period
        const start = new Date(leaveReq.from_date);
        const end = new Date(leaveReq.to_date);
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          
          // Check if leave is paid
          const [leaveType] = await conn.query('SELECT is_paid FROM leave_types WHERE id = ?', [leaveReq.leave_type_id]);
          const isPaid = leaveType[0].is_paid;
          
          await conn.query(
            `INSERT INTO attendance (employee_id, attendance_date, status, is_payable)
             VALUES (?, ?, 'leave', ?)
             ON DUPLICATE KEY UPDATE status = 'leave', is_payable = ?`,
            [leaveReq.employee_id, dateStr, isPaid, isPaid]
          );
        }
      }

      await conn.commit();
      res.json({ message: `Leave request ${status}` });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get leave allocation
exports.getLeaveAllocation = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'hr';
    const currentYear = new Date().getFullYear();
    
    let query = `
      SELECT 
        la.*,
        e.first_name,
        e.last_name,
        lt.name as leave_type_name
      FROM leave_allocation la
      JOIN employees e ON la.employee_id = e.id
      JOIN leave_types lt ON la.leave_type_id = lt.id
      WHERE la.year = ?
    `;

    const params = [currentYear];

    if (!isAdmin) {
      const [emp] = await db.query('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
      query += ' AND la.employee_id = ?';
      params.push(emp[0].id);
    }

    const [allocation] = await db.query(query, params);

    const allocationWithNames = allocation.map(a => ({
      ...a,
      employee_name: `${a.first_name} ${a.last_name}`
    }));

    res.json(allocationWithNames);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
