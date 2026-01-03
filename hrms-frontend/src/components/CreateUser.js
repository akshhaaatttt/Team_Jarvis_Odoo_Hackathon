import React, { useState } from 'react';
import Header from './Header';
import { employeeService } from '../services';

const CreateUser = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    year_of_joining: new Date().getFullYear(),
    role: 'employee',
    email: '',
    mobile: '',
    job_position: '',
    department: '',
    company: 'Company',
    location: ''
  });

  const [credentials, setCredentials] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await employeeService.createUser(formData);
      setCredentials(result.credentials);
      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        year_of_joining: new Date().getFullYear(),
        role: 'employee',
        email: '',
        mobile: '',
        job_position: '',
        department: '',
        company: 'Company',
        location: ''
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="profile-container">
        <div className="dashboard-header">
          <h1>Create New User</h1>
        </div>

        {credentials && (
          <div className="success-message" style={{marginBottom: '2rem'}}>
            <h3>User Created Successfully!</h3>
            <p><strong>Login ID:</strong> {credentials.login_id}</p>
            <p><strong>Temporary Password:</strong> {credentials.temporary_password}</p>
            <p style={{fontSize: '0.9rem', marginTop: '1rem'}}>
              ⚠️ Save these credentials! The password will not be shown again.
            </p>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <div className="profile-card">
          <form onSubmit={handleSubmit}>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem'}}>
              <div>
                <h3 style={{marginBottom: '1.5rem', color: '#1f2937'}}>Personal Information</h3>
                
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Mobile</label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Year of Joining *</label>
                  <input
                    type="number"
                    value={formData.year_of_joining}
                    onChange={(e) => setFormData({...formData, year_of_joining: parseInt(e.target.value)})}
                    min="2000"
                    max={new Date().getFullYear() + 1}
                    required
                  />
                </div>
              </div>

              <div>
                <h3 style={{marginBottom: '1.5rem', color: '#1f2937'}}>Job Information</h3>
                
                <div className="form-group">
                  <label>Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    required
                  >
                    <option value="employee">Employee</option>
                    <option value="hr">HR</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Job Position</label>
                  <input
                    type="text"
                    value={formData.job_position}
                    onChange={(e) => setFormData({...formData, job_position: e.target.value})}
                    placeholder="e.g. Software Engineer"
                  />
                </div>

                <div className="form-group">
                  <label>Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    placeholder="e.g. Engineering"
                  />
                </div>

                <div className="form-group">
                  <label>Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g. New York, USA"
                  />
                </div>
              </div>
            </div>

            <div style={{marginTop: '2rem', display: 'flex', gap: '1rem'}}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating User...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateUser;
