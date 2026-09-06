import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import { LoginPage } from './modules/auth/LoginPage';
import { UserManagementPage } from './modules/auth/UserManagementView';
import { ContractManagementModule } from './modules/contracts/ContractManagementModule';
import { AttendanceModule } from './modules/attendance/AttendanceModule';
import { TimeOffHub } from './modules/timeoff/TimeOffHub';
import { PayrollHub } from './modules/payroll/PayrollHub';
import { DashboardView } from './modules/dashboard/DashboardView';
import { SettingsView } from './modules/settings/SettingsView';

import { Menu, ShieldCheck } from 'lucide-react';

const MainApp = () => {
  const { user, ability } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    if (!user) return 'users';
    return user.role === 'Employee' ? 'attendance' : 'users';
  });
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  if (!user) {
    return <LoginPage />;
  }

  const pageTitles = {
    users: 'User Management',
    contracts: 'Contracts',
    attendance: 'Attendance',
    timeoff: 'Time Off & Leaves',
    payroll: user?.role?.toLowerCase() === 'employee' ? 'My Salary & Payslips' : 'Payroll Operations',
    dashboard: 'Analytics Dashboard',
    settings: 'Org Settings'
  };

  const isEmployee = user?.role?.toLowerCase() === 'employee';

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Mobile Top Header Bar (< 768px) */}
      <header className="mobile-header-bar">
        <div className="mobile-brand-section">
          <div className="mobile-brand-icon">
            <ShieldCheck size={20} color="#fff" />
          </div>
          <div className="mobile-brand-title">
            <span>PeoplePay360</span>
            <span className="mobile-brand-subtitle">{pageTitles[activeTab] || 'HR & Payroll'}</span>
          </div>
        </div>

        <button
          className="mobile-menu-trigger"
          onClick={() => setIsMobileNavOpen(true)}
          aria-label="Open navigation menu"
          title="Open Navigation"
        >
          <Menu size={22} />
        </button>
      </header>

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileNavOpen}
        setIsMobileOpen={setIsMobileNavOpen}
      />
      <main className="main-layout">
        {activeTab === 'users' && <UserManagementPage />}
        {activeTab === 'contracts' && ability?.can('read', 'contract') && <ContractManagementModule />}
        {activeTab === 'attendance' && <AttendanceModule />}
        {activeTab === 'timeoff' && <TimeOffHub />}
        {activeTab === 'payroll' && (ability?.can('read', 'payrun') || ability?.can('read', 'payslip') || isEmployee) && user?.role !== 'HR Manager' && <PayrollHub />}
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'settings' && ability?.can('read', 'setting') && !['HR Payroll User', 'HR Manager'].includes(user?.role) && <SettingsView />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}

