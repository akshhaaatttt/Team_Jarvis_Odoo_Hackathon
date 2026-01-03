-- Create signup_requests table for employee self-registration
CREATE TABLE IF NOT EXISTS signup_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  gender ENUM('male', 'female', 'other'),
  mobile VARCHAR(20),
  personal_email VARCHAR(255) NOT NULL UNIQUE,
  address TEXT,
  nationality VARCHAR(100),
  marital_status ENUM('single', 'married', 'divorced', 'widowed'),
  job_position VARCHAR(100),
  department VARCHAR(100),
  location VARCHAR(255),
  education TEXT,
  experience_years INT DEFAULT 0,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by INT,
  reviewed_at TIMESTAMP NULL,
  rejection_reason TEXT,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);
