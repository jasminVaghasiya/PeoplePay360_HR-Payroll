import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserAvatarHoverPreview } from './UserAvatarHoverPreview';
import { 
  Users, 
  UserPlus, 
  Clock, 
  Calendar, 
  DollarSign, 
  BarChart3, 
  LogOut, 
  ShieldCheck,
  ChevronRight,
  FileText,
  Settings,
  X
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab, isMobileOpen = false, setIsMobileOpen }) => {
  const { user, ability, logout } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!user) return null;

  const roleBadgeClass = {
    'Admin': 'admin',
    'HR Payroll Manager': 'hr-payroll-manager',
    'HR Payroll User': 'hr-payroll-user',
    'HR Manager': 'hr-manager',
    'Employee': 'employee'
  }[user.role] || 'employee';

  const handleMouseEnter = () => setIsExpanded(true);
  const handleMouseLeave = () => setIsExpanded(false);

  const closeMobile = () => {
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  const isEmpRole = user?.role?.toLowerCase() === 'employee';

  const navItems = [
    { id: 'users', label: 'User Management', icon: UserPlus, action: 'read', subject: 'user' },
    { id: 'contracts', label: 'Contract Management', icon: FileText, action: 'read', subject: 'contract' },
    { id: 'attendance', label: 'Attendance & Schedule', icon: Clock, action: 'read', subject: 'attendance' },
    { id: 'timeoff', label: 'Time Off & Leaves', icon: Calendar, action: 'read', subject: 'timeoff' },
    {
      id: 'payroll',
      label: isEmpRole ? 'My Salary & Payslips' : 'Payroll Operations',
      icon: DollarSign,
      action: 'read',
      subject: isEmpRole ? 'payslip' : 'payrun'
    },
    { id: 'dashboard', label: 'Analytics Dashboard', icon: BarChart3, action: 'read', subject: 'dashboard' },
    { id: 'settings', label: 'Org & Department Settings', icon: Settings, action: 'read', subject: 'setting' }
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        className={`sidebar-mobile-overlay ${isMobileOpen ? 'active' : ''}`}
        onClick={closeMobile}
        title="Close Navigation"
      />

      <aside
        className={`app-sidebar ${isExpanded ? 'expanded' : 'collapsed'} ${isMobileOpen ? 'mobile-open' : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Sidebar Top Brand Header */}
        <div className="sidebar-brand" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div className="brand-icon">
              <ShieldCheck size={24} color="#fff" />
            </div>
            {(isExpanded || isMobileOpen) && (
              <div className="brand-text fade-in">
                <span className="brand-title">PeoplePay360</span>
                <span className="brand-sub">HR & Payroll</span>
              </div>
            )}
          </div>

          {/* Mobile Close Button */}
          {isMobileOpen && (
            <button
              onClick={closeMobile}
              className="mobile-sidebar-close"
              title="Close Navigation Menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation Items Filtered via CASL Ability */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            // HR Manager has strictly no access to payroll
            if (item.id === 'payroll' && user?.role === 'HR Manager') return null;
            if (item.id === 'settings' && ['HR Payroll User', 'HR Manager', 'Employee'].includes(user?.role)) return null;

            // Employees are always allowed to view their own salary & payslips
            const isAllowedByCasl = (item.id === 'payroll' && isEmpRole)
              ? true
              : (ability ? ability.can(item.action, item.subject) : false);

            const IconComponent = item.icon;
            const isActive = activeTab === item.id;

            if (!isAllowedByCasl) return null;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  closeMobile();
                }}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                title={!isExpanded && !isMobileOpen ? item.label : undefined}
              >
                <div className="sidebar-icon">
                  <IconComponent size={20} />
                </div>
                {(isExpanded || isMobileOpen) && (
                  <span className="sidebar-label fade-in">
                    {item.label}
                  </span>
                )}
                {(isExpanded || isMobileOpen) && isActive && (
                  <ChevronRight size={16} className="active-indicator fade-in" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer User Info & Logout */}
        <div className="sidebar-footer">
          <div className="user-profile-compact">
            <UserAvatarHoverPreview
              name={user.name}
              role={user.role}
              photoUrl={user.photo}
              size={40}
            />
            {(isExpanded || isMobileOpen) && (
              <div className="user-details fade-in">
                <div className="user-name">{user.name}</div>
                <span className={`role-badge ${roleBadgeClass}`}>
                  {user.role}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              logout();
              closeMobile();
            }}
            className="sidebar-logout-btn"
            title="Sign Out"
          >
            <LogOut size={18} />
            {(isExpanded || isMobileOpen) && <span className="fade-in">Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
