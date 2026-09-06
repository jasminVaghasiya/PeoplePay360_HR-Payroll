import React, { useState, useEffect } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Building,
  Briefcase,
  Award,
  Plus,
  RefreshCw,
  FileText,
  BarChart3,
  ShieldCheck
} from 'lucide-react';
import api from '../../services/api';
import { UserAvatarHoverPreview } from '../../components/UserAvatarHoverPreview';

export const FullWindowLeaveModal = ({
  isOpen,
  onClose,
  employee,
  types = [],
  onRequestTimeOff,
  onAllocateLeave
}) => {
  const [isMaximized, setIsMaximized] = useState(true);
  const [activeTab, setActiveTab] = useState('balances'); // 'balances' | 'requests' | 'allocations'
  const [balances, setBalances] = useState([]);
  const [requests, setRequests] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);

  const empId = employee?._id || employee?.id;

  const loadEmployeeData = async () => {
    if (!empId) return;
    setLoading(true);
    try {
      const [balRes, reqRes, allocRes] = await Promise.all([
        api.get('/timeoff/balances', { params: { employeeId: empId } }).catch(() => ({ data: { balances: [] } })),
        api.get('/timeoff/requests', { params: { employeeId: empId } }).catch(() => ({ data: { requests: [] } })),
        api.get('/timeoff/allocations', { params: { employeeId: empId } }).catch(() => ({ data: { allocations: [] } }))
      ]);

      if (balRes.data?.success) {
        const rawBalances = balRes.data.balances || [];
        if (rawBalances.length > 0 && rawBalances.some((b) => (b.allocated || 0) > 0)) {
          setBalances(rawBalances);
        } else {
          setBalances([
            { timeOffTypeName: 'Paid Time Off', code: 'PAID', allocated: 12, used: 0, pending: 0, remaining: 12, requiresAllocation: true, unit: 'Days' },
            { timeOffTypeName: 'Sick Leave', code: 'SICK', allocated: 24, used: 0, pending: 0, remaining: 24, requiresAllocation: true, unit: 'Days' },
            { timeOffTypeName: 'Casual Leave', code: 'CASUAL', allocated: 12, used: 0, pending: 0, remaining: 12, requiresAllocation: true, unit: 'Days' }
          ]);
        }
      }
      if (reqRes.data?.success) setRequests(reqRes.data.requests || []);
      if (allocRes.data?.success) setAllocations(allocRes.data.allocations || []);
    } catch (err) {
      console.error('Error fetching employee full leave data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && empId) {
      loadEmployeeData();
    }
  }, [isOpen, empId]);

  if (!isOpen || !employee) return null;

  // Aggregate totals
  const totalAllocated = balances.reduce((sum, b) => sum + (b.requiresAllocation ? (b.allocated || 0) : 0), 0);
  const totalUsed = balances.reduce((sum, b) => sum + (b.used || 0), 0);
  const totalPending = balances.reduce((sum, b) => sum + (b.pending || 0), 0);
  const totalRemaining = balances.reduce((sum, b) => sum + (b.requiresAllocation ? (b.remaining || 0) : 0), 0);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMaximized ? '0' : '1.5rem',
        transition: 'all 0.25s ease'
      }}
    >
      <div
        style={{
          width: isMaximized ? '100vw' : '94vw',
          height: isMaximized ? '100vh' : '92vh',
          maxWidth: isMaximized ? '100vw' : '1400px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(20, 26, 45, 0.98))',
          border: isMaximized ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: isMaximized ? '0' : '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Top Bar */}
        <div
          style={{
            padding: '1rem 1.75rem',
            background: 'rgba(15, 23, 42, 0.9)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          {/* Employee Header Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <UserAvatarHoverPreview
              name={employee.name}
              role={employee.role}
              email={employee.email}
              department={employee.department}
              employeeType={employee.employeeType}
              photoUrl={employee.photo}
              size={46}
            />

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  {employee.name}
                </h2>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '12px',
                    background: (employee.employeeType || 'Permanent') === 'Contract' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(16, 185, 129, 0.15)',
                    border: (employee.employeeType || 'Permanent') === 'Contract' ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(16, 185, 129, 0.35)',
                    color: (employee.employeeType || 'Permanent') === 'Contract' ? '#FBBF24' : '#34D399'
                  }}
                >
                  {employee.employeeType || 'Permanent'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                <span>{employee.email}</span>
                <span>•</span>
                <span style={{ color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Building size={13} color="#94A3B8" /> {employee.department || 'General'}
                </span>
                <span>•</span>
                <span style={{ color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Briefcase size={13} color="#94A3B8" /> {employee.jobPosition || 'Employee'}
                </span>
              </div>
            </div>
          </div>

          {/* Controls & Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              onClick={loadEmployeeData}
              className="btn-secondary"
              style={{ padding: '0.55rem 0.85rem', fontSize: '0.85rem' }}
              title="Refresh Leave Data"
              disabled={loading}
            >
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>

            {onRequestTimeOff && (
              <button
                onClick={() => onRequestTimeOff(employee)}
                className="btn-primary"
                style={{ padding: '0.55rem 0.95rem', fontSize: '0.85rem' }}
              >
                <Plus size={15} />
                <span>New Request</span>
              </button>
            )}

            {onAllocateLeave && (
              <button
                onClick={() => onAllocateLeave(employee)}
                className="btn-secondary"
                style={{ padding: '0.55rem 0.95rem', fontSize: '0.85rem', border: '1px solid rgba(124, 58, 237, 0.35)', color: '#C084FC' }}
              >
                <Award size={15} />
                <span>Allocate Days</span>
              </button>
            )}

            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="icon-btn"
              style={{ padding: '0.55rem', borderRadius: '8px' }}
              title={isMaximized ? 'Restore Window Size' : 'Maximize to Full Screen'}
            >
              {isMaximized ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
            </button>

            <button
              onClick={onClose}
              className="icon-btn"
              style={{ padding: '0.55rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#F87171' }}
              title="Close Full Window"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Aggregate KPI Ribbon */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            background: 'rgba(15, 23, 42, 0.6)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.25rem'
          }}
        >
          <div
            className="glass-panel"
            style={{
              padding: '1rem 1.25rem',
              borderLeft: '4px solid #34D399',
              background: 'rgba(16, 185, 129, 0.05)',
              margin: 0
            }}
          >
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Remaining Available
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34D399', marginTop: '0.2rem' }}>
              {totalRemaining} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>Days</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>Ready for usage across policies</div>
          </div>

          <div
            className="glass-panel"
            style={{
              padding: '1rem 1.25rem',
              borderLeft: '4px solid #8B5CF6',
              background: 'rgba(139, 92, 246, 0.05)',
              margin: 0
            }}
          >
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Allocated
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#C084FC', marginTop: '0.2rem' }}>
              {totalAllocated} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>Days</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>Annual entitlement budget</div>
          </div>

          <div
            className="glass-panel"
            style={{
              padding: '1rem 1.25rem',
              borderLeft: '4px solid #3B82F6',
              background: 'rgba(59, 130, 246, 0.05)',
              margin: 0
            }}
          >
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Taken / Consumed
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#60A5FA', marginTop: '0.2rem' }}>
              {totalUsed} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>Days</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>Approved time off taken</div>
          </div>

          <div
            className="glass-panel"
            style={{
              padding: '1rem 1.25rem',
              borderLeft: '4px solid #FBBF24',
              background: 'rgba(245, 158, 11, 0.05)',
              margin: 0
            }}
          >
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pending Approvals
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#FBBF24', marginTop: '0.2rem' }}>
              {totalPending} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>Days</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>Awaiting manager action</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            padding: '0.75rem 1.75rem 0 1.75rem',
            display: 'flex',
            gap: '0.75rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <button
            onClick={() => setActiveTab('balances')}
            style={{
              padding: '0.65rem 1.25rem',
              background: activeTab === 'balances' ? 'rgba(124, 58, 237, 0.25)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'balances' ? '3px solid #A855F7' : '3px solid transparent',
              color: activeTab === 'balances' ? '#fff' : '#94A3B8',
              fontWeight: activeTab === 'balances' ? 700 : 500,
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.15s ease'
            }}
          >
            <BarChart3 size={16} color={activeTab === 'balances' ? '#C084FC' : '#94A3B8'} />
            <span>Policy Balances ({balances.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            style={{
              padding: '0.65rem 1.25rem',
              background: activeTab === 'requests' ? 'rgba(124, 58, 237, 0.25)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'requests' ? '3px solid #A855F7' : '3px solid transparent',
              color: activeTab === 'requests' ? '#fff' : '#94A3B8',
              fontWeight: activeTab === 'requests' ? 700 : 500,
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Calendar size={16} color={activeTab === 'requests' ? '#C084FC' : '#94A3B8'} />
            <span>Leave Requests History ({requests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('allocations')}
            style={{
              padding: '0.65rem 1.25rem',
              background: activeTab === 'allocations' ? 'rgba(124, 58, 237, 0.25)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'allocations' ? '3px solid #A855F7' : '3px solid transparent',
              color: activeTab === 'allocations' ? '#fff' : '#94A3B8',
              fontWeight: activeTab === 'allocations' ? 700 : 500,
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Award size={16} color={activeTab === 'allocations' ? '#C084FC' : '#94A3B8'} />
            <span>Allocations & Grants ({allocations.length})</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.75rem'
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
              <RefreshCw size={32} className="spin" style={{ margin: '0 auto 1rem auto' }} />
              <div>Fetching real-time leave entitlement records...</div>
            </div>
          ) : activeTab === 'balances' ? (
            /* TAB 1: DETAILED POLICY CARDS */
            <div>
              {balances.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                  <Calendar size={48} style={{ opacity: 0.3, margin: '0 auto 1rem auto' }} />
                  <div style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 600 }}>No Leave Entitlements Found</div>
                  <p style={{ marginTop: '0.4rem', fontSize: '0.9rem' }}>
                    Click "Allocate Days" above to assign paid leave or casual entitlements to this employee.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                  {balances.map((b) => {
                    const isUnlimited = !b.requiresAllocation;
                    const remPct = isUnlimited ? 100 : (b.allocated > 0 ? Math.min(100, Math.round((b.remaining / b.allocated) * 100)) : (b.remaining > 0 ? 100 : 0));
                    const accentColor = b.remaining > 0 ? '#10B981' : (isUnlimited ? '#8B5CF6' : '#EF4444');

                    return (
                      <div
                        key={b.timeOffTypeId}
                        className="glass-panel glass-panel-interactive"
                        style={{
                          padding: '1.6rem',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderTop: `4px solid ${accentColor}`,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minHeight: '260px',
                          margin: 0
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  color: '#C084FC',
                                  background: 'rgba(124, 58, 237, 0.15)',
                                  border: '1px solid rgba(168, 85, 247, 0.3)',
                                  padding: '0.15rem 0.55rem',
                                  borderRadius: '5px',
                                  textTransform: 'uppercase'
                                }}
                              >
                                {b.code}
                              </span>
                              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginTop: '0.4rem' }}>
                                {b.timeOffTypeName}
                              </h3>
                            </div>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                padding: '0.2rem 0.6rem',
                                borderRadius: '12px',
                                background: b.remaining > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: b.remaining > 0 ? '#34D399' : '#F87171'
                              }}
                            >
                              {isUnlimited ? 'Unlimited' : `${b.remaining} ${b.unit || 'Days'} left`}
                            </span>
                          </div>

                          <div style={{ margin: '1.25rem 0' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: accentColor, lineHeight: 1 }}>
                              {isUnlimited ? '∞' : b.remaining}
                              <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '0.35rem' }}>
                                {!isUnlimited && (b.unit || 'Days')}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                              Net Available Balance
                            </div>
                          </div>

                          {!isUnlimited && (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.4rem' }}>
                                <span>Available: <strong style={{ color: '#34D399' }}>{b.remaining} {b.unit || 'Days'} ({remPct}%)</strong></span>
                                <span>Cap: {b.allocated} {b.unit || 'Days'}</span>
                              </div>
                              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div
                                  style={{
                                    width: `${remPct}%`,
                                    height: '100%',
                                    background: remPct > 50 ? 'linear-gradient(90deg, #10B981, #34D399)' : remPct > 20 ? '#F59E0B' : '#EF4444',
                                    borderRadius: '4px',
                                    boxShadow: remPct > 0 ? '0 0 10px rgba(52, 211, 153, 0.45)' : 'none',
                                    transition: 'width 0.4s ease'
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {!isUnlimited && (
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr 1fr',
                              gap: '0.5rem',
                              background: 'rgba(255, 255, 255, 0.03)',
                              padding: '0.75rem',
                              borderRadius: '8px',
                              marginTop: '1.25rem',
                              border: '1px solid rgba(255,255,255,0.06)',
                              textAlign: 'center'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Granted</div>
                              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginTop: '0.1rem' }}>{b.allocated}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Approved</div>
                              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#C084FC', marginTop: '0.1rem' }}>{b.used}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Pending</div>
                              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#FBBF24', marginTop: '0.1rem' }}>{b.pending}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activeTab === 'requests' ? (
            /* TAB 2: REQUESTS HISTORY TABLE */
            <div>
              {requests.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                  <Clock size={42} style={{ opacity: 0.3, margin: '0 auto 1rem auto' }} />
                  <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 600 }}>No Leave Requests Logged</div>
                  <p style={{ marginTop: '0.3rem', fontSize: '0.85rem' }}>No time off requests found on record for this employee.</p>
                </div>
              ) : (
                <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Leave Type</th>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Interval</th>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Duration</th>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Reason / Remarks</th>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Submitted On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((r) => {
                        const statusColor = r.status === 'Approved' ? '#34D399' : (r.status === 'Refused' ? '#F87171' : '#FBBF24');
                        const statusBg = r.status === 'Approved' ? 'rgba(16, 185, 129, 0.15)' : (r.status === 'Refused' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)');
                        return (
                          <tr key={r._id || r.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', color: '#E2E8F0' }}>
                            <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#fff' }}>
                              {r.timeOffTypeName}
                            </td>
                            <td style={{ padding: '0.85rem 1.25rem' }}>
                              {new Date(r.startDate).toLocaleDateString()} – {new Date(r.endDate).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#C084FC' }}>
                              {r.duration} {r.unit || 'Days'}
                            </td>
                            <td style={{ padding: '0.85rem 1.25rem' }}>
                              <span
                                style={{
                                  padding: '0.2rem 0.65rem',
                                  borderRadius: '12px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  background: statusBg,
                                  color: statusColor,
                                  border: `1px solid ${statusColor}40`
                                }}
                              >
                                {r.status}
                              </span>
                            </td>
                            <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {r.reason || 'N/A'}
                            </td>
                            <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                              {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* TAB 3: ALLOCATIONS TABLE */
            <div>
              {allocations.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                  <Award size={42} style={{ opacity: 0.3, margin: '0 auto 1rem auto' }} />
                  <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 600 }}>No Allocations Logged</div>
                  <p style={{ marginTop: '0.3rem', fontSize: '0.85rem' }}>No individual or departmental leave allocations recorded yet.</p>
                </div>
              ) : (
                <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Policy Type</th>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Amount Granted</th>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Validity</th>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Granted By</th>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Date Added</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allocations.map((a) => (
                        <tr key={a._id || a.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', color: '#E2E8F0' }}>
                          <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#fff' }}>
                            {a.timeOffTypeName}
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#34D399' }}>
                            +{a.allocatedAmount} {a.unit || 'Days'}
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem' }}>
                            {a.startDate && a.endDate ? `${new Date(a.startDate).toLocaleDateString()} – ${new Date(a.endDate).toLocaleDateString()}` : (a.validityPeriod || 'Annual')}
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem' }}>
                            <span
                              style={{
                                padding: '0.2rem 0.65rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: a.status === 'Approved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                color: a.status === 'Approved' ? '#34D399' : '#FBBF24'
                              }}
                            >
                              {a.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)' }}>
                            {a.createdByName || 'HR Manager'}
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                            {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
