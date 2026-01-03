const db = require('../config/database');
const { getEffectiveSalary, calculateSalaryComponents } = require('./salaryStructureController');

// Helper function to calculate salary components
const calculateComponents = (monthlyWage, stdAllowance = 1500, professionalTax = 200) => {
  const basic = monthlyWage * 0.5;
  const hra = basic * 0.5;
  const performanceBonus = monthlyWage * 0.0833;
  const lta = monthlyWage * 0.0833;
  const pfEmployee = basic * 0.12;
  const pfEmployer = basic * 0.12;
  const totalOtherComponents = basic + hra + stdAllowance + performanceBonus + lta;
  const fixedAllowance = Math.max(0, monthlyWage - totalOtherComponents);
  
  return {
    basic: parseFloat(basic.toFixed(2)),
    hra: parseFloat(hra.toFixed(2)),
    stdAllowance: parseFloat(stdAllowance.toFixed(2)),
    lta: parseFloat(lta.toFixed(2)),
    performanceBonus: parseFloat(performanceBonus.toFixed(2)),
    fixedAllowance: parseFloat(fixedAllowance.toFixed(2)),
    pfEmployee: parseFloat(pfEmployee.toFixed(2)),
    pfEmployer: parseFloat(pfEmployer.toFixed(2)),
    professionalTax: parseFloat(professionalTax.toFixed(2))
  };
};

// Generate payroll for a month
exports.generatePayroll = async (req, res) => {
  try {
    const { employee_id, month, year } = req.body;

    // Get employee salary info
    const [salary] = await db.query(
      'SELECT * FROM salary_info WHERE employee_id = ?',
      [employee_id]
    );

    if (salary.length === 0) {
      return res.status(404).json({ error: 'Salary info not found' });
    }

    const salaryInfo = salary[0];

    // Calculate working days in month
    const totalWorkingDays = new Date(year, month, 0).getDate();

    // Get attendance data
    const [attendance] = await db.query(
      `SELECT 
        SUM(CASE WHEN status = 'present' THEN payable_days ELSE 0 END) as present_days,
        SUM(CASE WHEN status = 'leave' AND is_payable = TRUE THEN payable_days ELSE 0 END) as paid_leave_days,
        SUM(CASE WHEN status = 'leave' AND is_payable = FALSE THEN 1 ELSE 0 END) as unpaid_leave_days,
        SUM(payable_days) as total_payable_days
       FROM attendance
       WHERE employee_id = ? AND MONTH(attendance_date) = ? AND YEAR(attendance_date) = ?`,
      [employee_id, month, year]
    );

    const presentDays = parseFloat(attendance[0].present_days) || 0;
    const paidLeaveDays = parseFloat(attendance[0].paid_leave_days) || 0;
    const unpaidLeaveDays = parseFloat(attendance[0].unpaid_leave_days) || 0;
    const payableDays = parseFloat(attendance[0].total_payable_days) || 0;

    // Calculate pro-rated salary
    const perDaySalary = salaryInfo.monthly_wage / totalWorkingDays;
    const unpaidDeduction = (totalWorkingDays - payableDays) * perDaySalary;

    // Calculate components
    const basicSalary = salaryInfo.basic * (payableDays / totalWorkingDays);
    const hra = salaryInfo.hra * (payableDays / totalWorkingDays);
    const standardAllowance = salaryInfo.standard_allowance;
    const performanceBonus = salaryInfo.performance_bonus * (payableDays / totalWorkingDays);
    const lta = salaryInfo.lta * (payableDays / totalWorkingDays);
    const fixedAllowance = salaryInfo.fixed_allowance * (payableDays / totalWorkingDays);

    const grossSalary = basicSalary + hra + standardAllowance + performanceBonus + lta + fixedAllowance;

    // Deductions
    const employeePf = basicSalary * 0.12;
    const professionalTax = payableDays >= totalWorkingDays * 0.5 ? salaryInfo.professional_tax : 0;
    const totalDeductions = employeePf + professionalTax + unpaidDeduction;

    const netSalary = grossSalary - totalDeductions;

    // Insert or update payroll
    await db.query(
      `INSERT INTO payroll (
        employee_id, month, year, total_working_days, present_days, paid_leave_days, unpaid_leave_days, payable_days,
        basic_salary, hra, standard_allowance, performance_bonus, lta, fixed_allowance, gross_salary,
        employee_pf, professional_tax, unpaid_deduction, total_deductions, net_salary,
        status, generated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)
      ON DUPLICATE KEY UPDATE
        total_working_days = VALUES(total_working_days),
        present_days = VALUES(present_days),
        paid_leave_days = VALUES(paid_leave_days),
        unpaid_leave_days = VALUES(unpaid_leave_days),
        payable_days = VALUES(payable_days),
        basic_salary = VALUES(basic_salary),
        hra = VALUES(hra),
        standard_allowance = VALUES(standard_allowance),
        performance_bonus = VALUES(performance_bonus),
        lta = VALUES(lta),
        fixed_allowance = VALUES(fixed_allowance),
        gross_salary = VALUES(gross_salary),
        employee_pf = VALUES(employee_pf),
        professional_tax = VALUES(professional_tax),
        unpaid_deduction = VALUES(unpaid_deduction),
        total_deductions = VALUES(total_deductions),
        net_salary = VALUES(net_salary),
        generated_by = VALUES(generated_by),
        generated_at = CURRENT_TIMESTAMP`,
      [
        employee_id, month, year, totalWorkingDays, presentDays, paidLeaveDays, unpaidLeaveDays, payableDays,
        basicSalary, hra, standardAllowance, performanceBonus, lta, fixedAllowance, grossSalary,
        employeePf, professionalTax, unpaidDeduction, totalDeductions, netSalary,
        req.user.id
      ]
    );

    res.json({ message: 'Payroll generated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get salary slip
exports.getSalarySlip = async (req, res) => {
  try {
    const { employee_id, month, year } = req.query;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'hr';

    // Check permissions
    if (!isAdmin) {
      const [emp] = await db.query('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
      if (parseInt(employee_id) !== emp[0].id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const [payroll] = await db.query(
      `SELECT p.*, e.first_name, e.last_name, e.job_position, e.department, e.date_of_joining
       FROM payroll p
       JOIN employees e ON p.employee_id = e.id
       WHERE p.employee_id = ? AND p.month = ? AND p.year = ?`,
      [employee_id, month, year]
    );

    if (payroll.length === 0) {
      return res.status(404).json({ error: 'Salary slip not found' });
    }

    res.json(payroll[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get payroll reports (Admin only)
exports.getPayrollReports = async (req, res) => {
  try {
    const { month, year } = req.query;

    const [payroll] = await db.query(
      `SELECT 
        p.*,
        e.first_name,
        e.last_name,
        e.job_position,
        e.department
       FROM payroll p
       JOIN employees e ON p.employee_id = e.id
       WHERE p.month = ? AND p.year = ?
       ORDER BY e.first_name, e.last_name`,
      [month, year]
    );

    res.json(payroll);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Approve payroll
exports.approvePayroll = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      `UPDATE payroll 
       SET status = 'approved', approved_by = ?, approved_at = NOW()
       WHERE id = ?`,
      [req.user.id, id]
    );

    res.json({ message: 'Payroll approved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
