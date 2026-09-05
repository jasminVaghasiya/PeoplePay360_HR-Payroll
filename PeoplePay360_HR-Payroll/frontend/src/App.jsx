import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import { LoginPage } from './modules/auth/LoginPage';
import { UserManagementPage } from './modules/auth/UserManagementPage';
import { ContractManagementModule } from './modules/contracts/ContractManagementModule';
import { AttendanceModule } from './modules/attendance/AttendanceModule';
import { TimeOffHub } from './modules/timeoff/TimeOffHub';
import { PayrollHub } from './modules/payroll/PayrollHub';
import { DashboardView } from './modules/dashboard/DashboardView';

const MainApp = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    if (!user) return 'users';
    return user.role === 'Employee' ? 'contracts' : 'users';
  });

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-layout">
        {activeTab === 'users' && <UserManagementPage />}
        {activeTab === 'contracts' && <ContractManagementModule />}
        {activeTab === 'attendance' && <AttendanceModule />}
        {activeTab === 'timeoff' && <TimeOffHub />}
        {activeTab === 'payroll' && <PayrollHub />}
        {activeTab === 'dashboard' && <DashboardView />}
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

