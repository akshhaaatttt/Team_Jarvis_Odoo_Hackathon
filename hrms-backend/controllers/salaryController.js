const db = require('../config/database');

// Get salary info (admin only)
exports.getSalaryInfo = async (req, res) => {
  try {
    const { employee_id } = req.params;

    const [salary] = await db.query(
      `SELECT s.*, e.first_name, e.last_name 
       FROM salary_info s
       JOIN employees e ON s.employee_id = e.id
       WHERE s.employee_id = ?`,
      [employee_id]
    );

    if (salary.length === 0) {
      return res.status(404).json({ error: 'Salary info not found' });
    }

    res.json(salary[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update salary info (admin only)
exports.updateSalaryInfo = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { monthly_wage, working_days_per_week, break_time_minutes, professional_tax } = req.body;

    // Recalculate components
    const basic = monthly_wage * 0.5;
    const hra = basic * 0.5;
    const standardAllowance = 1000;
    const performanceBonus = monthly_wage * 0.0833;
    const lta = monthly_wage * 0.0833;
    const fixedAllowance = monthly_wage - (basic + hra + standardAllowance + performanceBonus + lta);
    const employeePf = basic * 0.12;
    const employerPf = basic * 0.12;
    const yearlyWage = monthly_wage * 12;

    await db.query(
      `UPDATE salary_info 
       SET monthly_wage = ?,
           yearly_wage = ?,
           working_days_per_week = ?,
           break_time_minutes = ?,
           professional_tax = ?,
           basic = ?,
           hra = ?,
           performance_bonus = ?,
           lta = ?,
           fixed_allowance = ?,
           employee_pf = ?,
           employer_pf = ?
       WHERE employee_id = ?`,
      [
        monthly_wage, yearlyWage, working_days_per_week, break_time_minutes, 
        professional_tax, basic, hra, performanceBonus, lta, fixedAllowance,
        employeePf, employerPf, employee_id
      ]
    );

    res.json({ message: 'Salary info updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get payable days for month
exports.getPayableDays = async (req, res) => {
  try {
    const { employee_id, month, year } = req.query;
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    const [attendance] = await db.query(
      `SELECT COUNT(*) as payable_days 
       FROM attendance 
       WHERE employee_id = ? 
       AND MONTH(attendance_date) = ? 
       AND YEAR(attendance_date) = ?
       AND is_payable = TRUE`,
      [employee_id, currentMonth, currentYear]
    );

    const totalDays = new Date(currentYear, currentMonth, 0).getDate();
    const payableDays = attendance[0].payable_days;
    const unpaidDays = totalDays - payableDays;

    res.json({
      total_days: totalDays,
      payable_days: payableDays,
      unpaid_days: unpaidDays
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
