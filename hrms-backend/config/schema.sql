-- Create database
CREATE DATABASE IF NOT EXISTS hrms_db;
USE hrms_db;

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  login_id VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('employee', 'hr', 'admin') NOT NULL DEFAULT 'employee',
  first_login BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Employees table (profile information)
CREATE TABLE IF NOT EXISTS employees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  mobile VARCHAR(20),
  personal_email VARCHAR(255),
  profile_picture VARCHAR(255),
  job_position VARCHAR(100),
  department VARCHAR(100),
  manager VARCHAR(100),
  location VARCHAR(100),
  company VARCHAR(100),
  date_of_birth DATE,
  address TEXT,
  nationality VARCHAR(50),
  gender ENUM('male', 'female', 'other'),
  marital_status ENUM('single', 'married', 'divorced', 'widowed'),
  date_of_joining DATE NOT NULL,
  year_of_joining INT NOT NULL,
  
  -- Bank details
  account_number VARCHAR(50),
  bank_name VARCHAR(100),
  ifsc_code VARCHAR(20),
  pan_number VARCHAR(20),
  uan_number VARCHAR(20),
  esi_number VARCHAR(20),
  
  -- Admin fields
  about TEXT,
  why_love_job TEXT,
  interests TEXT,
  skills TEXT,
  certifications TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Serial number tracking for login ID generation
CREATE TABLE IF NOT EXISTS login_serial (
  year INT PRIMARY KEY,
  last_serial INT DEFAULT 0
);

-- Salary configuration
CREATE TABLE IF NOT EXISTS salary_info (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT UNIQUE NOT NULL,
  wage_type VARCHAR(20) DEFAULT 'fixed',
  monthly_wage DECIMAL(10, 2) NOT NULL DEFAULT 50000.00,
  yearly_wage DECIMAL(12, 2) NOT NULL DEFAULT 600000.00,
  working_days_per_week INT DEFAULT 5,
  break_time_minutes INT DEFAULT 60,
  
  -- Components (auto-calculated)
  basic DECIMAL(10, 2),
  hra DECIMAL(10, 2),
  standard_allowance DECIMAL(10, 2) DEFAULT 1000.00,
  performance_bonus DECIMAL(10, 2),
  lta DECIMAL(10, 2),
  fixed_allowance DECIMAL(10, 2),
  
  -- Deductions
  employee_pf DECIMAL(10, 2),
  employer_pf DECIMAL(10, 2),
  professional_tax DECIMAL(10, 2) DEFAULT 200.00,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  attendance_date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  work_hours DECIMAL(5, 2),
  extra_hours DECIMAL(5, 2),
  break_time_minutes INT DEFAULT 60,
  status ENUM('present', 'absent', 'leave') DEFAULT 'absent',
  is_payable BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY unique_attendance (employee_id, attendance_date)
);

-- Leave types
CREATE TABLE IF NOT EXISTS leave_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  is_paid BOOLEAN DEFAULT TRUE,
  requires_attachment BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave allocation
CREATE TABLE IF NOT EXISTS leave_allocation (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  leave_type_id INT NOT NULL,
  allocated_days INT NOT NULL DEFAULT 0,
  used_days INT DEFAULT 0,
  remaining_days INT DEFAULT 0,
  year INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE CASCADE,
  UNIQUE KEY unique_allocation (employee_id, leave_type_id, year)
);

-- Leave requests
CREATE TABLE IF NOT EXISTS leave_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  leave_type_id INT NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  days INT NOT NULL,
  reason TEXT,
  attachment VARCHAR(255),
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_by INT,
  approved_at TIMESTAMP NULL,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default leave types
INSERT INTO leave_types (name, is_paid, requires_attachment) VALUES
('Paid Time Off', TRUE, FALSE),
('Sick Leave', TRUE, TRUE),
('Unpaid Leave', FALSE, FALSE);

-- Create default admin user (Password: Admin@123)
INSERT INTO users (login_id, password, role, first_login) VALUES
('ADMIN001', '$2b$10$xK8vZ7VJ8xYJ8LJ8xK8vZuJ8xYJ8LJ8xK8vZuJ8xYJ8LJ8xK8vZu', 'admin', FALSE);

INSERT INTO employees (user_id, first_name, last_name, email, job_position, department, company, date_of_joining, year_of_joining) VALUES
(1, 'System', 'Admin', 'admin@company.com', 'System Administrator', 'IT', 'Company', '2022-01-01', 2022);
