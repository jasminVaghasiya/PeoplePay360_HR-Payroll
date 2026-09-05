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
  FileText
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
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

  const navItems = [
    { id: 'users', label: 'User Management', icon: UserPlus, action: 'read', subject: 'user' },
    { id: 'contracts', label: 'Contract Management', icon: FileText, action: 'read', subject: 'contract' },
    { id: 'attendance', label: 'Attendance & Schedule', icon: Clock, action: 'read', subject: 'attendance' },
    { id: 'timeoff', label: 'Time Off & Leaves', icon: Calendar, action: 'read', subject: 'timeoff' },
    { id: 'payroll', label: 'Payroll Operations', icon: DollarSign, action: 'read', subject: 'payrun' },
    { id: 'dashboard', label: 'Analytics Dashboard', icon: BarChart3, action: 'read', subject: 'dashboard' }
  ];

  return (
    <aside
      className={`app-sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Sidebar Top Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon">
          <ShieldCheck size={24} color="#fff" />
        </div>
        {isExpanded && (
          <div className="brand-text fade-in">
            <span className="brand-title">PeoplePay360</span>
            <span className="brand-sub">HR & Payroll</span>
          </div>
        )}
      </div>

      {/* Navigation Items Filtered via CASL Ability */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isAllowedByCasl = ability ? ability.can(item.action, item.subject) : false;
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;

          if (!isAllowedByCasl) return null;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              title={!isExpanded ? item.label : undefined}
            >
              <div className="sidebar-icon">
                <IconComponent size={20} />
              </div>
              {isExpanded && (
                <span className="sidebar-label fade-in">
                  {item.label}
                </span>
              )}
              {isExpanded && isActive && (
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
          {isExpanded && (
            <div className="user-details fade-in">
              <div className="user-name">{user.name}</div>
              <span className={`role-badge ${roleBadgeClass}`}>
                {user.role}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={logout}
          className="sidebar-logout-btn"
          title="Sign Out"
        >
          <LogOut size={18} />
          {isExpanded && <span className="fade-in">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
