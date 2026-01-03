import React, { useState, useEffect } from 'react';
import Header from './Header';
import { employeeService, authService } from '../services';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [message, setMessage] = useState('');
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'admin' || user?.role === 'hr';

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await employeeService.getMyProfile();
      setProfile(data);
      setEditData({
        address: data.address || '',
        mobile: data.mobile || '',
        personal_email: data.personal_email || ''
      });
      
      // Set initial tab based on role
      if (isAdmin) {
        setActiveTab('resume');
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel edit
      setEditData({
        address: profile.address || '',
        mobile: profile.mobile || '',
        personal_email: profile.personal_email || ''
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    try {
      await employeeService.updateEmployee(profile.id, editData);
      setMessage('Profile updated successfully');
      setTimeout(() => setMessage(''), 3000);
      setIsEditing(false);
      loadProfile();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to update profile');
      setTimeout(() => setMessage(''), 5000);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!profile) {
    return <div>Profile not found</div>;
  }

  return (
    <>
      <Header />
      <div className="profile-container">
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
        
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-left">
              <div className="info-item">
                <label>Name</label>
                <div className="value">{profile.first_name} {profile.last_name}</div>
              </div>
              {isAdmin && (
                <div className="info-item">
                  <label>Login ID</label>
                  <div className="value">{profile.login_id}</div>
                </div>
              )}
              <div className="info-item">
                <label>{isAdmin ? 'Job Position' : 'Job Position'}</label>
                <div className="value">{profile.job_position || 'N/A'}</div>
              </div>
              <div className="info-item">
                <label>Email</label>
                <div className="value">{profile.email || 'N/A'}</div>
              </div>
              <div className="info-item">
                <label>Mobile</label>
                <div className="value">{profile.mobile || 'N/A'}</div>
              </div>
            </div>

            <div className="profile-right">
              <div className="info-item">
                <label>Company</label>
                <div className="value">{profile.company || 'N/A'}</div>
              </div>
              <div className="info-item">
                <label>Department</label>
                <div className="value">{profile.department || 'N/A'}</div>
              </div>
              <div className="info-item">
                <label>Manager</label>
                <div className="value">{profile.manager || 'N/A'}</div>
              </div>
              <div className="info-item">
                <label>Location</label>
                <div className="value">{profile.location || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div className="tabs">
            {isAdmin ? (
              <>
                <button 
                  className={`tab ${activeTab === 'resume' ? 'active' : ''}`}
                  onClick={() => setActiveTab('resume')}
                >
                  Resume
                </button>
                <button 
                  className={`tab ${activeTab === 'private' ? 'active' : ''}`}
                  onClick={() => setActiveTab('private')}
                >
                  Private Info
                </button>
                <button 
                  className={`tab ${activeTab === 'salary' ? 'active' : ''}`}
                  onClick={() => setActiveTab('salary')}
                >
                  Salary Info
                </button>
              </>
            ) : (
              <>
                <button 
                  className={`tab ${activeTab === 'personal' ? 'active' : ''}`}
                  onClick={() => setActiveTab('personal')}
                >
                  Personal Info
                </button>
                <button 
                  className={`tab ${activeTab === 'security' ? 'active' : ''}`}
                  onClick={() => setActiveTab('security')}
                >
                  Security
                </button>
              </>
            )}
          </div>

          {/* Employee View */}
          {!isAdmin && activeTab === 'personal' && (
            <div className="tab-content">
              <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem'}}>
                {!isEditing ? (
                  <button className="btn btn-primary" onClick={handleEditToggle}>
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button className="btn btn-success" style={{marginRight: '0.5rem'}} onClick={handleSaveProfile}>
                      Save Changes
                    </button>
                    <button className="btn btn-secondary" onClick={handleEditToggle}>
                      Cancel
                    </button>
                  </>
                )}
              </div>
              
              <div>
                <div className="info-item">
                  <label>Date of Birth</label>
                  <div className="value">{profile.date_of_birth || 'N/A'}</div>
                </div>
                <div className="info-item">
                  <label>Address</label>
                  {isEditing ? (
                    <textarea
                      value={editData.address}
                      onChange={(e) => setEditData({...editData, address: e.target.value})}
                      rows="3"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem'
                      }}
                    />
                  ) : (
                    <div className="value">{profile.address || 'N/A'}</div>
                  )}
                </div>
                <div className="info-item">
                  <label>Nationality</label>
                  <div className="value">{profile.nationality || 'N/A'}</div>
                </div>
                <div className="info-item">
                  <label>Personal Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editData.personal_email}
                      onChange={(e) => setEditData({...editData, personal_email: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem'
                      }}
                    />
                  ) : (
                    <div className="value">{profile.personal_email || 'N/A'}</div>
                  )}
                </div>
                <div className="info-item">
                  <label>Gender</label>
                  <div className="value">{profile.gender || 'N/A'}</div>
                </div>
                <div className="info-item">
                  <label>Mobile</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.mobile}
                      onChange={(e) => setEditData({...editData, mobile: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem'
                      }}
                    />
                  ) : (
                    <div className="value">{profile.mobile || 'N/A'}</div>
                  )}
                </div>
                <div className="info-item">
                  <label>Marital Status</label>
                  <div className="value">{profile.marital_status || 'N/A'}</div>
                </div>
                <div className="info-item">
                  <label>Date of Joining</label>
                  <div className="value">{profile.date_of_joining || 'N/A'}</div>
                </div>                {isEditing && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: '#fef3c7',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    color: '#92400e'
                  }}>
                    <strong>Note:</strong> You can only edit Address, Mobile, and Personal Email fields.
                  </div>
                )}              </div>

              <div>
                <h3 style={{marginBottom: '1rem', color: '#1f2937'}}>Bank Details</h3>
                <div className="info-item">
                  <label>Account Number</label>
                  <div className="value">{profile.account_number || 'N/A'}</div>
                </div>
                <div className="info-item">
                  <label>Bank Name</label>
                  <div className="value">{profile.bank_name || 'N/A'}</div>
                </div>
                <div className="info-item">
                  <label>IFSC Code</label>
                  <div className="value">{profile.ifsc_code || 'N/A'}</div>
                </div>
                <div className="info-item">
                  <label>PAN</label>
                  <div className="value">{profile.pan_number || 'N/A'}</div>
                </div>
                <div className="info-item">
                  <label>UAN</label>
                  <div className="value">{profile.uan_number || 'N/A'}</div>
                </div>
                <div className="info-item">
                  <label>ESI</label>
                  <div className="value">{profile.esi_number || 'N/A'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Admin View */}
          {isAdmin && activeTab === 'resume' && (
            <div>
              <div className="info-item">
                <label>About</label>
                <div className="value">{profile.about || 'Passionate professional dedicated to excellence...'}</div>
              </div>
              <div className="info-item">
                <label>Why I Love My Job</label>
                <div className="value">{profile.why_love_job || 'I love the collaborative environment and growth opportunities...'}</div>
              </div>
              <div className="info-item">
                <label>Interests & Hobbies</label>
                <div className="value">{profile.interests || 'Reading, Technology, Team Sports...'}</div>
              </div>
              <div className="info-item">
                <label>Skills</label>
                <div className="value">{profile.skills || 'Leadership, Communication, Problem Solving...'}</div>
              </div>
              <div className="info-item">
                <label>Certifications</label>
                <div className="value">{profile.certifications || 'Various professional certifications...'}</div>
              </div>
            </div>
          )}

          {isAdmin && activeTab === 'salary' && profile.salary_info && (
            <div className="tab-content">
              <div>
                <h3 style={{marginBottom: '1rem', color: '#1f2937'}}>Wage Details</h3>
                <div className="info-item">
                  <label>Monthly Wage</label>
                  <div className="value">₹{profile.salary_info.monthly_wage?.toLocaleString()}</div>
                </div>
                <div className="info-item">
                  <label>Yearly Wage</label>
                  <div className="value">₹{profile.salary_info.yearly_wage?.toLocaleString()}</div>
                </div>

                <h3 style={{marginTop: '2rem', marginBottom: '1rem', color: '#1f2937'}}>Components</h3>
                <div className="info-item">
                  <label>Basic</label>
                  <div className="value">₹{profile.salary_info.basic?.toLocaleString()}</div>
                </div>
                <div className="info-item">
                  <label>HRA</label>
                  <div className="value">₹{profile.salary_info.hra?.toLocaleString()}</div>
                </div>
                <div className="info-item">
                  <label>Performance Bonus</label>
                  <div className="value">₹{profile.salary_info.performance_bonus?.toLocaleString()}</div>
                </div>
              </div>

              <div>
                <h3 style={{marginBottom: '1rem', color: '#1f2937'}}>Deductions</h3>
                <div className="info-item">
                  <label>Employee PF</label>
                  <div className="value">₹{profile.salary_info.employee_pf?.toLocaleString()}</div>
                </div>
                <div className="info-item">
                  <label>Professional Tax</label>
                  <div className="value">₹{profile.salary_info.professional_tax?.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Profile;
