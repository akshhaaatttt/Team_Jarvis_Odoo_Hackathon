import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService, attendanceService } from '../services';

const Header = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'admin' || user?.role === 'hr';

  useEffect(() => {
    checkTodayStatus();
  }, []);

  const checkTodayStatus = async () => {
    try {
      const data = await attendanceService.getMyAttendance();
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = data.attendance?.find(a => a.attendance_date === today);
      // Checked in if there's a check_in time but no check_out time
      setIsCheckedIn(!!(todayRecord?.check_in && !todayRecord?.check_out));
    } catch (error) {
      console.error('Failed to check attendance status:', error);
    }
  };

  const handleAttendanceToggle = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      if (isCheckedIn) {
        // Currently checked in, so check out
        await attendanceService.checkOut();
        setIsCheckedIn(false);
      } else {
        // Not checked in, so check in
        await attendanceService.checkIn();
        setIsCheckedIn(true);
      }
      // Refresh status after action
      setTimeout(() => checkTodayStatus(), 500);
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to update attendance';
      alert(errorMsg);
      // Refresh status to sync with server
      checkTodayStatus();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const getInitials = () => {
    if (!user?.name) return 'U';
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <header className="header">
      <div className="header-logo">Dayflow</div>
      
      <nav className="header-nav">
        <Link to="/dashboard">Employees</Link>
        <Link to="/attendance">Attendance</Link>
        <Link to="/leave">Time Off</Link>
        {isAdmin && <Link to="/create-user">Create User</Link>}
      </nav>

      <div className="avatar-dropdown">
        <div
          onClick={handleAttendanceToggle}
          title={isCheckedIn ? 'Checked In - Click to Check Out' : 'Click to Check In'}
          style={{
            width: '45px',
            height: '45px',
            borderRadius: '50%',
            backgroundColor: isCheckedIn ? '#10b981' : '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '1rem',
            color: 'white',
            fontSize: '1.3rem',
            fontWeight: 'bold',
            border: '3px solid white',
            boxShadow: isCheckedIn ? '0 0 15px rgba(16, 185, 129, 0.5)' : '0 0 15px rgba(239, 68, 68, 0.5)',
            transition: 'all 0.3s ease',
            opacity: loading ? 0.6 : 1
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'scale(1.1)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {loading ? '...' : isCheckedIn ? '✓' : '○'}
        </div>
        
        <div className="avatar" onClick={() => setShowDropdown(!showDropdown)}>
          {getInitials()}
        </div>
        
        {showDropdown && (
          <div className="dropdown-menu">
            <button onClick={() => { navigate('/profile'); setShowDropdown(false); }}>
              My Profile
            </button>
            <button onClick={() => { navigate('/salary-slip'); setShowDropdown(false); }}>
              Salary Slip
            </button>
            <button onClick={handleLogout}>
              Log Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
