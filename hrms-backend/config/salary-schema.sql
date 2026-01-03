-- Salary Structure Table (Admin-only, auto-calculated components)
CREATE TABLE IF NOT EXISTS salary_structure (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  monthly_wage DECIMAL(10, 2) NOT NULL,
  basic DECIMAL(10, 2) NOT NULL,
  hra DECIMAL(10, 2) NOT NULL,
  std_allowance DECIMAL(10, 2) DEFAULT 1500.00,
  lta DECIMAL(10, 2) NOT NULL,
  performance_bonus DECIMAL(10, 2) NOT NULL,
  fixed_allowance DECIMAL(10, 2) NOT NULL,
  pf_employee DECIMAL(10, 2) NOT NULL,
  pf_employer DECIMAL(10, 2) NOT NULL,
  professional_tax DECIMAL(10, 2) DEFAULT 200.00,
  working_days_per_week INT DEFAULT 5,
  break_time_minutes INT DEFAULT 60,
  wage_type ENUM('fixed', 'hourly') DEFAULT 'fixed',
  yearly_wage DECIMAL(12, 2) NOT NULL,
  updated_by INT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (updated_by) REFERENCES users(id),
  UNIQUE KEY unique_employee_salary (employee_id)
);

-- Salary Revision Table (History tracking, never overwrite)
CREATE TABLE IF NOT EXISTS salary_revision (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  monthly_wage DECIMAL(10, 2) NOT NULL,
  reason ENUM('onboarding', 'promotion', 'increment', 'appraisal', 'role_change') NOT NULL,
  effective_from_date DATE NOT NULL,
  approved_by INT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id),
  INDEX idx_employee_effective (employee_id, effective_from_date)
);

-- Payroll Summary Table (Employee read-only view)
CREATE TABLE IF NOT EXISTS payroll_summary (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  month INT NOT NULL,
  year INT NOT NULL,
  present_days DECIMAL(4, 1) DEFAULT 0,
  leave_days DECIMAL(4, 1) DEFAULT 0,
  unpaid_days DECIMAL(4, 1) DEFAULT 0,
  payable_days DECIMAL(4, 1) DEFAULT 0,
  total_days INT NOT NULL,
  gross_salary DECIMAL(10, 2) NOT NULL,
  total_deductions DECIMAL(10, 2) NOT NULL,
  net_salary DECIMAL(10, 2) NOT NULL,
  basic_salary DECIMAL(10, 2) NOT NULL,
  hra DECIMAL(10, 2) NOT NULL,
  std_allowance DECIMAL(10, 2) DEFAULT 0,
  lta DECIMAL(10, 2) NOT NULL,
  performance_bonus DECIMAL(10, 2) NOT NULL,
  fixed_allowance DECIMAL(10, 2) NOT NULL,
  pf_employee DECIMAL(10, 2) NOT NULL,
  pf_employer DECIMAL(10, 2) NOT NULL,
  professional_tax DECIMAL(10, 2) DEFAULT 0,
  generated_from_attendance BOOLEAN DEFAULT TRUE,
  status ENUM('pending', 'approved', 'paid') DEFAULT 'pending',
  approved_by INT,
  approved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id),
  UNIQUE KEY unique_employee_month (employee_id, month, year)
);

-- Drop old salary_info table if exists (we'll use salary_structure instead)
-- DROP TABLE IF EXISTS salary_info;

-- Drop old payroll table if exists (we'll use payroll_summary instead)
-- DROP TABLE IF EXISTS payroll;
