const db = require('../config/database');

// Auto-calculate salary components based on monthly wage
const calculateSalaryComponents = (monthlyWage, stdAllowance = 1500, professionalTax = 200) => {
  const basic = monthlyWage * 0.5; // 50% of monthly wage
  const hra = basic * 0.5; // 50% of basic
  const performanceBonus = monthlyWage * 0.0833; // 8.33%
  const lta = monthlyWage * 0.0833; // 8.33%
  const pfEmployee = basic * 0.12; // 12% of basic
  const pfEmployer = basic * 0.12; // 12% of basic
  
  // Fixed allowance = remaining balance
  const totalOtherComponents = basic + hra + stdAllowance + performanceBonus + lta;
  const fixedAllowance = Math.max(0, monthlyWage - totalOtherComponents);
  
  const yearlyWage = monthlyWage * 12;
  
  return {
    basic: parseFloat(basic.toFixed(2)),
    hra: parseFloat(hra.toFixed(2)),
    stdAllowance: parseFloat(stdAllowance.toFixed(2)),
    lta: parseFloat(lta.toFixed(2)),
    performanceBonus: parseFloat(performanceBonus.toFixed(2)),
    fixedAllowance: parseFloat(fixedAllowance.toFixed(2)),
    pfEmployee: parseFloat(pfEmployee.toFixed(2)),
    pfEmployer: parseFloat(pfEmployer.toFixed(2)),
    professionalTax: parseFloat(professionalTax.toFixed(2)),
    yearlyWage: parseFloat(yearlyWage.toFixed(2))
  };
};

