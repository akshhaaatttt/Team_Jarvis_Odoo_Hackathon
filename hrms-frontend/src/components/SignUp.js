import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeService } from '../services';

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    mobile: '',
    personal_email: '',
    address: '',
    nationality: 'Indian',
    marital_status: 'single',
    job_position: '',
    department: '',
    location: '',
    education: '',
    experience_years: 0
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await employeeService.signUp(formData);
      setMessage('Registration submitted successfully! Your application is pending admin approval. You will receive your login credentials via email once approved.');
      setFormData({
        first_name: '',
        last_name: '',
        date_of_birth: '',
        gender: '',
        mobile: '',
        personal_email: '',
        address: '',
        nationality: 'Indian',
        marital_status: 'single',
        job_position: '',
        department: '',
        location: '',
        education: '',
        experience_years: 0
      });
      
      setTimeout(() => {
        navigate('/login');
      }, 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        maxWidth: '900px',
        width: '100%',
        padding: '2.5rem'
      }}>
        <div style={{textAlign: 'center', marginBottom: '2rem'}}>
          <h1 style={{color: '#1f2937', marginBottom: '0.5rem'}}>Join Our Team</h1>
          <p style={{color: '#6b7280'}}>Fill out the form below to apply for a position</p>
        </div>

        {message && (
          <div style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            background: '#d1fae5',
            color: '#065f46',
            borderRadius: '8px',
            border: '1px solid #10b981'
          }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            background: '#fee2e2',
            color: '#991b1b',
            borderRadius: '8px',
            border: '1px solid #ef4444'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>
            {/* Personal Information */}
            <div>
              <h3 style={{marginBottom: '1rem', color: '#374151'}}>Personal Information</h3>
              
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
                <label>Date of Birth *</label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Gender *</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Mobile *</label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Personal Email *</label>
                <input
                  type="email"
                  value={formData.personal_email}
                  onChange={(e) => setFormData({...formData, personal_email: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Address *</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  rows="3"
                  required
                />
              </div>
            </div>

            {/* Job Information */}
            <div>
              <h3 style={{marginBottom: '1rem', color: '#374151'}}>Job Information</h3>

              <div className="form-group">
                <label>Desired Position *</label>
                <input
                  type="text"
                  value={formData.job_position}
                  onChange={(e) => setFormData({...formData, job_position: e.target.value})}
                  placeholder="e.g. Software Engineer"
                  required
                />
              </div>

              <div className="form-group">
                <label>Department *</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  placeholder="e.g. Engineering"
                  required
                />
              </div>

              <div className="form-group">
                <label>Preferred Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g. Mumbai, India"
                />
              </div>

              <div className="form-group">
                <label>Highest Education *</label>
                <input
                  type="text"
                  value={formData.education}
                  onChange={(e) => setFormData({...formData, education: e.target.value})}
                  placeholder="e.g. Bachelor's in Computer Science"
                  required
                />
              </div>

              <div className="form-group">
                <label>Years of Experience *</label>
                <input
                  type="number"
                  value={formData.experience_years}
                  onChange={(e) => setFormData({...formData, experience_years: parseInt(e.target.value)})}
                  min="0"
                  max="50"
                  required
                />
              </div>

              <div className="form-group">
                <label>Marital Status</label>
                <select
                  value={formData.marital_status}
                  onChange={(e) => setFormData({...formData, marital_status: e.target.value})}
                >
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </select>
              </div>

              <div className="form-group">
                <label>Nationality</label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div style={{marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center'}}>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate('/login')}
              disabled={loading}
            >
              Back to Login
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>

        <p style={{textAlign: 'center', marginTop: '2rem', color: '#6b7280', fontSize: '0.9rem'}}>
          Already have an account? <a href="/login" style={{color: '#667eea', textDecoration: 'none'}}>Login here</a>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
