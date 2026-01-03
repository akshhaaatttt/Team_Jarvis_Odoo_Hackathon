const db = require('../config/database');

// Helper function to calculate salary components
const calculateComponents = (monthlyWage, stdAllowance = 1500, professionalTax = 200) => {
  const wage = parseFloat(monthlyWage) || 0;
  const allowance = parseFloat(stdAllowance) || 1500;
  const tax = parseFloat(professionalTax) || 200;
  
  const basic = wage * 0.5;
  const hra = basic * 0.5;
  const performanceBonus = wage * 0.0833;
  const lta = wage * 0.0833;
  const pfEmployee = basic * 0.12;
  const pfEmployer = basic * 0.12;
  const totalOtherComponents = basic + hra + allowance + performanceBonus + lta;
  const fixedAllowance = Math.max(0, wage - totalOtherComponents);
  
  return {
    basic: parseFloat(basic.toFixed(2)),
    hra: parseFloat(hra.toFixed(2)),
    stdAllowance: parseFloat(allowance.toFixed(2)),
    lta: parseFloat(lta.toFixed(2)),
    performanceBonus: parseFloat(performanceBonus.toFixed(2)),
    fixedAllowance: parseFloat(fixedAllowance.toFixed(2)),
    pfEmployee: parseFloat(pfEmployee.toFixed(2)),
    pfEmployer: parseFloat(pfEmployer.toFixed(2)),
    professionalTax: parseFloat(tax.toFixed(2))
  };
};

// Get effective salary for a specific month (from revision history)
const getEffectiveSalary = async (month, year, employeeId) => {
  try {
    const targetDate = `${year}-${String(month).padStart(2, '0')}-01`;
    
    // Get the most recent revision that is effective for this month
    const [revisions] = await db.query(
      `SELECT monthly_wage FROM salary_revision
       WHERE employee_id = ? AND effective_from_date <= ?
       ORDER BY effective_from_date DESC LIMIT 1`,
      [employeeId, targetDate]
    );
    
    if (revisions.length > 0) {
      return revisions[0].monthly_wage;
    }
    
    // Fallback to current salary structure
    const [structure] = await db.query(
      'SELECT monthly_wage, std_allowance, professional_tax FROM salary_structure WHERE employee_id = ?',
      [employeeId]
    );
    
    return structure.length > 0 ? structure[0] : null;
  } catch (error) {
    console.error('Error getting effective salary:', error);
    return null;
  }
};

