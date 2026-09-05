import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  LogIn, 
  Eye, 
  EyeOff, 
  Shield 
} from 'lucide-react';

export const LoginPage = () => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(email, password);
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div className="login-wrapper">
      {/* Background Animated Ambient Glow Orbs */}
      <div className="bg-glow-orb orb-1" />
      <div className="bg-glow-orb orb-2" />
      <div className="bg-glow-orb orb-3" />

      <div className="login-single-card-container">
        <div className="login-form-panel glass-panel">
          {/* Centered Brand Header */}
          <div className="form-brand-header">
            <div className="hero-brand-icon">
              <ShieldCheck size={32} color="#fff" />
            </div>
            <div>
              <h1 className="hero-brand-title">PeoplePay360</h1>
              <div className="hero-brand-subtitle">
                <span className="live-pulse" />
                <span>HR & Payroll Operations Platform</span>
              </div>
            </div>
          </div>

          <div className="form-header text-center">
            <div className="form-badge">
              <Shield size={14} color="#C084FC" />
              <span>Secure Authentication</span>
            </div>
            <h2 className="form-title">Sign In to Workspace</h2>
            <p className="form-subtitle">Enter your registered email address and password</p>
          </div>

          {error && (
            <div className="login-error-alert fade-in">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-icon-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  className="form-input custom-auth-input"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Password</label>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input custom-auth-input"
                  style={{ paddingRight: '2.8rem' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle-btn"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span>Authenticating Credentials...</span>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="form-footer-note">
            <span>Enterprise Multi-Role Security & Role-Based Access</span>
          </div>
        </div>
      </div>
    </div>
  );
};
