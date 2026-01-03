const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Generate Login ID
const generateLoginId = async (firstName, lastName, yearOfJoining) => {
  const prefix = 'OI';
  const fn = firstName.substring(0, 2).toUpperCase();
  const ln = lastName.substring(0, 2).toUpperCase();
  
  // Get or create serial for the year
  const [serialRow] = await db.query(
    'SELECT last_serial FROM login_serial WHERE year = ?',
    [yearOfJoining]
  );
  
  let serial = 1;
  if (serialRow.length > 0) {
    serial = serialRow[0].last_serial + 1;
  }
  
  // Update serial
  await db.query(
    'INSERT INTO login_serial (year, last_serial) VALUES (?, ?) ON DUPLICATE KEY UPDATE last_serial = ?',
    [yearOfJoining, serial, serial]
  );
  
  const serialStr = serial.toString().padStart(4, '0');
  return `${prefix}${fn}${ln}${yearOfJoining}${serialStr}`;
};

// Generate temporary password
const generateTempPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Login
exports.login = async (req, res) => {
  try {
    const { login_id, password } = req.body;

    const [users] = await db.query(
      'SELECT u.*, e.first_name, e.last_name FROM users u LEFT JOIN employees e ON u.id = e.user_id WHERE u.login_id = ?',
      [login_id]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        login_id: user.login_id, 
        role: user.role,
        first_login: user.first_login 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        login_id: user.login_id,
        role: user.role,
        first_login: user.first_login,
        name: `${user.first_name} ${user.last_name}`
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    const userId = req.user.id;

    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = users[0];

    if (!req.user.first_login) {
      const validPassword = await bcrypt.compare(old_password, user.password);
      if (!validPassword) {
        return res.status(400).json({ error: 'Invalid old password' });
      }
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await db.query(
      'UPDATE users SET password = ?, first_login = FALSE WHERE id = ?',
      [hashedPassword, userId]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create user (Admin/HR only)
exports.createUser = async (req, res) => {
  try {
    const { first_name, last_name, year_of_joining, role, email, mobile, job_position, department, company, location } = req.body;

    // Generate login ID
    const loginId = await generateLoginId(first_name, last_name, year_of_joining);
    
    // Generate temporary password
    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Insert user
    const [userResult] = await db.query(
      'INSERT INTO users (login_id, password, role, first_login, created_by) VALUES (?, ?, ?, TRUE, ?)',
      [loginId, hashedPassword, role, req.user.id]
    );

    const userId = userResult.insertId;

    // Insert employee
    const [employeeResult] = await db.query(
      `INSERT INTO employees (user_id, first_name, last_name, email, mobile, job_position, department, company, location, date_of_joining, year_of_joining) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), ?)`,
      [userId, first_name, last_name, email, mobile, job_position, department, company, location, year_of_joining]
    );

    const employeeId = employeeResult.insertId;

    const monthlyWage = 50000;
    const basic = monthlyWage * 0.5;
    const hra = basic * 0.5;
    const standardAllowance = 1000;
    const performanceBonus = monthlyWage * 0.0833;
    const lta = monthlyWage * 0.0833;
    const fixedAllowance = monthlyWage - (basic + hra + standardAllowance + performanceBonus + lta);
    const employeePf = basic * 0.12;
    const employerPf = basic * 0.12;

    await db.query(
      `INSERT INTO salary_info (employee_id, monthly_wage, yearly_wage, basic, hra, standard_allowance, performance_bonus, lta, fixed_allowance, employee_pf, employer_pf)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [employeeId, monthlyWage, monthlyWage * 12, basic, hra, standardAllowance, performanceBonus, lta, fixedAllowance, employeePf, employerPf]
    );

    // Create salary structure for the new employee
    await db.query(
      `INSERT INTO salary_structure (employee_id, monthly_wage, basic, hra, standard_allowance, performance_bonus, lta, fixed_allowance, employee_pf, employer_pf, created_by, effective_from_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
      [employeeId, monthlyWage, basic, hra, standardAllowance, performanceBonus, lta, fixedAllowance, employeePf, employerPf, req.user.id]
    );

    // Allocate default leaves
    const currentYear = new Date().getFullYear();
    await db.query(
      `INSERT INTO leave_allocation (employee_id, leave_type_id, allocated_days, remaining_days, year)
       VALUES (?, 1, 15, 15, ?), (?, 2, 10, 10, ?), (?, 3, 5, 5, ?)`,
      [employeeId, currentYear, employeeId, currentYear, employeeId, currentYear]
    );

    res.status(201).json({
      message: 'User created successfully',
      credentials: {
        login_id: loginId,
        temporary_password: tempPassword
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
