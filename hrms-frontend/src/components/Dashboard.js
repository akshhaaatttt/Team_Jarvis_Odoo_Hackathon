import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { employeeService, authService } from '../services';

const Dashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'admin' || user?.role === 'hr';

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await employeeService.getAllEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleCardClick = (employeeId) => {
    // Only admins can view full employee details
    if (isAdmin) {
      navigate(`/employee/${employeeId}`);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Header />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Employees</h1>
        </div>

        <div className="employee-grid">
          {employees.map(employee => (
            <div 
              key={employee.id} 
              className="employee-card"
              onClick={() => handleCardClick(employee.id)}
              style={{cursor: isAdmin ? 'pointer' : 'default'}}
            >
              <div className="status-badge">{employee.statusIcon}</div>
              
              <div className="employee-avatar">
                {getInitials(employee.name)}
              </div>
              
              <h3>{employee.name}</h3>
              <div className="position">{employee.job_position || 'Employee'}</div>
              <div className="department">{employee.department || 'General'}</div>
              {isAdmin && (
                <div style={{fontSize: '0.85rem', color: '#666', marginTop: '0.5rem'}}>
                  {employee.login_id || `ID: ${employee.id}`}
                </div>
              )}
              {!isAdmin && (
                <div style={{fontSize: '0.85rem', color: '#666', marginTop: '0.5rem'}}>
                  {employee.status === 'present' && employee.check_in 
                    ? `Checked in at ${new Date(employee.check_in).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'})}` 
                    : employee.status === 'leave' 
                    ? 'On Leave' 
                    : 'Not Checked In'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
