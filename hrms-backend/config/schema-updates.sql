-- Add document management table
CREATE TABLE IF NOT EXISTS employee_documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  document_type ENUM('salary', 'certificate', 'profile', 'other') NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT,
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  description TEXT,
  uploaded_by INT NULL,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Add half-day support to attendance
ALTER TABLE attendance 
ADD COLUMN is_half_day BOOLEAN DEFAULT FALSE AFTER status,
ADD COLUMN payable_days DECIMAL(3, 2) DEFAULT 1.00 AFTER is_payable;

-- Update payable_days for existing records
UPDATE attendance SET payable_days = 1.00 WHERE is_payable = TRUE;
UPDATE attendance SET payable_days = 0.00 WHERE is_payable = FALSE;

-- Add remarks and comments to leave requests
ALTER TABLE leave_requests
ADD COLUMN remarks TEXT AFTER reason,
ADD COLUMN approval_comment TEXT AFTER rejection_reason;

-- Create payroll table for monthly salary slips
CREATE TABLE IF NOT EXISTS payroll (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  month INT NOT NULL,
  year INT NOT NULL,
  total_working_days INT NOT NULL,
  present_days DECIMAL(5, 2) NOT NULL,
  paid_leave_days DECIMAL(5, 2) DEFAULT 0,
  unpaid_leave_days DECIMAL(5, 2) DEFAULT 0,
  payable_days DECIMAL(5, 2) NOT NULL,
  
  -- Earnings
  basic_salary DECIMAL(10, 2) NOT NULL,
  hra DECIMAL(10, 2) NOT NULL,
  standard_allowance DECIMAL(10, 2) NOT NULL,
  performance_bonus DECIMAL(10, 2) NOT NULL,
  lta DECIMAL(10, 2) NOT NULL,
  fixed_allowance DECIMAL(10, 2) NOT NULL,
  gross_salary DECIMAL(10, 2) NOT NULL,
  
  -- Deductions
  employee_pf DECIMAL(10, 2) NOT NULL,
  professional_tax DECIMAL(10, 2) NOT NULL,
  unpaid_deduction DECIMAL(10, 2) DEFAULT 0,
  total_deductions DECIMAL(10, 2) NOT NULL,
  
  -- Net
  net_salary DECIMAL(10, 2) NOT NULL,
  
  status ENUM('draft', 'approved', 'paid') DEFAULT 'draft',
  generated_by INT,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_by INT,
  approved_at TIMESTAMP NULL,
  
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_payroll (employee_id, month, year)
);

-- Add profile picture field
ALTER TABLE employees
ADD COLUMN profile_picture_path VARCHAR(500) AFTER profile_picture;

-- Create indexes for better performance
CREATE INDEX idx_documents_employee ON employee_documents(employee_id);
CREATE INDEX idx_documents_type ON employee_documents(document_type);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_payroll_period ON payroll(year, month);