// Create or update salary structure (Admin-only)
exports.createOrUpdateSalaryStructure = async (req, res) => {
  try {
    const { 
      employee_id, 
      monthly_wage, 
      std_allowance = 1500,
      professional_tax = 200,
      working_days_per_week = 5,
      break_time_minutes = 60,
      wage_type = 'fixed'
    } = req.body;
    
    // Calculate all components
    const components = calculateSalaryComponents(monthly_wage, std_allowance, professional_tax);
    
    // Check if salary structure exists
    const [existing] = await db.query(
      'SELECT id FROM salary_structure WHERE employee_id = ?',
      [employee_id]
    );
    
    if (existing.length > 0) {
      // Update existing structure
      await db.query(
        `UPDATE salary_structure SET 
         monthly_wage = ?, basic = ?, hra = ?, std_allowance = ?, 
         lta = ?, performance_bonus = ?, fixed_allowance = ?,
         pf_employee = ?, pf_employer = ?, professional_tax = ?,
         working_days_per_week = ?, break_time_minutes = ?, wage_type = ?,
         yearly_wage = ?, updated_by = ?, updated_at = NOW()
         WHERE employee_id = ?`,
        [
          monthly_wage, components.basic, components.hra, components.stdAllowance,
          components.lta, components.performanceBonus, components.fixedAllowance,
          components.pfEmployee, components.pfEmployer, components.professionalTax,
          working_days_per_week, break_time_minutes, wage_type,
          components.yearlyWage, req.user.id, employee_id
        ]
      );
    } else {
      // Insert new structure
      await db.query(
        `INSERT INTO salary_structure 
         (employee_id, monthly_wage, basic, hra, std_allowance, lta, 
          performance_bonus, fixed_allowance, pf_employee, pf_employer, 
          professional_tax, working_days_per_week, break_time_minutes, 
          wage_type, yearly_wage, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          employee_id, monthly_wage, components.basic, components.hra, 
          components.stdAllowance, components.lta, components.performanceBonus,
          components.fixedAllowance, components.pfEmployee, components.pfEmployer,
          components.professionalTax, working_days_per_week, break_time_minutes,
          wage_type, components.yearlyWage, req.user.id
        ]
      );
    }
    
    res.json({
      message: 'Salary structure saved successfully',
      components: {
        monthly_wage,
        yearly_wage: components.yearlyWage,
        ...components
      }
    });
  } catch (error) {
    console.error('Error saving salary structure:', error);
    res.status(500).json({ error: 'Failed to save salary structure' });
  }
};

// Create salary revision (Admin-only, never overwrites)
exports.createSalaryRevision = async (req, res) => {
  try {
    const { employee_id, monthly_wage, reason, effective_from_date, notes } = req.body;
    
    // Insert revision record
    await db.query(
      `INSERT INTO salary_revision 
       (employee_id, monthly_wage, reason, effective_from_date, approved_by, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [employee_id, monthly_wage, reason, effective_from_date, req.user.id, notes]
    );
    
    // Update salary structure with new wage
    const components = calculateSalaryComponents(monthly_wage);
    await db.query(
      `UPDATE salary_structure SET 
       monthly_wage = ?, basic = ?, hra = ?, lta = ?, 
       performance_bonus = ?, fixed_allowance = ?,
       pf_employee = ?, pf_employer = ?, yearly_wage = ?,
       updated_by = ?, updated_at = NOW()
       WHERE employee_id = ?`,
      [
        monthly_wage, components.basic, components.hra, components.lta,
        components.performanceBonus, components.fixedAllowance,
        components.pfEmployee, components.pfEmployer, components.yearlyWage,
        req.user.id, employee_id
      ]
    );
    
    res.json({ message: 'Salary revision created successfully' });
  } catch (error) {
    console.error('Error creating salary revision:', error);
    res.status(500).json({ error: 'Failed to create salary revision' });
  }
};

// Get salary structure by employee (Admin-only)
exports.getSalaryStructure = async (req, res) => {
  try {
    const { employee_id } = req.params;
    
    const [rows] = await db.query(
      `SELECT ss.*, 
       CONCAT(e.first_name, ' ', e.last_name) as employee_name,
       CONCAT(u.first_name, ' ', u.last_name) as updated_by_name
       FROM salary_structure ss
       JOIN employees e ON ss.employee_id = e.id
       LEFT JOIN users u ON ss.updated_by = u.id
       WHERE ss.employee_id = ?`,
      [employee_id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Salary structure not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching salary structure:', error);
    res.status(500).json({ error: 'Failed to fetch salary structure' });
  }
};

// Get all salary structures (Admin-only)
exports.getAllSalaryStructures = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ss.*, 
       CONCAT(e.first_name, ' ', e.last_name) as employee_name,
       u.login_id as employee_login_id,
       e.job_position,
       e.department
       FROM salary_structure ss
       JOIN employees e ON ss.employee_id = e.id
       JOIN users u ON e.user_id = u.id
       ORDER BY e.first_name`
    );
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching salary structures:', error);
    res.status(500).json({ error: 'Failed to fetch salary structures' });
  }
};

// Get salary revision history (Admin-only)
exports.getSalaryRevisionHistory = async (req, res) => {
  try {
    const { employee_id } = req.params;
    
    const [rows] = await db.query(
      `SELECT sr.*,
       CONCAT(e.first_name, ' ', e.last_name) as employee_name,
       CONCAT(u.first_name, ' ', u.last_name) as approved_by_name
       FROM salary_revision sr
       JOIN employees e ON sr.employee_id = e.id
       LEFT JOIN users u ON sr.approved_by = u.id
       WHERE sr.employee_id = ?
       ORDER BY sr.effective_from_date DESC`,
      [employee_id]
    );
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching revision history:', error);
    res.status(500).json({ error: 'Failed to fetch revision history' });
  }
};

// Get effective salary for a specific month (used by payroll)
exports.getEffectiveSalary = async (month, year, employeeId) => {
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
      'SELECT monthly_wage FROM salary_structure WHERE employee_id = ?',
      [employeeId]
    );
    
    return structure.length > 0 ? structure[0].monthly_wage : null;
  } catch (error) {
    console.error('Error getting effective salary:', error);
    return null;
  }
};

// Delete salary structure (Admin-only, use with caution)
exports.deleteSalaryStructure = async (req, res) => {
  try {
    const { employee_id } = req.params;
    
    await db.query('DELETE FROM salary_structure WHERE employee_id = ?', [employee_id]);
    
    res.json({ message: 'Salary structure deleted successfully' });
  } catch (error) {
    console.error('Error deleting salary structure:', error);
    res.status(500).json({ error: 'Failed to delete salary structure' });
  }
};

module.exports = exports;
