import React, { useState, useEffect } from 'react';
import Header from './Header';
import { salaryStructureService, employeeService, authService } from '../services';

const SalaryStructure = () => {
  const [employees, setEmployees] = useState([]);
  const [salaryStructures, setSalaryStructures] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('structures');
  
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'admin' || user?.role === 'hr';

  const [formData, setFormData] = useState({
    employee_id: '',
    monthly_wage: '',
    std_allowance: 1500,
    professional_tax: 200,
    working_days_per_week: 5,
    break_time_minutes: 60,
    wage_type: 'fixed'
  });

  const [revisionData, setRevisionData] = useState({
    employee_id: '',
    monthly_wage: '',
    reason: 'onboarding',
    effective_from_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [empData, salData] = await Promise.all([
        employeeService.getAllEmployees(),
        salaryStructureService.getAllSalaryStructures()
      ]);
      console.log('Loaded employees:', empData);
      console.log('Loaded salary structures:', salData);
      setEmployees(empData);
      setSalaryStructures(salData);
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage('Failed to load data: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const calculateComponents = (monthlyWage) => {
    const basic = monthlyWage * 0.5;
    const hra = basic * 0.5;
    const performanceBonus = monthlyWage * 0.0833;
    const lta = monthlyWage * 0.0833;
    const stdAllowance = parseFloat(formData.std_allowance) || 1500;
    const pfEmployee = basic * 0.12;
    const fixedAllowance = Math.max(0, monthlyWage - (basic + hra + stdAllowance + performanceBonus + lta));
    
    return {
      basic: basic.toFixed(2),
      hra: hra.toFixed(2),
      lta: lta.toFixed(2),
      performanceBonus: performanceBonus.toFixed(2),
      pfEmployee: pfEmployee.toFixed(2),
      fixedAllowance: fixedAllowance.toFixed(2),
      yearlyWage: (monthlyWage * 12).toFixed(2)
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await salaryStructureService.createOrUpdateSalary(formData);
      setMessage('Salary structure saved successfully');
      setTimeout(() => setMessage(''), 3000);
      setShowModal(false);
      setFormData({
        employee_id: '',
        monthly_wage: '',
        std_allowance: 1500,
        professional_tax: 200,
        working_days_per_week: 5,
        break_time_minutes: 60,
        wage_type: 'fixed'
      });
      loadData();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to save salary structure');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleRevisionSubmit = async (e) => {
    e.preventDefault();
    try {
      await salaryStructureService.createRevision(revisionData);
      setMessage('Salary revision created successfully');
      setTimeout(() => setMessage(''), 3000);
      setShowRevisionModal(false);
      setRevisionData({
        employee_id: '',
        monthly_wage: '',
        reason: 'onboarding',
        effective_from_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      loadData();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to create revision');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleViewRevisions = async (employeeId) => {
    try {
      const data = await salaryStructureService.getRevisionHistory(employeeId);
      setRevisions(data);
      setSelectedEmployee(employeeId);
      setActiveTab('revisions');
    } catch (error) {
      console.error('Error loading revisions:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (!isAdmin) {
    return (
      <>
        <Header />
        <div className="attendance-container">
          <h1>Access Denied</h1>
          <p>Only Admin/HR can access salary structure.</p>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="attendance-container">
          <p>Loading...</p>
        </div>
      </>
    );
  }

  const components = formData.monthly_wage ? calculateComponents(parseFloat(formData.monthly_wage)) : null;

  return (
    <>
      <Header />
      <div className="attendance-container">
        <div className="dashboard-header">
          <h1>Salary Structure Management</h1>
          <div style={{display: 'flex', gap: '0.5rem'}}>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              Create/Update Salary
            </button>
            <button className="btn btn-success" onClick={() => setShowRevisionModal(true)}>
              Create Revision
            </button>
          </div>
        </div>

        {message && (
          <div style={{
            padding: '1rem',
            marginBottom: '1rem',
            background: message.includes('successfully') ? '#d1fae5' : '#fee2e2',
            color: message.includes('successfully') ? '#065f46' : '#991b1b',
            borderRadius: '8px'
          }}>
            {message}
          </div>
        )}

        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'structures' ? 'active' : ''}`}
            onClick={() => setActiveTab('structures')}
          >
            Salary Structures
          </button>
          <button 
            className={`tab ${activeTab === 'revisions' ? 'active' : ''}`}
            onClick={() => setActiveTab('revisions')}
          >
            Revision History
          </button>
        </div>

        {activeTab === 'structures' && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Employee</th>
                  <th>Position</th>
                  <th>Department</th>
                  <th>Monthly Wage</th>
                  <th>Yearly Wage</th>
                  <th>Basic</th>
                  <th>HRA</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {salaryStructures.map((salary) => (
                  <tr key={salary.id}>
                    <td>{salary.employee_login_id}</td>
                    <td>{salary.employee_name}</td>
                    <td>{salary.job_position || '-'}</td>
                    <td>{salary.department || '-'}</td>
                    <td>{formatCurrency(salary.monthly_wage)}</td>
                    <td>{formatCurrency(salary.yearly_wage)}</td>
                    <td>{formatCurrency(salary.basic)}</td>
                    <td>{formatCurrency(salary.hra)}</td>
                    <td>
                      <button 
                        className="btn btn-secondary"
                        style={{padding: '0.4rem 0.8rem', marginRight: '0.5rem'}}
                        onClick={() => handleViewRevisions(salary.employee_id)}
                      >
                        Revisions
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'revisions' && (
          <div className="table-container">
            <h3>Revision History {selectedEmployee && `(Employee ${selectedEmployee})`}</h3>
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Monthly Wage</th>
                  <th>Reason</th>
                  <th>Effective From</th>
                  <th>Approved By</th>
                  <th>Notes</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {revisions.map((revision) => (
                  <tr key={revision.id}>
                    <td>{revision.employee_name}</td>
                    <td>{formatCurrency(revision.monthly_wage)}</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: '#dbeafe',
                        color: '#1e40af',
                        textTransform: 'capitalize'
                      }}>
                        {revision.reason}
                      </span>
                    </td>
                    <td>{revision.effective_from_date}</td>
                    <td>{revision.approved_by_name}</td>
                    <td>{revision.notes || '-'}</td>
                    <td>{new Date(revision.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create/Update Salary Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '800px'}}>
              <h2>Create/Update Salary Structure</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Employee *</label>
                  <select
                    value={formData.employee_id}
                    onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} ({emp.job_position || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Monthly Wage *</label>
                  <input
                    type="number"
                    value={formData.monthly_wage}
                    onChange={(e) => setFormData({...formData, monthly_wage: e.target.value})}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                  <div className="form-group">
                    <label>Standard Allowance</label>
                    <input
                      type="number"
                      value={formData.std_allowance}
                      onChange={(e) => setFormData({...formData, std_allowance: e.target.value})}
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="form-group">
                    <label>Professional Tax</label>
                    <input
                      type="number"
                      value={formData.professional_tax}
                      onChange={(e) => setFormData({...formData, professional_tax: e.target.value})}
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="form-group">
                    <label>Working Days/Week</label>
                    <input
                      type="number"
                      value={formData.working_days_per_week}
                      onChange={(e) => setFormData({...formData, working_days_per_week: e.target.value})}
                      min="1"
                      max="7"
                    />
                  </div>

                  <div className="form-group">
                    <label>Break Time (minutes)</label>
                    <input
                      type="number"
                      value={formData.break_time_minutes}
                      onChange={(e) => setFormData({...formData, break_time_minutes: e.target.value})}
                      min="0"
                    />
                  </div>
                </div>

                {components && (
                  <div style={{
                    background: '#f9fafb',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginTop: '1rem'
                  }}>
                    <h3 style={{marginTop: 0}}>Auto-Calculated Components</h3>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', fontSize: '0.9rem'}}>
                      <div><strong>Basic (50%):</strong> {formatCurrency(components.basic)}</div>
                      <div><strong>HRA (50% of Basic):</strong> {formatCurrency(components.hra)}</div>
                      <div><strong>LTA (8.33%):</strong> {formatCurrency(components.lta)}</div>
                      <div><strong>Performance Bonus (8.33%):</strong> {formatCurrency(components.performanceBonus)}</div>
                      <div><strong>PF Employee (12%):</strong> {formatCurrency(components.pfEmployee)}</div>
                      <div><strong>Fixed Allowance:</strong> {formatCurrency(components.fixedAllowance)}</div>
                      <div><strong>Yearly Wage:</strong> {formatCurrency(components.yearlyWage)}</div>
                    </div>
                  </div>
                )}

                <div className="modal-actions">
                  <button type="submit" className="btn btn-primary">
                    Save Structure
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Salary Revision Modal */}
        {showRevisionModal && (
          <div className="modal-overlay" onClick={() => setShowRevisionModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Create Salary Revision</h2>
              
              <form onSubmit={handleRevisionSubmit}>
                <div className="form-group">
                  <label>Employee *</label>
                  <select
                    value={revisionData.employee_id}
                    onChange={(e) => setRevisionData({...revisionData, employee_id: e.target.value})}
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>New Monthly Wage *</label>
                  <input
                    type="number"
                    value={revisionData.monthly_wage}
                    onChange={(e) => setRevisionData({...revisionData, monthly_wage: e.target.value})}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Reason *</label>
                  <select
                    value={revisionData.reason}
                    onChange={(e) => setRevisionData({...revisionData, reason: e.target.value})}
                    required
                  >
                    <option value="onboarding">Onboarding</option>
                    <option value="promotion">Promotion</option>
                    <option value="increment">Increment</option>
                    <option value="appraisal">Appraisal</option>
                    <option value="role_change">Role Change</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Effective From Date *</label>
                  <input
                    type="date"
                    value={revisionData.effective_from_date}
                    onChange={(e) => setRevisionData({...revisionData, effective_from_date: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={revisionData.notes}
                    onChange={(e) => setRevisionData({...revisionData, notes: e.target.value})}
                    rows="3"
                  />
                </div>

                <div className="modal-actions">
                  <button type="submit" className="btn btn-success">
                    Create Revision
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowRevisionModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SalaryStructure;
