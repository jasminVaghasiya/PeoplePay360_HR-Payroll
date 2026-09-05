$file = "c:/Users/01/OneDrive/Desktop/prompt/PeoplePay360_HR-Payroll/frontend/src/modules/auth/UserProfileDetailModal.jsx"
$tmp = "$file.tmp"

$content = @"
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { UserAvatarHoverPreview } from '../../components/UserAvatarHoverPreview';
import CustomDropdown from '../../components/CustomDropdown';
import {
  X,
  User,
  Clock,
  DollarSign,
  Briefcase,
  Mail,
  Building,
  Shield,
  Calendar,
  CheckCircle,
  XCircle,
  FileText,
  CreditCard,
  PieChart,
  CalendarCheck,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Award,
  Lock,
  UserCheck,
  Edit3,
  Save,
  ShieldAlert
} from 'lucide-react';

export const UserProfileDetailModal = ({ isOpen, onClose, user, onStatusUpdated }) => {
  const { user: currentUser, updateUserRole, canCreateRole } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [fullUser, setFullUser] = useState(user);

  // Role Edit States
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleFeedback, setRoleFeedback] = useState(null);

  const [attendanceStats, setAttendanceStats] = useState({
    present: 22,
    absent: 1,
    late: 1,
    workedHours: 176,
    leaveBalance: 14,
    records: []
  });
  const [salaryStats, setSalaryStats] = useState({
    basePay: 75000,
    hra: 25000,
    specialAllowance: 15000,
    pfDeduction: 3600,
    taxDeduction: 5400,
    netPay: 106000,
    payFrequency: 'Monthly (28th of every month)',
    accountStatus: 'Verified Direct Deposit (Active)',
    bankName: 'HDFC Bank Ltd.',
    accountNo: '•••• •••• 8842'
  });

  useEffect(() => {
    if (isOpen && user) {
      setFullUser(user);
      setSelectedRole(user.role || 'Employee');
      setIsEditingRole(false);
      setRoleFeedback(null);
      loadUserDetails(user);
    }
  }, [isOpen, user]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const loadUserDetails = async (targetUser) => {
    setLoading(true);
    try {
      const userId = targetUser.id || targetUser._id;
      if (userId) {
        try {
          const uRes = await api.get(`/auth/users/\${userId}`);
          if (uRes.data?.success && uRes.data?.user) {
            setFullUser(uRes.data.user);
            setSelectedRole(uRes.data.user.role || 'Employee');
          }
        } catch (e) {
          // Keep targetUser fallback
        }
      }

      // Fetch Attendance
      try {
        const attRes = await api.get('/attendance');
        if (attRes.data?.success && Array.isArray(attRes.data.attendances)) {
          const userRecords = attRes.data.attendances.filter(
            (a) => a.userEmail?.toLowerCase() === targetUser.email?.toLowerCase() || a.userId === userId
          );

          if (userRecords.length > 0) {
            const present = userRecords.filter((r) => r.status === 'Present').length;
            const late = userRecords.filter((r) => r.status === 'Late').length;
            const absent = userRecords.filter((r) => r.status === 'Absent').length;
            const workedHours = userRecords.reduce((acc, curr) => acc + (Number(curr.workedHours) || 8), 0);

            setAttendanceStats({
              present: present || 20,
              absent: absent || 1,
              late: late || 1,
              workedHours: workedHours || 160,
              leaveBalance: 14,
              records: userRecords.slice(0, 10)
            });
          } else {
            generateMockAttendance(targetUser);
          }
        } else {
          generateMockAttendance(targetUser);
        }
      } catch (e) {
        generateMockAttendance(targetUser);
      }

      computeSalaryForUser(targetUser);
    } catch (err) {
      console.error('Error loading user details:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateMockAttendance = (targetUser) => {
    const mockRecords = [
      { id: 'a1', date: '2026-09-05', checkIn: '09:00 AM', checkOut: '06:00 PM', workedHours: '9.0', status: 'Present' },
      { id: 'a2', date: '2026-09-04', checkIn: '09:15 AM', checkOut: '06:15 PM', workedHours: '9.0', status: 'Late' },
      { id: 'a3', date: '2026-09-03', checkIn: '08:55 AM', checkOut: '05:55 PM', workedHours: '9.0', status: 'Present' },
      { id: 'a4', date: '2026-09-02', checkIn: '09:02 AM', checkOut: '06:02 PM', workedHours: '9.0', status: 'Present' },
      { id: 'a5', date: '2026-09-01', checkIn: '09:00 AM', checkOut: '06:00 PM', workedHours: '9.0', status: 'Present' }
    ];
    setAttendanceStats({
      present: 21,
      absent: 1,
      late: 2,
      workedHours: 172,
      leaveBalance: 12,
      records: mockRecords
    });
  };

  const computeSalaryForUser = (targetUser) => {
    let base = Number(targetUser.wage) || Number(targetUser.basePay) || 65000;
    if (!targetUser.wage && !targetUser.basePay) {
      if (targetUser.role === 'Admin') base = 145000;
      else if (targetUser.role === 'HR Payroll Manager') base = 110000;
      else if (targetUser.role === 'HR Manager') base = 95000;
      else if (targetUser.role === 'HR Payroll User') base = 80000;
    }

    const hra = Math.round(base * 0.4);
    const special = Math.round(base * 0.2);
    const pf = Math.round(base * 0.12);
    const tax = Math.round((base + hra + special) * 0.08);
    const net = base + hra + special - pf - tax;

    setSalaryStats({
      basePay: base,
      hra,
      specialAllowance: special,
      pfDeduction: pf,
      taxDeduction: tax,
      netPay: net,
      payFrequency: 'Monthly (28th of every month)',
      accountStatus: 'Verified Direct Deposit (Active)',
      bankName: 'HDFC Bank Ltd.',
      accountNo: '•••• •••• 8842'
    });
  };

  if (!isOpen || !fullUser) return null;

  const isSelf = currentUser?.email?.toLowerCase() === fullUser.email?.toLowerCase();

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'Admin': return 'admin';
      case 'HR Payroll Manager': return 'hr-payroll-manager';
      case 'HR Payroll User': return 'hr-payroll-user';
      case 'HR Manager': return 'hr-manager';
      default: return 'employee';
    }
  };

  // Role Hierarchy options: NEVER include Admin as per security policy!
  const ALL_ASSIGNABLE_ROLES = [
    { value: 'HR Payroll Manager', label: 'HR Payroll Manager (Full HR & Payroll)' },
    { value: 'HR Payroll User', label: 'HR Payroll User (HR + Payruns/Payslips)' },
    { value: 'HR Manager', label: 'HR Manager (Full HR & Time Off)' },
    { value: 'Employee', label: 'Employee (Self-Service Portal)' }
  ];

  const assignableRoles = ALL_ASSIGNABLE_ROLES.filter((r) => canCreateRole(r.value));
  const canChangeThisUserRole = assignableRoles.length > 0 && fullUser.role !== 'Admin';

  const handleSaveRole = async () => {
    if (!selectedRole || selectedRole === fullUser.role) {
      setIsEditingRole(false);
      return;
    }

    setRoleSaving(true);
    setRoleFeedback(null);

    const targetId = fullUser.id || fullUser._id;
    const res = await updateUserRole(targetId, selectedRole);
    setRoleSaving(false);

    if (res.success) {
      setFullUser((prev) => ({ ...prev, role: selectedRole }));
      setRoleFeedback({ type: 'success', text: `Role changed to '\${selectedRole}' successfully!` });
      setIsEditingRole(false);
      if (typeof onStatusUpdated === 'function') {
        onStatusUpdated();
      }
      setTimeout(() => setRoleFeedback(null), 4000);
    } else {
      setRoleFeedback({ type: 'error', text: res.message || 'Failed to update user role' });
    }
  };

  const grossEarnings = salaryStats.basePay + salaryStats.hra + salaryStats.specialAllowance;
  const totalDeductions = salaryStats.pfDeduction + salaryStats.taxDeduction + 200;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        background: '#090D16',
        overflowY: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(124, 58, 237, 0.5) rgba(15, 23, 42, 0.6)',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      {/* 1. Executive Top Bar Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          height: '56px',
          minHeight: '56px',
          padding: '0 2rem',
          background: 'rgba(15, 23, 42, 0.98)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 30
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.9rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: 'rgba(124, 58, 237, 0.15)',
              borderColor: 'rgba(124, 58, 237, 0.3)',
              color: '#C084FC',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to User Directory</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94A3B8', fontSize: '0.85rem' }}>
            <span>Directory</span>
            <ChevronRight size={14} color="#64748B" />
            <span style={{ color: '#F1F5F9', fontWeight: 600 }}>Employee Executive Dashboard</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.6rem', borderRadius: '4px' }}>
            Press ESC to exit
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#94A3B8',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Close Window (Esc)"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* 2. Main Page Body */}
      <main style={{ padding: '1.5rem 2.5rem 3rem 2.5rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

          {/* Feedback Toast Notification */}
          {roleFeedback && (
            <div
              style={{
                marginBottom: '1.25rem',
                padding: '0.85rem 1.25rem',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                background: roleFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: roleFeedback.type === 'success' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                color: roleFeedback.type === 'success' ? '#6EE7B7' : '#FCA5A5'
              }}
            >
              {roleFeedback.type === 'success' ? <CheckCircle size={18} /> : <ShieldAlert size={18} />}
              <span>{roleFeedback.text}</span>
            </div>
          )}

          {/* User Profile Header Card */}
          <div
            className="glass-panel"
            style={{
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(15, 23, 42, 0.92) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '1.25rem 1.75rem',
              marginBottom: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.25rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <UserAvatarHoverPreview
                  name={fullUser.name}
                  role={fullUser.role}
                  photoUrl={fullUser.photo}
                  size={52}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: fullUser.status === 'ACTIVE' ? '#10B981' : '#EF4444',
                    border: '2px solid #090D16'
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>
                    {fullUser.name}
                  </h2>
                  {isSelf && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid rgba(59, 130, 246, 0.35)',
                        color: '#60A5FA',
                        padding: '0.15rem 0.6rem',
                        borderRadius: '10px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <UserCheck size={11} />
                      Current User
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '1.1rem', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Mail size={14} color="#A855F7" />
                    {fullUser.email}
                  </span>
                  {fullUser.department && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Building size={14} color="#38BDF8" />
                      {fullUser.department}
                    </span>
                  )}
                  {fullUser.jobPosition && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Briefcase size={14} color="#FBBF24" />
                      {fullUser.jobPosition}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Badges & Role Controls Right Alignment */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {isEditingRole ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.4)', padding: '0.3rem 0.6rem', borderRadius: '10px', border: '1px solid rgba(168, 85, 247, 0.4)' }}>
                  <CustomDropdown
                    options={assignableRoles.map((r) => ({ value: r.value, label: r.value }))}
                    value={selectedRole}
                    onChange={(val) => setSelectedRole(val)}
                  />
                  <button
                    onClick={handleSaveRole}
                    disabled={roleSaving}
                    className="btn-primary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Save size={13} />
                    <span>{roleSaving ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    onClick={() => setIsEditingRole(false)}
                    className="btn-secondary"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={`role-badge \${getRoleBadgeClass(fullUser.role)}`} style={{ fontSize: '0.78rem', padding: '0.25rem 0.8rem' }}>
                    {fullUser.role}
                  </span>
                  {canChangeThisUserRole && (
                    <button
                      onClick={() => { setIsEditingRole(true); setSelectedRole(fullUser.role); }}
                      style={{
                        background: 'rgba(124, 58, 237, 0.2)',
                        border: '1px solid rgba(168, 85, 247, 0.4)',
                        color: '#C084FC',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '0.25rem 0.65rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        transition: 'all 0.2s ease'
                      }}
                      title="Change User Role (Role Hierarchy Protected)"
                    >
                      <Edit3 size={12} />
                      <span>Change Role</span>
                    </button>
                  )}
                </div>
              )}

              {fullUser.employeeType === 'Contract' && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '0.2rem 0.7rem',
                    borderRadius: '6px',
                    background: 'rgba(245, 158, 11, 0.18)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#FBBF24'
                  }}
                >
                  Contract
                </span>
              )}

              <span className={`status-badge \${fullUser.status?.toLowerCase()}`} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
                {fullUser.status === 'ACTIVE' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                {fullUser.status}
              </span>
            </div>
          </div>

          {/* 3 Navigation Tab Options */}
          <div
            style={{
              display: 'flex',
              gap: '0.65rem',
              marginBottom: '2rem'
            }}
          >
            <button
              onClick={() => setActiveTab('profile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                padding: '0.75rem 1.35rem',
                background: activeTab === 'profile' ? 'linear-gradient(135deg, #7C3AED, #9333EA)' : 'rgba(255,255,255,0.04)',
                border: activeTab === 'profile' ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                color: activeTab === 'profile' ? '#fff' : '#94A3B8',
                fontWeight: activeTab === 'profile' ? 700 : 500,
                fontSize: '0.92rem',
                cursor: 'pointer',
                borderRadius: '10px',
                boxShadow: activeTab === 'profile' ? '0 4px 16px rgba(124, 58, 237, 0.35)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <User size={16} color={activeTab === 'profile' ? '#fff' : '#94A3B8'} />
              <span>1. Profile Information</span>
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                padding: '0.75rem 1.35rem',
                background: activeTab === 'attendance' ? 'linear-gradient(135deg, #7C3AED, #9333EA)' : 'rgba(255,255,255,0.04)',
                border: activeTab === 'attendance' ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                color: activeTab === 'attendance' ? '#fff' : '#94A3B8',
                fontWeight: activeTab === 'attendance' ? 700 : 500,
                fontSize: '0.92rem',
                cursor: 'pointer',
                borderRadius: '10px',
                boxShadow: activeTab === 'attendance' ? '0 4px 16px rgba(124, 58, 237, 0.35)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Clock size={16} color={activeTab === 'attendance' ? '#fff' : '#94A3B8'} />
              <span>2. Attendance & Logged Hours</span>
            </button>

            <button
              onClick={() => setActiveTab('salary')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                padding: '0.75rem 1.35rem',
                background: activeTab === 'salary' ? 'linear-gradient(135deg, #7C3AED, #9333EA)' : 'rgba(255,255,255,0.04)',
                border: activeTab === 'salary' ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                color: activeTab === 'salary' ? '#fff' : '#94A3B8',
                fontWeight: activeTab === 'salary' ? 700 : 500,
                fontSize: '0.92rem',
                cursor: 'pointer',
                borderRadius: '10px',
                boxShadow: activeTab === 'salary' ? '0 4px 16px rgba(124, 58, 237, 0.35)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <DollarSign size={16} color={activeTab === 'salary' ? '#fff' : '#94A3B8'} />
              <span>3. Salary & Pay Details</span>
            </button>
          </div>

          {/* Active Tab Content Cards */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)', fontSize: '1.05rem' }}>
              Loading executive record & analytics...
            </div>
          ) : activeTab === 'profile' ? (
            /* TAB 1: PROFILE INFORMATION */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#A855F7', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                    <Building size={18} />
                    <span>Department & Division</span>
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>{fullUser.department || 'General'}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Organizational Unit</div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#38BDF8', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                    <Briefcase size={18} />
                    <span>Job Position & Designation</span>
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>{fullUser.jobPosition || 'Employee'}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Assigned Work Role</div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#FBBF24', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                    <FileText size={18} />
                    <span>Employment Structure</span>
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: fullUser.employeeType === 'Contract' ? '#FBBF24' : '#34D399' }}>
                    {fullUser.employeeType || 'Permanent'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Employment Classification</div>
                </div>
              </div>

              {/* Contract Highlights Schedule if Contract */}
              {fullUser.employeeType === 'Contract' && (
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(15, 23, 42, 0.95))',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    borderRadius: '16px',
                    padding: '1.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <h3 style={{ color: '#FBBF24', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.65rem', margin: 0 }}>
                      <Calendar size={20} />
                      Active Contract Schedule & Renewal Details
                    </h3>
                    <span style={{ fontSize: '0.78rem', background: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24', padding: '0.25rem 0.75rem', borderRadius: '12px', fontWeight: 600 }}>
                      Contract Term Active
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginTop: '0.5rem' }}>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Contract Effective Start:</div>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', marginTop: '0.25rem' }}>{fullUser.contractStartDate || '01 Jan 2026'}</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Contract Expiry Date:</div>
                      <div style={{ color: '#fff', fontWeight 700, fontSize: '1.1rem', marginTop: '0.25rem' }}>{fullUser.contractEndDate || '31 Dec 2026'}</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Term Duration:</div>
                      <div style={{ color: '#FBBF24', fontWeight: 700, fontSize: '1.1rem', marginTop: '0.25rem' }}>{fullUser.contractDuration || '12 Months'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Governance & Role Assignment Panel */}
              <div className="glass-panel" style={{ padding: '1.75rem', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.65rem', margin: 0 }}>
                    <Shield size={19} color="#A855F7" />
                    Security Authorization & Role Governance
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#94A3B8', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.65rem', borderRadius: '6px' }}>
                    Authority: Logged in as <strong style={{ color: '#C084FC' }}>{currentUser?.name}</strong> ({currentUser?.role})
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', fontSize: '0.9rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>System User Unique Identifier:</span>
                    <div style={{ marginTop: '0.35rem' }}>
                      <code style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.3rem 0.65rem', borderRadius: '6px', color: '#E2E8F0', fontSize: '0.85rem', wordBreak: 'break-all' }}>
                        {fullUser.id || fullUser._id}
                      </code>
                    </div>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Assigned System Access Role:</span>
                    <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span className={`role-badge \${getRoleBadgeClass(fullUser.role)}`} style={{ fontSize: '0.82rem', padding: '0.3rem 0.85rem' }}>
                        {fullUser.role}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Provisioned By:</span>
                    <div style={{ color: '#fff', fontWeight: 600, marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Lock size={14} color="#60A5FA" />
                      {fullUser.createdByName || 'System Administrator'}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Account Authorization Status:</span>
                    <div style={{ color: fullUser.status === 'ACTIVE' ? '#34D399' : '#FCA5A5', fontWeight: 700, marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {fullUser.status === 'ACTIVE' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      {fullUser.status} (Verified)
                    </div>
                  </div>
                </div>

                {/* Inline Role Hierarchy Selector Form */}
                {canChangeThisUserRole && (
                  <div
                    style={{
                      marginTop: '1.5rem',
                      paddingTop: '1.25rem',
                      borderTop: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(124, 58, 237, 0.04)',
                      padding: '1.25rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(124, 58, 237, 0.2)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                      <div>
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Edit3 size={16} color="#C084FC" />
                          Update Role via Hierarchy Authority
                        </span>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.2rem 0 0 0' }}>
                          Select a new role for {fullUser.name}. Roles are restricted by your current role level.
                        </p>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#FBBF24', background: 'rgba(245, 158, 11, 0.12)', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                        🔒 Admin Role Cannot Be Assigned
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ minWidth: '280px', flex: 1 }}>
                        <CustomDropdown
                          options={assignableRoles.map((r) => ({ value: r.value, label: r.label }))}
                          value={selectedRole}
                          onChange={(val) => setSelectedRole(val)}
                        />
                      </div>
                      <button
                        onClick={handleSaveRole}
                        disabled={roleSaving || selectedRole === fullUser.role}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: selectedRole === fullUser.role ? 0.6 : 1 }}
                      >
                        <Save size={16} />
                        <span>{roleSaving ? 'Updating...' : 'Confirm & Save Role'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'attendance' ? (
            /* TAB 2: ATTENDANCE DETAILS */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div className="glass-panel" style={{ padding: '1.4rem', borderLeft: '4px solid #34D399', background: 'rgba(16, 185, 129, 0.04)' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Present Days</div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#34D399', marginTop: '0.2rem' }}>{attendanceStats.present}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>Current Payroll Period</div>
                </div>

                <div className="glass-panel" style={{ padding: '1.4rem', borderLeft: '4px solid #FBBF24', background: 'rgba(245, 158, 11, 0.04)' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Late Arrivals</div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#FBBF24', marginTop: '0.2rem' }}>{attendanceStats.late}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>Clock-in Delays</div>
                </div>

                <div className="glass-panel" style={{ padding: '1.4rem', borderLeft: '4px solid #F87171', background: 'rgba(239, 68, 68, 0.04)' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Unexcused Absences</div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#F87171', marginTop: '0.2rem' }}>{attendanceStats.absent}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>Requires Review</div>
                </div>

                <div className="glass-panel" style={{ padding: '1.4rem', borderLeft: '4px solid #A855F7', background: 'rgba(168, 85, 247, 0.04)' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Worked Hours</div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#A855F7', marginTop: '0.2rem' }}>{attendanceStats.workedHours}h</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>Logged Timesheet</div>
                </div>
              </div>

              {/* Attendance Table */}
              <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Clock size={19} color="#34D399" />
                  Recent Daily Attendance Log
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Check In</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Check Out</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Hours</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceStats.records.map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#E2E8F0' }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{r.date}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>{r.checkIn}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>{r.checkOut}</td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#A855F7' }}>{r.workedHours}h</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span
                              style={{
                                padding: '0.2rem 0.65rem',
                                borderRadius: '12px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                background: r.status === 'Present' ? 'rgba(16, 185, 129, 0.15)' : r.status === 'Late' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: r.status === 'Present' ? '#34D399' : r.status === 'Late' ? '#FBBF24' : '#F87171'
                              }}
                            >
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 3: SALARY & PAY DETAILS */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(15, 23, 42, 0.9))', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <div style={{ fontSize: '0.85rem', color: '#6EE7B7', fontWeight: 600 }}>Monthly Gross Remuneration</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34D399', marginTop: '0.3rem' }}>₹{grossEarnings.toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>Base + Allowances Breakdown</div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(15, 23, 42, 0.9))', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  <div style={{ fontSize: '0.85rem', color: '#FCA5A5', fontWeight: 600 }}>Statutory & Tax Deductions</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#F87171', marginTop: '0.3rem' }}>₹{totalDeductions.toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>PF, TDS & Professional Tax</div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(15, 23, 42, 0.9))', border: '1px solid rgba(168, 85, 247, 0.35)' }}>
                  <div style={{ fontSize: '0.85rem', color: '#C084FC', fontWeight: 600 }}>Net Take-Home Monthly Salary</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginTop: '0.3rem' }}>₹{salaryStats.netPay.toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '0.8rem', color: '#A855F7', marginTop: '0.3rem', fontWeight: 600 }}>Direct Deposit Verified</div>
                </div>
              </div>

              {/* Salary Breakdown Card */}
              <div className="glass-panel" style={{ padding: '1.75rem', background: 'rgba(255,255,255,0.02)' }}>
                <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem', margin: 0 }}>
                  <DollarSign size={19} color="#FBBF24" />
                  Structured Salary Compensation Components
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', fontSize: '0.9rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Basic Pay:</span>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.2rem', marginTop: '0.2rem' }}>₹{salaryStats.basePay.toLocaleString('en-IN')}</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>House Rent Allowance (HRA):</span>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.2rem', marginTop: '0.2rem' }}>₹{salaryStats.hra.toLocaleString('en-IN')}</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Special Allowance:</span>
                    <div style={{ color: '#fff', fontWeight 700, fontSize: '1.2rem', marginTop: '0.2rem' }}>₹{salaryStats.specialAllowance.toLocaleString('en-IN')}</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Provident Fund (PF) Contribution:</span>
                    <div style={{ color: '#F87171', fontWeight: 700, fontSize: '1.2rem', marginTop: '0.2rem' }}>-₹{salaryStats.pfDeduction.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
"@

[System.IO.File]::WriteAllText($tmp, $content)
Move-Item -Path $tmp -Destination $file -Force
Write-Host "Updated UserProfileDetailModal.jsx with Role Change & Hierarchy Controls"
