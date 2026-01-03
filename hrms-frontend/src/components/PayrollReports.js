import React, { useState, useEffect } from 'react';
import Header from './Header';
import { payrollService, authService } from '../services';

const PayrollReports = () => {
  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'admin' || user?.role === 'hr';

  useEffect(() => {
    if (isAdmin) {
      loadPayrollReports();
    }
  }, [selectedMonth, selectedYear]);

  const loadPayrollReports = async () => {
    try {
      setLoading(true);
      const data = await payrollService.getPayrollReports(selectedMonth, selectedYear);
      setPayrollData(data);
    } catch (error) {
      console.error('Failed to load payroll reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayroll = async () => {
    if (!window.confirm(`Generate payroll for ${getMonthName(selectedMonth)} ${selectedYear}?`)) {
      return;
    }

    try {
      setGenerating(true);
      await payrollService.generatePayroll(selectedMonth, selectedYear);
      setMessage('Payroll generated successfully');
      setTimeout(() => setMessage(''), 3000);
      loadPayrollReports();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to generate payroll');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setGenerating(false);
    }
  };

  const handleApprovePayroll = async (id) => {
    try {
      await payrollService.approvePayroll(id);
      setMessage('Payroll approved successfully');
      setTimeout(() => setMessage(''), 3000);
      loadPayrollReports();
    } catch (error) {
      setMessage('Failed to approve payroll');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const getMonthName = (month) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
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
          <p>You don't have permission to view this page.</p>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="attendance-container">
          <p>Loading payroll data...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="attendance-container">
        <div className="dashboard-header">
          <h1>Payroll Reports</h1>
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

        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div className="form-group" style={{margin: 0}}>
            <label>Month</label>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>{getMonthName(month)}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{margin: 0}}>
            <label>Year</label>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {Array.from({length: 5}, (_, i) => currentDate.getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <button 
            className="btn btn-primary"
            onClick={handleGeneratePayroll}
            disabled={generating}
            style={{alignSelf: 'flex-end'}}
          >
            {generating ? 'Generating...' : 'Generate Payroll'}
          </button>
        </div>

        {payrollData.length === 0 ? (
          <div style={{textAlign: 'center', padding: '2rem'}}>
            <p>No payroll data for {getMonthName(selectedMonth)} {selectedYear}</p>
            <p style={{fontSize: '0.9rem', color: '#666'}}>
              Click "Generate Payroll" to create payroll records
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Employee</th>
                  <th>Basic Salary</th>
                  <th>Present Days</th>
                  <th>Leave Days</th>
                  <th>Unpaid Days</th>
                  <th>Gross Salary</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payrollData.map((payroll) => (
                  <tr key={payroll.id}>
                    <td>{payroll.employee_login_id}</td>
                    <td>{payroll.employee_name}</td>
                    <td>{formatCurrency(payroll.basic_salary)}</td>
                    <td>{payroll.present_days}</td>
                    <td>{payroll.paid_leave_days}</td>
                    <td>{payroll.unpaid_leave_days}</td>
                    <td>{formatCurrency(payroll.gross_salary)}</td>
                    <td>{formatCurrency(payroll.total_deductions)}</td>
                    <td>{formatCurrency(payroll.net_salary)}</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: payroll.status === 'approved' ? '#d1fae5' : '#fef3c7',
                        color: payroll.status === 'approved' ? '#065f46' : '#92400e'
                      }}>
                        {payroll.status}
                      </span>
                    </td>
                    <td>
                      {payroll.status === 'pending' && (
                        <button 
                          className="btn btn-success"
                          style={{padding: '0.4rem 0.8rem'}}
                          onClick={() => handleApprovePayroll(payroll.id)}
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{fontWeight: 'bold', background: '#f3f4f6'}}>
                  <td colSpan="2">Total</td>
                  <td>{formatCurrency(payrollData.reduce((sum, p) => sum + parseFloat(p.basic_salary), 0))}</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <td>{formatCurrency(payrollData.reduce((sum, p) => sum + parseFloat(p.gross_salary), 0))}</td>
                  <td>{formatCurrency(payrollData.reduce((sum, p) => sum + parseFloat(p.total_deductions), 0))}</td>
                  <td>{formatCurrency(payrollData.reduce((sum, p) => sum + parseFloat(p.net_salary), 0))}</td>
                  <td colSpan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default PayrollReports;
