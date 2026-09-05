import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './modules/auth/LoginPage';
import { UserManagementPage } from './modules/auth/UserManagementPage';
import { EmployeeDirectory } from './modules/employees/EmployeeDirectory';
import { AttendanceModule } from './modules/attendance/AttendanceModule';
import { TimeOffHub } from './modules/timeoff/TimeOffHub';
import { PayrollPlaceholder } from './modules/payroll/PayrollPlaceholder';
import { DashboardView } from './modules/dashboard/DashboardView';

const MainApp = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    if (!user) return 'users';
    return user.role === 'Employee' ? 'employees' : 'users';
  });

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-layout">
        {activeTab === 'users' && <UserManagementPage />}
        {activeTab === 'employees' && <EmployeeDirectory />}
        {activeTab === 'attendance' && <AttendanceModule />}
        {activeTab === 'timeoff' && <TimeOffHub />}
        {activeTab === 'payroll' && <PayrollPlaceholder />}
        {activeTab === 'dashboard' && <DashboardView />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
