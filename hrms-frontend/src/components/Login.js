import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services';

const Login = () => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authService.login(loginId, password);
      
      if (data.user.first_login) {
        navigate('/change-password');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Animated Wave Layers */}
      <div className="wave-layer wave-layer-1"></div>
      <div className="wave-layer wave-layer-2"></div>
      <div className="wave-layer wave-layer-3"></div>
      
      {/* Glassmorphism Login Card */}
      <div className="login-box">
        <div className="login-header">
          <h2>Odoo India</h2>
          <p className="login-subtitle">Welcome back! Please login to your account.</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          {/* Floating Label Input */}
          <div className="form-group floating-label">
            <input
              type="text"
              id="loginId"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder=""
              required
              className="floating-input"
            />
            <label htmlFor="loginId" className="floating-label-text">Login ID</label>
            <div className="input-border-glow"></div>
          </div>

          {/* Floating Label Input */}
          <div className="form-group floating-label">
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=""
              required
              className="floating-input"
            />
            <label htmlFor="password" className="floating-label-text">Password</label>
            <div className="input-border-glow"></div>
          </div>

          {/* Animated Button with Ripple */}
          <button 
            type="submit" 
            className="btn btn-primary login-button" 
            disabled={loading}
          >
            <span className="button-text">{loading ? 'Logging in...' : 'Login'}</span>
            <div className="button-ripple"></div>
          </button>
        </form>

        <div className="login-footer">
          <p>Don't have an account? <a href="/signup" className="signup-link">Sign up here</a></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
