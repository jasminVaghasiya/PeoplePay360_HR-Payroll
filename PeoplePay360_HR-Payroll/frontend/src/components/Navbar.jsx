import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  UserPlus, 
  Clock, 
  Calendar, 
  DollarSign, 
  BarChart3, 
  LogOut, 
  ShieldCheck, 
  Briefcase 
} from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab }) => {
  const { user, logout, hasModuleAccess } = useAuth();

  if (!user) return null;

  const roleBadgeClass = {
    'Admin': 'admin',
    'HR Payroll Manager': 'hr-payroll-manager',
    'HR Payroll User': 'hr-payroll-user',
    'HR Manager': 'hr-manager',
    'Employee': 'employee'
  }[user.role] || 'employee';

  return (
    <header className="app-header">
      <div className="brand-logo">
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #714b67, #7C3AED)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(113, 75, 103, 0.4)'
        }}>
          <ShieldCheck size={22} color="#fff" />
        </div>
        <div>
          <span style={{ fontWeight: 700, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>PeoplePay360</span>
          <span className="brand-badge" style={{ marginLeft: '0.6rem' }}>HR & Payroll</span>
        </div>
      </div>

      <nav className="nav-links">
        {hasModuleAccess('user-management') && (
          <button
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <UserPlus size={18} />
            <span>User Management</span>
          </button>
        )}

        <button
          className={`nav-item ${activeTab === 'employees' ? 'active' : ''}`}
          onClick={() => setActiveTab('employees')}
        >
          <Users size={18} />
          <span>Employees</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          <Clock size={18} />
          <span>Attendance</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'timeoff' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeoff')}
        >
          <Calendar size={18} />
          <span>Time Off</span>
        </button>

        {hasModuleAccess('payroll') ? (
          <button
            className={`nav-item ${activeTab === 'payroll' ? 'active' : ''}`}
            onClick={() => setActiveTab('payroll')}
          >
            <DollarSign size={18} />
            <span>Payroll</span>
          </button>
        ) : (
          <div title="Payroll access restricted for your role" style={{ opacity: 0.4, cursor: 'not-allowed' }} className="nav-item">
            <DollarSign size={18} />
            <span>Payroll (Restricted)</span>
          </div>
        )}

        {hasModuleAccess('dashboard') && (
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <BarChart3 size={18} />
            <span>Dashboard</span>
          </button>
        )}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div className="user-profile-badge">
          <div className="user-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{user.name}</div>
            <span className={`role-badge ${roleBadgeClass}`}>
              {user.role}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="btn-secondary"
          style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
          title="Sign out"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
};
