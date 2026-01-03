import React, { useState, useEffect } from 'react';
import Header from './Header';
import { attendanceService, authService } from '../services';

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkOutLoading, setCheckOutLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [view, setView] = useState('daily');
  const [weeks, setWeeks] = useState([]);
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'admin' || user?.role === 'hr';

  useEffect(() => {
    loadAttendance();
  }, [view]);

  const loadAttendance = async () => {
    try {
      if (isAdmin) {
        const data = await attendanceService.getAllAttendance();
        setAttendance(data);
      } else {
        const data = await attendanceService.getMyAttendance(null, null, view);
        if (data.view === 'weekly') {
          setWeeks(data.weeks);
          setSummary(data.summary);
        } else {
          setAttendance(data.attendance);
          setSummary(data.summary);
        }
      }
    } catch (error) {
      console.error('Failed to load attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setCheckInLoading(true);
    setMessage('');
    try {
      const result = await attendanceService.checkIn();
      setMessage(`Checked in successfully at ${result.check_in}`);
      loadAttendance();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Check-in failed');
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckOutLoading(true);
    setMessage('');
    try {
      const result = await attendanceService.checkOut();
      setMessage(`Checked out at ${result.check_out}. Work hours: ${result.work_hours}h`);
      loadAttendance();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Check-out failed');
    } finally {
      setCheckOutLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Header />
      <div className="attendance-container">
        <div className="dashboard-header">
          <h1>Attendance</h1>
        </div>

        {!isAdmin && (
          <>
            <div style={{display: 'flex', gap: '1rem', marginBottom: '1rem'}}>
              <button 
                className={`btn ${view === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setView('daily')}
              >
                Daily View
              </button>
              <button 
                className={`btn ${view === 'weekly' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setView('weekly')}
              >
                Weekly View
              </button>
            </div>

            <div className="attendance-actions">
              <button 
                className="btn btn-success" 
                onClick={handleCheckIn}
                disabled={checkInLoading}
              >
                {checkInLoading ? 'Checking In...' : 'Check In'}
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleCheckOut}
                disabled={checkOutLoading}
              >
                {checkOutLoading ? 'Checking Out...' : 'Check Out'}
              </button>
            </div>

            <div className="summary-cards">
              <div className="summary-card">
                <h3>Days Present</h3>
                <div className="value">{summary.days_present || 0}</div>
              </div>
              <div className="summary-card">
                <h3>Half Days</h3>
                <div className="value">{summary.half_days || 0}</div>
              </div>
              <div className="summary-card">
                <h3>Leaves</h3>
                <div className="value">{summary.leaves || 0}</div>
              </div>
              <div className="summary-card">
                <h3>Payable Days</h3>
                <div className="value">{summary.total_payable_days || 0}</div>
              </div>
              <div className="summary-card">
                <h3>Total Working Days</h3>
                <div className="value">{summary.total_working_days || 0}</div>
              </div>
            </div>
          </>
        )}

        {view === 'weekly' && !isAdmin ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Week</th>
                  <th>Present Days</th>
                  <th>Total Hours</th>
                  <th>Extra Hours</th>
                  <th>Half Days</th>
                </tr>
              </thead>
              <tbody>
                {weeks.map((week) => (
                  <tr key={week.week}>
                    <td>Week {week.week}</td>
                    <td>{week.present_days}</td>
                    <td>{week.total_hours.toFixed(2)}h</td>
                    <td>{week.extra_hours.toFixed(2)}h</td>
                    <td>{week.half_days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  {isAdmin && <th>Employee</th>}
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Work Hours</th>
                  <th>Extra Hours</th>
                  <th>Status</th>
                  <th>Half Day</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((record, index) => (
                  <tr key={index}>
                    {isAdmin && <td>{record.employee_name}</td>}
                    <td>{record.attendance_date}</td>
                    <td>{record.check_in || '-'}</td>
                    <td>{record.check_out || '-'}</td>
                    <td>{record.work_hours || '-'}</td>
                    <td>{record.extra_hours || '-'}</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: record.status === 'present' ? '#d1fae5' : 
                                   record.status === 'leave' ? '#dbeafe' : '#fee2e2',
                        color: record.status === 'present' ? '#065f46' : 
                               record.status === 'leave' ? '#1e40af' : '#991b1b'
                      }}>
                        {record.status}
                      </span>
                    </td>
                    <td>{record.is_half_day ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default Attendance;
