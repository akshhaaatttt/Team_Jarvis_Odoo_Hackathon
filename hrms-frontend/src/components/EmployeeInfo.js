import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from './Header';
import { employeeService, salaryService, authService } from '../services';

const EmployeeInfo = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'admin' || user?.role === 'hr';

  useEffect(() => {
    loadEmployee();
  }, [id]);

  const loadEmployee = async () => {
    try {
      const data = await employeeService.getEmployeeById(id);
      setEmployee(data);
    } catch (error) {
      console.error('Failed to load employee:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!employee) {
    return <div>Employee not found</div>;
  }

  return (
    <>
      <Header />
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-left">
              <div className="info-item">
                <label>Name</label>
                <div className="value">{employee.first_name} {employee.last_name}</div>
              </div>
              <div className="info-item">
                <label>Job Position</label>
                <div className="value">{employee.job_position || 'N/A'}</div>
              </div>
              <div className="info-item">
                <label>Email</label>
                <div className="value">{employee.email || 'N/A'}</div>
              </div>
              <div className="info-item">
                <label>Mobile</label>
                <div className="value">{employee.mobile || 'N/A'}</div>
              </div>
            </div>

            <div className="profile-right">
              <div className="info-item">
                <label>Company</label>
                <div className="value">{employee.company || 'N/A'}</div>
              </div>
              <div className="info-item">
                <label>Department</label>
                <div className="value">{employee.department || 'N/A'}</div>
              </div>
              <div className="info-item">
                <label>Manager</label>
                <div className="value">{employee.manager || 'N/A'}</div>
              </div>
              <div className="info-item">
                <label>Location</label>
                <div className="value">{employee.location || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'personal' ? 'active' : ''}`}
              onClick={() => setActiveTab('personal')}
            >
              Personal Info
            </button>
            {isAdmin && (
              <button 
                className={`tab ${activeTab === 'salary' ? 'active' : ''}`}
                onClick={() => setActiveTab('salary')}
              >
                Salary Info
              </button>
            )}
          </div>

          {activeTab === 'personal' && (
            <div className="tab-content">
              <div>
                <div className="info-item">
                  <label>Date of Birth</label>
                  <div className="value">{employee.date_of_birth || 'N/A'}</div>
                </div>
                <div className="info-item">
                  <label>Address</label>
                  <div className="value">{employee.address || 'N/A'}</div>
                </div>
                <div className="info-item">
                  <label>Nationality</label>
                  <div className="value">{employee.nationality || 'N/A'}</div>
                </div>
                <div className="info-item">
                  <label>Personal Email</label>
                  <div className="value">{employee.personal_email || 'N/A'}</div>
                </div>
                <div className="info-item">
                  <label>Gender</label>
                  <div className="value">{employee.gender || 'N/A'}</div>
                </div>
                <div className="info-item">
                  <label>Marital Status</label>
                  <div className="value">{employee.marital_status || 'N/A'}</div>
                </div>
                <div className="info-item">
                  <label>Date of Joining</label>
                  <div className="value">{employee.date_of_joining || 'N/A'}</div>
                </div>
              </div>

              <div>
                <h3 style={{marginBottom: '1rem', color: '#1f2937'}}>Bank Details</h3>
                <div className="info-item">
                  <label>Account Number</label>
                  <div className="value">{employee.account_number || 'N/A'}</div>
                </div>
                <div className="info-item">
                  <label>Bank Name</label>
                  <div className="value">{employee.bank_name || 'N/A'}</div>
                </div>
                <div className="info-item">
                  <label>IFSC Code</label>
                  <div className="value">{employee.ifsc_code || 'N/A'}</div>
                </div>
                <div className="info-item">
                  <label>PAN</label>
                  <div className="value">{employee.pan_number || 'N/A'}</div>
                </div>
                <div className="info-item">
                  <label>UAN</label>
                  <div className="value">{employee.uan_number || 'N/A'}</div>
                </div>
                <div className="info-item">
                  <label>ESI</label>
                  <div className="value">{employee.esi_number || 'N/A'}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'salary' && isAdmin && employee.salary_info && (
            <div className="tab-content">
              <div>
                <h3 style={{marginBottom: '1rem', color: '#1f2937'}}>Wage Details</h3>
                <div className="info-item">
                  <label>Wage Type</label>
                  <div className="value">{employee.salary_info.wage_type}</div>
                </div>
                <div className="info-item">
                  <label>Monthly Wage</label>
                  <div className="value">₹{employee.salary_info.monthly_wage?.toLocaleString()}</div>
                </div>
                <div className="info-item">
                  <label>Yearly Wage</label>
                  <div className="value">₹{employee.salary_info.yearly_wage?.toLocaleString()}</div>
                </div>

                <h3 style={{marginTop: '2rem', marginBottom: '1rem', color: '#1f2937'}}>Components</h3>
                <div className="info-item">
                  <label>Basic (50%)</label>
                  <div className="value">₹{employee.salary_info.basic?.toLocaleString()}</div>
                </div>
                <div className="info-item">
                  <label>HRA (50% of Basic)</label>
                  <div className="value">₹{employee.salary_info.hra?.toLocaleString()}</div>
                </div>
                <div className="info-item">
                  <label>Standard Allowance</label>
                  <div className="value">₹{employee.salary_info.standard_allowance?.toLocaleString()}</div>
                </div>
                <div className="info-item">
                  <label>Performance Bonus (8.33%)</label>
                  <div className="value">₹{employee.salary_info.performance_bonus?.toLocaleString()}</div>
                </div>
                <div className="info-item">
                  <label>LTA (8.33%)</label>
                  <div className="value">₹{employee.salary_info.lta?.toLocaleString()}</div>
                </div>
                <div className="info-item">
                  <label>Fixed Allowance</label>
                  <div className="value">₹{employee.salary_info.fixed_allowance?.toLocaleString()}</div>
                </div>
              </div>

              <div>
                <h3 style={{marginBottom: '1rem', color: '#1f2937'}}>Deductions</h3>
                <div className="info-item">
                  <label>Employee PF (12% of Basic)</label>
                  <div className="value">₹{employee.salary_info.employee_pf?.toLocaleString()}</div>
                </div>
                <div className="info-item">
                  <label>Employer PF (12% of Basic)</label>
                  <div className="value">₹{employee.salary_info.employer_pf?.toLocaleString()}</div>
                </div>
                <div className="info-item">
                  <label>Professional Tax</label>
                  <div className="value">₹{employee.salary_info.professional_tax?.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EmployeeInfo;
