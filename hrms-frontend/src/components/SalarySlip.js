import React, { useState, useEffect } from 'react';
import Header from './Header';
import { payrollService } from '../services';

const SalarySlip = () => {
  const [salarySlip, setSalarySlip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  useEffect(() => {
    loadSalarySlip();
  }, [selectedMonth, selectedYear]);

  const loadSalarySlip = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await payrollService.getSalarySlip(selectedMonth, selectedYear);
      setSalarySlip(data);
    } catch (error) {
      setError(error.response?.data?.error || 'No salary slip found for this period');
      setSalarySlip(null);
    } finally {
      setLoading(false);
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
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="attendance-container">
          <p>Loading salary slip...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="attendance-container">
        <div className="dashboard-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h1>Salary Slip</h1>
          {salarySlip && (
            <button className="btn btn-primary no-print" onClick={handlePrint}>
              Print Slip
            </button>
          )}
        </div>

        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          alignItems: 'center',
          flexWrap: 'wrap'
        }} className="no-print">
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
        </div>

        {error && (
          <div style={{
            padding: '1rem',
            background: '#fee2e2',
            color: '#991b1b',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {salarySlip && (
          <div className="salary-slip-container" style={{
            maxWidth: '800px',
            margin: '0 auto',
            background: '#fff',
            padding: '2rem',
            border: '1px solid #ddd',
            borderRadius: '8px'
          }}>
            {/* Header */}
            <div style={{
              textAlign: 'center',
              borderBottom: '2px solid #333',
              paddingBottom: '1rem',
              marginBottom: '2rem'
            }}>
              <h2 style={{margin: '0 0 0.5rem 0'}}>OIJODO Solutions</h2>
              <p style={{margin: 0, fontSize: '0.9rem', color: '#666'}}>
                Salary Slip for {getMonthName(selectedMonth)} {selectedYear}
              </p>
            </div>

            {/* Employee Details */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div>
                <p style={{margin: '0.5rem 0'}}><strong>Employee Name:</strong> {salarySlip.employee_name}</p>
                <p style={{margin: '0.5rem 0'}}><strong>Employee ID:</strong> {salarySlip.employee_id}</p>
                <p style={{margin: '0.5rem 0'}}><strong>Designation:</strong> {salarySlip.designation || 'N/A'}</p>
              </div>
              <div>
                <p style={{margin: '0.5rem 0'}}><strong>Department:</strong> {salarySlip.department || 'N/A'}</p>
                <p style={{margin: '0.5rem 0'}}><strong>Pay Period:</strong> {getMonthName(selectedMonth)} {selectedYear}</p>
                <p style={{margin: '0.5rem 0'}}><strong>Generated On:</strong> {new Date(salarySlip.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Attendance Summary */}
            <div style={{
              background: '#f9fafb',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '2rem'
            }}>
              <h3 style={{margin: '0 0 1rem 0', fontSize: '1.1rem'}}>Attendance Summary</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1rem'
              }}>
                <div>
                  <p style={{margin: '0.3rem 0', fontSize: '0.9rem', color: '#666'}}>Total Days</p>
                  <p style={{margin: 0, fontSize: '1.2rem', fontWeight: 'bold'}}>{salarySlip.total_days}</p>
                </div>
                <div>
                  <p style={{margin: '0.3rem 0', fontSize: '0.9rem', color: '#666'}}>Present Days</p>
                  <p style={{margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: '#059669'}}>{salarySlip.present_days}</p>
                </div>
                <div>
                  <p style={{margin: '0.3rem 0', fontSize: '0.9rem', color: '#666'}}>Paid Leave</p>
                  <p style={{margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: '#0891b2'}}>{salarySlip.paid_leave_days}</p>
                </div>
                <div>
                  <p style={{margin: '0.3rem 0', fontSize: '0.9rem', color: '#666'}}>Unpaid Leave</p>
                  <p style={{margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: '#dc2626'}}>{salarySlip.unpaid_leave_days}</p>
                </div>
              </div>
            </div>

            {/* Earnings and Deductions */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '2rem',
              marginBottom: '2rem'
            }}>
              {/* Earnings */}
              <div>
                <h3 style={{margin: '0 0 1rem 0', fontSize: '1.1rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem'}}>
                  Earnings
                </h3>
                <div style={{display: 'flex', justifyContent: 'space-between', margin: '0.5rem 0'}}>
                  <span>Basic Salary</span>
                  <span>{formatCurrency(salarySlip.basic_salary)}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', margin: '0.5rem 0'}}>
                  <span>HRA</span>
                  <span>{formatCurrency(salarySlip.hra)}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', margin: '0.5rem 0'}}>
                  <span>Conveyance Allowance</span>
                  <span>{formatCurrency(salarySlip.conveyance_allowance)}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', margin: '0.5rem 0'}}>
                  <span>Medical Allowance</span>
                  <span>{formatCurrency(salarySlip.medical_allowance)}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', margin: '0.5rem 0'}}>
                  <span>Special Allowance</span>
                  <span>{formatCurrency(salarySlip.special_allowance)}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  margin: '1rem 0 0.5rem 0',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid #ddd',
                  fontWeight: 'bold'
                }}>
                  <span>Gross Salary</span>
                  <span>{formatCurrency(salarySlip.gross_salary)}</span>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h3 style={{margin: '0 0 1rem 0', fontSize: '1.1rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem'}}>
                  Deductions
                </h3>
                <div style={{display: 'flex', justifyContent: 'space-between', margin: '0.5rem 0'}}>
                  <span>Provident Fund (PF)</span>
                  <span>{formatCurrency(salarySlip.pf_deduction)}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', margin: '0.5rem 0'}}>
                  <span>Professional Tax</span>
                  <span>{formatCurrency(salarySlip.professional_tax)}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', margin: '0.5rem 0'}}>
                  <span>Income Tax (TDS)</span>
                  <span>{formatCurrency(salarySlip.tds)}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', margin: '0.5rem 0'}}>
                  <span>Other Deductions</span>
                  <span>{formatCurrency(salarySlip.other_deductions)}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  margin: '1rem 0 0.5rem 0',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid #ddd',
                  fontWeight: 'bold'
                }}>
                  <span>Total Deductions</span>
                  <span>{formatCurrency(salarySlip.total_deductions)}</span>
                </div>
              </div>
            </div>

            {/* Net Salary */}
            <div style={{
              background: '#059669',
              color: '#fff',
              padding: '1.5rem',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{margin: '0 0 0.5rem 0', fontSize: '1rem'}}>Net Salary</p>
              <p style={{margin: 0, fontSize: '2rem', fontWeight: 'bold'}}>
                {formatCurrency(salarySlip.net_salary)}
              </p>
            </div>

            {/* Status */}
            <div style={{marginTop: '2rem', textAlign: 'center'}}>
              <span style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: salarySlip.status === 'approved' ? '#d1fae5' : '#fef3c7',
                color: salarySlip.status === 'approved' ? '#065f46' : '#92400e',
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}>
                {salarySlip.status.toUpperCase()}
              </span>
            </div>

            {/* Footer */}
            <div style={{
              marginTop: '3rem',
              paddingTop: '1rem',
              borderTop: '1px solid #ddd',
              fontSize: '0.8rem',
              color: '#666',
              textAlign: 'center'
            }}>
              <p style={{margin: 0}}>
                This is a system-generated salary slip and does not require a signature.
              </p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .salary-slip-container {
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default SalarySlip;