// Generate payroll for all employees or specific employee (Admin-only)
exports.generatePayroll = async (req, res) => {
  try {
    const { month, year } = req.body;
    
    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    // Get total days in month
    const totalDays = new Date(year, month, 0).getDate();

    // Get all employees with salary structure
    const [employees] = await db.query(
      `SELECT DISTINCT e.id as employee_id
       FROM employees e
       INNER JOIN salary_structure ss ON e.id = ss.employee_id`
    );

    if (employees.length === 0) {
      return res.status(404).json({ error: 'No employees with salary structure found' });
    }

    let processedCount = 0;
    const errors = [];

    for (const emp of employees) {
      try {
        const employeeId = emp.employee_id;

        // Get effective salary for this month
        const salaryData = await getEffectiveSalary(month, year, employeeId);
        if (!salaryData) {
          errors.push(`Employee ${employeeId}: No salary structure found`);
          continue;
        }

        const monthlyWage = salaryData.monthly_wage || salaryData;
        const stdAllowance = salaryData.std_allowance || 1500;
        const professionalTax = salaryData.professional_tax || 200;

        // Calculate components
        const components = calculateComponents(monthlyWage, stdAllowance, professionalTax);

        // Get attendance data
        const [attendance] = await db.query(
          `SELECT 
            SUM(CASE WHEN status = 'present' AND is_half_day = FALSE THEN 1
                     WHEN status = 'present' AND is_half_day = TRUE THEN 0.5
                     ELSE 0 END) as present_days,
            SUM(CASE WHEN status = 'present' THEN payable_days ELSE 0 END) as present_payable,
            COUNT(CASE WHEN status = 'leave' THEN 1 END) as leave_count
           FROM attendance
           WHERE employee_id = ? AND MONTH(attendance_date) = ? AND YEAR(attendance_date) = ?`,
          [employeeId, month, year]
        );

        // Get approved leave days
        const [leaves] = await db.query(
          `SELECT DATEDIFF(to_date, from_date) + 1 as days
           FROM leave_requests
           WHERE employee_id = ? AND status = 'approved'
           AND ((MONTH(from_date) = ? AND YEAR(from_date) = ?)
                OR (MONTH(to_date) = ? AND YEAR(to_date) = ?))`,
          [employeeId, month, year, month, year]
        );

        const presentDays = parseFloat(attendance[0].present_days) || 0;
        const leaveDays = leaves.reduce((sum, l) => sum + l.days, 0);
        const unpaidDays = Math.max(0, totalDays - presentDays - leaveDays);
        const payableDays = presentDays + leaveDays;

        // Pro-rate salary based on payable days
        const salaryFactor = payableDays / totalDays;
        const basicSalary = components.basic * salaryFactor;
        const hra = components.hra * salaryFactor;
        const ltaAmount = components.lta * salaryFactor;
        const performanceBonus = components.performanceBonus * salaryFactor;
        const fixedAllowance = components.fixedAllowance * salaryFactor;

        const grossSalary = basicSalary + hra + components.stdAllowance + ltaAmount + performanceBonus + fixedAllowance;

        // Deductions
        const pfEmployee = components.pfEmployee * salaryFactor;
        const pfEmployer = components.pfEmployer * salaryFactor;
        const profTax = salaryFactor >= 0.5 ? components.professionalTax : 0;
        const totalDeductions = pfEmployee + profTax;

        const netSalary = grossSalary - totalDeductions;

        // Insert or update payroll_summary
        await db.query(
          `INSERT INTO payroll_summary (
            employee_id, month, year, total_days, present_days, leave_days, unpaid_days, payable_days,
            basic_salary, hra, std_allowance, lta, performance_bonus, fixed_allowance,
            gross_salary, pf_employee, pf_employer, professional_tax, total_deductions, net_salary,
            generated_from_attendance, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, 'pending')
          ON DUPLICATE KEY UPDATE
            total_days = VALUES(total_days),
            present_days = VALUES(present_days),
            leave_days = VALUES(leave_days),
            unpaid_days = VALUES(unpaid_days),
            payable_days = VALUES(payable_days),
            basic_salary = VALUES(basic_salary),
            hra = VALUES(hra),
            std_allowance = VALUES(std_allowance),
            lta = VALUES(lta),
            performance_bonus = VALUES(performance_bonus),
            fixed_allowance = VALUES(fixed_allowance),
            gross_salary = VALUES(gross_salary),
            pf_employee = VALUES(pf_employee),
            pf_employer = VALUES(pf_employer),
            professional_tax = VALUES(professional_tax),
            total_deductions = VALUES(total_deductions),
            net_salary = VALUES(net_salary),
            generated_from_attendance = TRUE,
            updated_at = NOW()`,
          [
            employeeId, month, year, totalDays, presentDays, leaveDays, unpaidDays, payableDays,
            basicSalary, hra, components.stdAllowance, ltaAmount, performanceBonus, fixedAllowance,
            grossSalary, pfEmployee, pfEmployer, profTax, totalDeductions, netSalary
          ]
        );

        processedCount++;
      } catch (error) {
        console.error(`Error processing employee ${emp.employee_id}:`, error);
        errors.push(`Employee ${emp.employee_id}: ${error.message}`);
      }
    }

    res.json({
      message: 'Payroll generation completed',
      processed: processedCount,
      total: employees.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error generating payroll:', error);
    res.status(500).json({ error: 'Failed to generate payroll' });
  }
};

// Get payroll reports (Admin-only)
exports.getPayrollReports = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    const [payroll] = await db.query(
      `SELECT ps.*, 
       CONCAT(e.first_name, ' ', e.last_name) as employee_name,
       u.login_id as employee_login_id,
       e.job_position, e.department
       FROM payroll_summary ps
       JOIN employees e ON ps.employee_id = e.id
       JOIN users u ON e.user_id = u.id
       WHERE ps.month = ? AND ps.year = ?
       ORDER BY e.first_name`,
      [month, year]
    );

    res.json(payroll);
  } catch (error) {
    console.error('Error fetching payroll reports:', error);
    res.status(500).json({ error: 'Failed to fetch payroll reports' });
  }
};

// Get salary slip (Employee read-only view)
exports.getSalarySlip = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    // Get employee_id from user_id
    const [employeeData] = await db.query(
      'SELECT id FROM employees WHERE user_id = ?',
      [req.user.id]
    );

    if (employeeData.length === 0) {
      return res.status(404).json({ error: 'Employee record not found' });
    }

    const employeeId = employeeData[0].id;

    // Employees can only see their own slip, admins can see anyone's
    const targetEmployeeId = (req.user.role === 'admin' || req.user.role === 'hr') && req.query.employee_id
      ? req.query.employee_id 
      : employeeId;

    const [payroll] = await db.query(
      `SELECT ps.*, 
       CONCAT(e.first_name, ' ', e.last_name) as employee_name,
       e.job_position, e.department, e.email,
       u.login_id as employee_login_id
       FROM payroll_summary ps
       JOIN employees e ON ps.employee_id = e.id
       JOIN users u ON e.user_id = u.id
       WHERE ps.employee_id = ? AND ps.month = ? AND ps.year = ?`,
      [targetEmployeeId, month, year]
    );

    if (payroll.length === 0) {
      return res.status(404).json({ error: 'Salary slip not found for this period' });
    }

    res.json(payroll[0]);
  } catch (error) {
    console.error('Error fetching salary slip:', error);
    res.status(500).json({ error: 'Failed to fetch salary slip' });
  }
};

// Approve payroll (Admin-only)
exports.approvePayroll = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      `UPDATE payroll_summary 
       SET status = 'approved', approved_by = ?, approved_at = NOW()
       WHERE id = ?`,
      [req.user.id, id]
    );

    res.json({ message: 'Payroll approved successfully' });
  } catch (error) {
    console.error('Error approving payroll:', error);
    res.status(500).json({ error: 'Failed to approve payroll' });
  }
};

module.exports = exports;
