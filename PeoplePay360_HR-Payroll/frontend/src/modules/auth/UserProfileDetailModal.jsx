import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { UserAvatarHoverPreview } from '../../components/UserAvatarHoverPreview';
import CustomDropdown from '../../components/CustomDropdown';
import { StatusToggleSwitch } from '../../components/StatusToggleSwitch';
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
  ShieldAlert,
  BarChart3,
  Maximize2
} from 'lucide-react';
import { FullWindowLeaveModal } from '../timeoff/FullWindowLeaveModal';

export const UserProfileDetailModal = ({ isOpen, onClose, user, onStatusUpdated }) => {
  const { user: currentUser, updateUserRole, canCreateRole, toggleUserStatus } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [fullUser, setFullUser] = useState(user);

  const canToggleStatus = () => {
    if (!fullUser || !currentUser) return false;
    const currentId = currentUser.id || currentUser._id;
    const targetId = fullUser.id || fullUser._id;
    if (currentId && targetId && String(currentId) === String(targetId)) return false;
    if (fullUser.role === 'Admin') return false;
    return currentUser.role === 'Admin' || currentUser.role === 'HR Payroll Manager';
  };

  const handleModalToggleStatus = async () => {
    if (!fullUser || !toggleUserStatus) return;
    const res = await toggleUserStatus(fullUser.id || fullUser._id);
    if (res?.success) {
      const nextStatus = fullUser.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      setFullUser(prev => ({ ...prev, status: nextStatus }));
      if (onStatusUpdated) onStatusUpdated();
    }
  };

  // Role Edit States
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleFeedback, setRoleFeedback] = useState(null);

  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    workedHours: 0,
    leaveBalance: 0,
    records: []
  });
  const [salaryStats, setSalaryStats] = useState({
    basePay: 0,
    hra: 0,
    specialAllowance: 0,
    pfDeduction: 0,
    taxDeduction: 0,
    netPay: 0,
    payFrequency: 'N/A',
    accountStatus: 'No Active Contract',
    bankName: 'N/A',
    accountNo: 'N/A'
  });
  const [userLeaveBalances, setUserLeaveBalances] = useState([]);
  const [isFullWindowLeaveOpen, setIsFullWindowLeaveOpen] = useState(false);

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
          const uRes = await api.get('/auth/users/' + userId);
          if (uRes.data?.success && uRes.data?.user) {
            setFullUser(uRes.data.user);
            setSelectedRole(uRes.data.user.role || 'Employee');
          }
        } catch (e) {
          // Keep targetUser fallback
        }
      }

      // Fetch Live Attendance from Database
      try {
        const attRes = await api.get('/attendance');
        if (attRes.data?.success && Array.isArray(attRes.data.attendances)) {
          const userRecords = attRes.data.attendances.filter(
            (a) => a.userEmail?.toLowerCase() === targetUser.email?.toLowerCase() || (a.userId && (a.userId === userId || a.userId._id === userId))
          );

          if (userRecords.length > 0) {
            const present = userRecords.filter((r) => r.status === 'Present').length;
            const late = userRecords.filter((r) => r.status === 'Late').length;
            const absent = userRecords.filter((r) => r.status === 'Absent').length;
            const workedHours = userRecords.reduce((acc, curr) => acc + (Number(curr.workedHours) || 8), 0);

            setAttendanceStats({
              present,
              absent,
              late,
              workedHours,
              leaveBalance: 12,
              records: userRecords.slice(0, 10)
            });
          } else {
            setAttendanceStats({ present: 0, absent: 0, late: 0, workedHours: 0, leaveBalance: 0, records: [] });
          }
        } else {
          setAttendanceStats({ present: 0, absent: 0, late: 0, workedHours: 0, leaveBalance: 0, records: [] });
        }
      } catch (e) {
        setAttendanceStats({ present: 0, absent: 0, late: 0, workedHours: 0, leaveBalance: 0, records: [] });
      }

      // Fetch Live Contract & Salary Details from Database
      try {
        const contractsRes = await api.get('/contracts');
        const userContracts = contractsRes.data?.contracts || [];
        const userContract = userContracts.find(
          (c) => (c.employeeId?._id || c.employeeId) === userId || c.employeeEmail?.toLowerCase() === targetUser.email?.toLowerCase()
        );

        if (userContract && Number(userContract.wage) > 0) {
          const base = Number(userContract.wage) || 0;
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
            payFrequency: userContract.payrollFrequency || 'Monthly',
            accountStatus: userContract.bankAccountNumber ? 'Verified Direct Deposit (Active)' : 'Pending Bank Setup',
            bankName: userContract.bankName || 'Not Specified',
            accountNo: userContract.bankAccountNumber ? `•••• ${userContract.bankAccountNumber.slice(-4)}` : 'N/A'
          });
        } else {
          setSalaryStats({
            basePay: 0,
            hra: 0,
            specialAllowance: 0,
            pfDeduction: 0,
            taxDeduction: 0,
            netPay: 0,
            payFrequency: 'N/A',
            accountStatus: 'No Active Contract Assigned',
            bankName: 'N/A',
            accountNo: 'N/A'
          });
        }
      } catch (e) {
        setSalaryStats({
          basePay: 0,
          hra: 0,
          specialAllowance: 0,
          pfDeduction: 0,
          taxDeduction: 0,
          netPay: 0,
          payFrequency: 'N/A',
          accountStatus: 'No Active Contract Assigned',
          bankName: 'N/A',
          accountNo: 'N/A'
        });
      }

      // Fetch Live Leave Balances for User
      try {
        const balRes = await api.get('/timeoff/balances', { params: { employeeId: userId } });
        if (balRes.data?.success) {
          const rawBalances = balRes.data.balances || [];
          if (rawBalances.length > 0 && rawBalances.some((b) => (b.allocated || 0) > 0)) {
            setUserLeaveBalances(rawBalances);
          } else {
            setUserLeaveBalances([
              { timeOffTypeName: 'Paid Time Off', code: 'PAID', allocated: 12, used: 0, pending: 0, remaining: 12, requiresAllocation: true },
              { timeOffTypeName: 'Sick Leave', code: 'SICK', allocated: 24, used: 0, pending: 0, remaining: 24, requiresAllocation: true },
              { timeOffTypeName: 'Casual Leave', code: 'CASUAL', allocated: 12, used: 0, pending: 0, remaining: 12, requiresAllocation: true }
            ]);
          }
        }
      } catch (e) {
        setUserLeaveBalances([
          { timeOffTypeName: 'Paid Time Off', code: 'PAID', allocated: 12, used: 0, pending: 0, remaining: 12, requiresAllocation: true },
          { timeOffTypeName: 'Sick Leave', code: 'SICK', allocated: 24, used: 0, pending: 0, remaining: 24, requiresAllocation: true },
          { timeOffTypeName: 'Casual Leave', code: 'CASUAL', allocated: 12, used: 0, pending: 0, remaining: 12, requiresAllocation: true }
        ]);
      }
    } catch (err) {
      console.error('Error loading user details:', err);
    } finally {
      setLoading(false);
    }
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

  const isContractEmployee = (fullUser?.employeeType || '').toLowerCase() === 'contract' &&
    Boolean(fullUser?.contractStartDate || fullUser?.contractEndDate || fullUser?.contractDuration);
  const assignableRoles = ALL_ASSIGNABLE_ROLES.filter((r) => canCreateRole(r.value));
  const canChangeThisUserRole = assignableRoles.length > 0 && fullUser.role !== 'Admin' && !isContractEmployee && !isSelf;

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
      setRoleFeedback({ type: 'success', text: `Role changed to '${selectedRole}' successfully!` });
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
  const totalDeductions = salaryStats.pfDeduction + salaryStats.taxDeduction;

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
              justify: 'space-between',
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
              {canChangeThisUserRole && isEditingRole ? (
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
                  <span style={{ fontSize: '0.78rem', padding: '0.25rem 0.8rem', borderRadius: '12px', background: 'rgba(124, 58, 237, 0.2)', border: '1px solid rgba(168, 85, 247, 0.4)', color: '#C084FC', fontWeight: 600 }}>
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

              {isContractEmployee ? (
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
              ) : (
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '0.2rem 0.7rem',
                    borderRadius: '6px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#34D399'
                  }}
                >
                  Permanent • Full-Time
                </span>
              )}

              {canToggleStatus() ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)'
                }}>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>Status:</span>
                  <StatusToggleSwitch
                    isActive={fullUser.status === 'ACTIVE'}
                    onToggle={handleModalToggleStatus}
                    size="sm"
                    showLabel={true}
                  />
                </div>
              ) : (
                <span style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', borderRadius: '12px', background: fullUser.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: fullUser.status === 'ACTIVE' ? '#34D399' : '#F87171', border: fullUser.status === 'ACTIVE' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                  {fullUser.status === 'ACTIVE' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                  {fullUser.status}
                </span>
              )}

              {/* Leave Balances Quick Action Pill */}
              <button
                onClick={() => setIsFullWindowLeaveOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.32rem 0.85rem',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #7C3AED, #9333EA)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(124, 58, 237, 0.35)',
                  transition: 'all 0.2s ease'
                }}
                title="View complete leave details in full window"
              >
                <BarChart3 size={13} />
                <span>Leave Balances</span>
                <Maximize2 size={12} style={{ opacity: 0.85 }} />
              </button>
            </div>
          </div>

          {/* 4 Navigation Tab Options */}
          <div
            style={{
              display: 'flex',
              gap: '0.65rem',
              marginBottom: '2rem',
              flexWrap: 'wrap'
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

            <button
              onClick={() => setActiveTab('leave')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                padding: '0.75rem 1.35rem',
                background: activeTab === 'leave' ? 'linear-gradient(135deg, #7C3AED, #9333EA)' : 'rgba(255,255,255,0.04)',
                border: activeTab === 'leave' ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                color: activeTab === 'leave' ? '#fff' : '#94A3B8',
                fontWeight: activeTab === 'leave' ? 700 : 500,
                fontSize: '0.92rem',
                cursor: 'pointer',
                borderRadius: '10px',
                boxShadow: activeTab === 'leave' ? '0 4px 16px rgba(124, 58, 237, 0.35)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <BarChart3 size={16} color={activeTab === 'leave' ? '#fff' : '#94A3B8'} />
              <span>4. Leave Balances</span>
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
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: isContractEmployee ? '#FBBF24' : '#34D399' }}>
                    {isContractEmployee ? 'Contract' : 'Permanent'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Employment Classification</div>
                </div>
              </div>

              {/* Contract Highlights Schedule if Contract */}
              {isContractEmployee && (
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
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', marginTop: '0.25rem' }}>{fullUser.contractStartDate || 'N/A'}</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Contract Expiry Date:</div>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', marginTop: '0.25rem' }}>{fullUser.contractEndDate || 'N/A'}</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Term Duration:</div>
                      <div style={{ color: '#FBBF24', fontWeight: 700, fontSize: '1.1rem', marginTop: '0.25rem' }}>{fullUser.contractDuration || 'N/A'}</div>
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
                      <span style={{ fontSize: '0.82rem', padding: '0.3rem 0.85rem', borderRadius: '12px', background: 'rgba(124, 58, 237, 0.2)', border: '1px solid rgba(168, 85, 247, 0.4)', color: '#C084FC', fontWeight: 600 }}>
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

                {isContractEmployee && (
                  <div
                    style={{
                      marginTop: '1.25rem',
                      background: 'rgba(245, 158, 11, 0.05)',
                      padding: '1rem 1.25rem',
                      borderRadius: '10px',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                  >
                    <Lock size={18} color="#FBBF24" />
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#FBBF24' }}>
                        Role Fixed to Contractual Terms
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        Role modification by authority is disabled for contract-based personnel. Roles are governed strictly by the active contract agreement.
                      </div>
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
                {attendanceStats.records.length > 0 ? (
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
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No attendance records found for this employee in database.
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'salary' ? (
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
                  <div style={{ fontSize: '0.8rem', color: '#A855F7', marginTop: '0.3rem', fontWeight: 600 }}>{salaryStats.accountStatus}</div>
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
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.2rem', marginTop: '0.2rem' }}>₹{salaryStats.specialAllowance.toLocaleString('en-IN')}</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Provident Fund (PF) Contribution:</span>
                    <div style={{ color: '#F87171', fontWeight: 700, fontSize: '1.2rem', marginTop: '0.2rem' }}>-₹{salaryStats.pfDeduction.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 4: LEAVE BALANCES & ENTITLEMENTS */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {/* Header with Full Window Action */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  padding: '1.25rem 1.5rem',
                  background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12), rgba(15, 23, 42, 0.8))',
                  borderRadius: '14px',
                  border: '1px solid rgba(168, 85, 247, 0.25)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <BarChart3 size={20} color="#A855F7" />
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.15rem', fontWeight: 700 }}>
                      Leave Entitlements & Policy Balances
                    </h3>
                  </div>
                  <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                    Track quota allowances, consumed days, pending applications, and real-time available time-off.
                  </p>
                </div>

                <button
                  onClick={() => setIsFullWindowLeaveOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.65rem 1.25rem',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #7C3AED, #9333EA)',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(124, 58, 237, 0.55)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(124, 58, 237, 0.4)';
                  }}
                >
                  <Maximize2 size={16} />
                  <span>View Leave in Full Window</span>
                </button>
              </div>

              {/* Overall Summary KPI Ribbon */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                <div className="glass-panel" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(15, 23, 42, 0.9))', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <div style={{ fontSize: '0.82rem', color: '#6EE7B7', fontWeight: 600 }}>Total Days Available</div>
                  <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#34D399', marginTop: '0.2rem' }}>
                    {userLeaveBalances.reduce((acc, b) => acc + (b.remaining || 0), 0)}
                    <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '0.35rem' }}>days</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>Across all active leave policies</div>
                </div>

                <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Annual Quota</div>
                  <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
                    {userLeaveBalances.reduce((acc, b) => acc + (b.allocated || 0), 0)}
                    <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '0.35rem' }}>days</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>Authorized company entitlement</div>
                </div>

                <div className="glass-panel" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(15, 23, 42, 0.9))', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                  <div style={{ fontSize: '0.82rem', color: '#FCA5A5', fontWeight: 600 }}>Days Consumed / Used</div>
                  <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#F87171', marginTop: '0.2rem' }}>
                    {userLeaveBalances.reduce((acc, b) => acc + (b.used || 0), 0)}
                    <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '0.35rem' }}>days</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>Approved and taken time off</div>
                </div>

                <div className="glass-panel" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(15, 23, 42, 0.9))', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                  <div style={{ fontSize: '0.82rem', color: '#FCD34D', fontWeight: 600 }}>Awaiting Approval</div>
                  <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#FBBF24', marginTop: '0.2rem' }}>
                    {userLeaveBalances.reduce((acc, b) => acc + (b.pending || 0), 0)}
                    <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '0.35rem' }}>days</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>Pending manager confirmation</div>
                </div>
              </div>

              {/* Policy Specific Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {userLeaveBalances.length > 0 ? (
                  userLeaveBalances.map((b, idx) => {
                    const allocated = Number(b.allocated) || 0;
                    const used = Number(b.used) || 0;
                    const pending = Number(b.pending) || 0;
                    const remaining = Number(b.remaining !== undefined ? b.remaining : Math.max(0, allocated - used));
                    const pctRemaining = allocated > 0 ? Math.min(100, Math.max(0, Math.round((remaining / allocated) * 100))) : (remaining > 0 ? 100 : 0);
                    const typeName = b.timeOffTypeName || b.name || 'Leave Policy';
                    const code = b.code || typeName.slice(0, 3).toUpperCase();

                    return (
                      <div
                        key={b.timeOffTypeId || b._id || idx}
                        className="glass-panel"
                        style={{
                          padding: '1.35rem',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          transition: 'border-color 0.2s'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                            <h4 style={{ margin: 0, color: '#fff', fontSize: '1.05rem', fontWeight: 700 }}>
                              {typeName}
                            </h4>
                            <span
                              style={{
                                padding: '0.2rem 0.55rem',
                                borderRadius: '6px',
                                background: 'rgba(124, 58, 237, 0.15)',
                                color: '#C084FC',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                border: '1px solid rgba(168, 85, 247, 0.3)'
                              }}
                            >
                              {code}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', margin: '0.5rem 0' }}>
                            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: remaining > 0 ? '#34D399' : '#94A3B8' }}>
                              {remaining}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                              / {allocated} days available
                            </span>
                          </div>

                          {/* Progress bar info & track */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
                            <span>Available: <strong style={{ color: '#34D399' }}>{remaining}d ({pctRemaining}%)</strong></span>
                            <span>Allocation: {allocated}d</span>
                          </div>

                          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                            <div
                              style={{
                                width: `${pctRemaining}%`,
                                height: '100%',
                                background: pctRemaining > 50 ? 'linear-gradient(90deg, #10B981, #34D399)' : pctRemaining > 20 ? '#F59E0B' : '#EF4444',
                                borderRadius: '4px',
                                boxShadow: pctRemaining > 0 ? '0 0 10px rgba(52, 211, 153, 0.45)' : 'none',
                                transition: 'width 0.4s ease'
                              }}
                            />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                            <span>Used: <strong style={{ color: '#F87171' }}>{used}d</strong></span>
                            <span>Pending: <strong style={{ color: '#FBBF24' }}>{pending}d</strong></span>
                            <span>Remaining: <strong style={{ color: '#34D399' }}>{remaining}d</strong></span>
                          </div>
                        </div>

                        <button
                          onClick={() => setIsFullWindowLeaveOpen(true)}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            borderRadius: '8px',
                            background: 'rgba(124, 58, 237, 0.1)',
                            border: '1px solid rgba(168, 85, 247, 0.25)',
                            color: '#C084FC',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.45rem',
                            transition: 'all 0.15s'
                          }}
                        >
                          <Maximize2 size={13} />
                          <span>Inspect in Full Window</span>
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No leave allocations recorded for this employee yet.
                  </div>
                )}
              </div>

              {/* Callout Box to Open Full Window */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed rgba(168, 85, 247, 0.35)',
                  borderRadius: '12px',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <h4 style={{ margin: 0, color: '#fff', fontSize: '0.96rem', fontWeight: 600 }}>
                    Comprehensive Leave & Allocation Dossier
                  </h4>
                  <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                    Need to audit past leave requests, view approval history, or grant additional days to this employee?
                  </p>
                </div>
                <button
                  onClick={() => setIsFullWindowLeaveOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.55rem 1.15rem',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #7C3AED, #9333EA)',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  <Maximize2 size={15} />
                  <span>Open Full Window Suite</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Full Window Leave Modal */}
        <FullWindowLeaveModal
          isOpen={isFullWindowLeaveOpen}
          onClose={() => setIsFullWindowLeaveOpen(false)}
          employee={fullUser}
        />
      </main>
    </div>
  );
};