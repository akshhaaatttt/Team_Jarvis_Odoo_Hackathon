const db = require('../config/database');

// Check in
exports.checkIn = async (req, res) => {
  try {
    const [emp] = await db.query('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
    const employeeId = emp[0].id;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().split(' ')[0];

    // Check if already checked in
    const [existing] = await db.query(
      'SELECT * FROM attendance WHERE employee_id = ? AND attendance_date = ?',
      [employeeId, today]
    );

    if (existing.length > 0 && existing[0].check_in) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    await db.query(
      `INSERT INTO attendance (employee_id, attendance_date, check_in, status) 
       VALUES (?, ?, ?, 'present')
       ON DUPLICATE KEY UPDATE check_in = ?, status = 'present'`,
      [employeeId, today, now, now]
    );

    res.json({ message: 'Checked in successfully', check_in: now });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Check out
exports.checkOut = async (req, res) => {
  try {
    const [emp] = await db.query('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
    const employeeId = emp[0].id;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().split(' ')[0];

    const [attendance] = await db.query(
      'SELECT * FROM attendance WHERE employee_id = ? AND attendance_date = ?',
      [employeeId, today]
    );

    if (attendance.length === 0 || !attendance[0].check_in) {
      return res.status(400).json({ error: 'Must check in first' });
    }

    if (attendance[0].check_out) {
      return res.status(400).json({ error: 'Already checked out' });
    }

    // Calculate work hours
    const checkIn = new Date(`2000-01-01 ${attendance[0].check_in}`);
    const checkOut = new Date(`2000-01-01 ${now}`);
    const breakMinutes = attendance[0].break_time_minutes || 60;
    
    const totalMinutes = (checkOut - checkIn) / 1000 / 60;
    const workMinutes = totalMinutes - breakMinutes;
    const workHours = (workMinutes / 60).toFixed(2);
    
    // Get standard hours from salary info
    const [salary] = await db.query(
      'SELECT working_days_per_week FROM salary_info WHERE employee_id = ?',
      [employeeId]
    );
    const standardDailyHours = 8; // Default 8 hours
    const extraHours = Math.max(0, workHours - standardDailyHours).toFixed(2);

    // Check for half-day
    const isHalfDay = workHours < (standardDailyHours / 2);
    const payableDays = isHalfDay ? 0.5 : 1.0;

    await db.query(
      `UPDATE attendance 
       SET check_out = ?, work_hours = ?, extra_hours = ?, is_payable = TRUE, is_half_day = ?, payable_days = ?
       WHERE employee_id = ? AND attendance_date = ?`,
      [now, workHours, extraHours, isHalfDay, payableDays, employeeId, today]
    );

    res.json({ 
      message: 'Checked out successfully', 
      check_out: now,
      work_hours: workHours,
      extra_hours: extraHours,
      is_half_day: isHalfDay,
      payable_days: payableDays
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get attendance (employee view)
exports.getMyAttendance = async (req, res) => {
  try {
    const { month, year, view } = req.query;
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    const [emp] = await db.query('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
    const employeeId = emp[0].id;

    const [attendance] = await db.query(
      `SELECT * FROM attendance 
       WHERE employee_id = ? 
       AND MONTH(attendance_date) = ? 
       AND YEAR(attendance_date) = ?
       ORDER BY attendance_date DESC`,
      [employeeId, currentMonth, currentYear]
    );

    // Calculate summary
    const daysPresent = attendance.filter(a => a.status === 'present').length;
    const leaveCount = attendance.filter(a => a.status === 'leave').length;
    const halfDays = attendance.filter(a => a.is_half_day).length;
    const totalWorkingDays = new Date(currentYear, currentMonth, 0).getDate();
    const totalPayableDays = attendance.reduce((sum, a) => sum + parseFloat(a.payable_days || 0), 0);

    // Weekly view
    if (view === 'weekly') {
      const weeks = {};
      attendance.forEach(a => {
        const date = new Date(a.attendance_date);
        const weekNum = Math.ceil(date.getDate() / 7);
        if (!weeks[weekNum]) {
          weeks[weekNum] = {
            week: weekNum,
            present_days: 0,
            total_hours: 0,
            extra_hours: 0,
            half_days: 0,
            records: []
          };
        }
        if (a.status === 'present') weeks[weekNum].present_days++;
        weeks[weekNum].total_hours += parseFloat(a.work_hours || 0);
        weeks[weekNum].extra_hours += parseFloat(a.extra_hours || 0);
        if (a.is_half_day) weeks[weekNum].half_days++;
        weeks[weekNum].records.push(a);
      });

      return res.json({
        view: 'weekly',
        weeks: Object.values(weeks),
        summary: {
          days_present: daysPresent,
          leaves: leaveCount,
          half_days: halfDays,
          total_working_days: totalWorkingDays,
          total_payable_days: totalPayableDays.toFixed(2)
        }
      });
    }

    res.json({
      view: 'daily',
      attendance,
      summary: {
        days_present: daysPresent,
        leaves: leaveCount,
        half_days: halfDays,
        total_working_days: totalWorkingDays,
        total_payable_days: totalPayableDays.toFixed(2)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all attendance (admin/hr view)
exports.getAllAttendance = async (req, res) => {
  try {
    const { date, employee_id } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    let query = `
      SELECT 
        a.*,
        e.first_name,
        e.last_name,
        e.job_position,
        e.department
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      WHERE a.attendance_date = ?
    `;
    const params = [targetDate];

    if (employee_id) {
      query += ' AND a.employee_id = ?';
      params.push(employee_id);
    }

    query += ' ORDER BY a.check_in DESC';

    const [attendance] = await db.query(query, params);

    const attendanceWithNames = attendance.map(a => ({
      ...a,
      employee_name: `${a.first_name} ${a.last_name}`
    }));

    res.json(attendanceWithNames);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
