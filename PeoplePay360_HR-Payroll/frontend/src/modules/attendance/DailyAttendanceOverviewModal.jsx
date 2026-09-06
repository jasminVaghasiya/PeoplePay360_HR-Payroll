import React, { useState, useEffect, useMemo } from 'react';
import { UserDisplayCell } from '../../components/UserDisplayCell';
import {
  X,
  Calendar,
  Clock,
  Search,
  Filter,
  LayoutGrid,
  List,
  UserCheck,
  UserX,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  User,
  ExternalLink,
  ShieldCheck,
  Briefcase,
  Mail,
  Award,
  ArrowLeft,
  DollarSign,
  Building
} from 'lucide-react';

export const DailyAttendanceOverviewModal = ({
  isOpen,
  onClose,
  selectedDate,
  allAttendances = [],
  allEmployees = [],
  attendanceConfig = null,
  onSelectEmployee
}) => {
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [hoveredUser, setHoveredUser] = useState(null);
  const [hoverTimeout, setHoverTimeout] = useState(null);

  // Detail Sub-View State for clicked user
  const [selectedUserForDetail, setSelectedUserForDetail] = useState(null);

  useEffect(() => {
    setSelectedUserForDetail(null);
  }, [selectedDate, isOpen]);

  // Full detailed profile for currently selected user
  const detailedUserProfile = useMemo(() => {
    if (!selectedUserForDetail) return null;
    const empMatch = allEmployees.find(
      (e) =>
        (e.id && selectedUserForDetail.employeeId && e.id.toString() === selectedUserForDetail.employeeId.toString()) ||
        (e._id && selectedUserForDetail.employeeId && e._id.toString() === selectedUserForDetail.employeeId.toString()) ||
        (e.email && selectedUserForDetail.employeeEmail && e.email.toLowerCase() === selectedUserForDetail.employeeEmail.toLowerCase())
    );

    return {
      ...empMatch,
      ...selectedUserForDetail,
      name: selectedUserForDetail.employeeName || empMatch?.name,
      email: selectedUserForDetail.employeeEmail || empMatch?.email,
      department: selectedUserForDetail.department || empMatch?.department,
      jobPosition: selectedUserForDetail.jobPosition || empMatch?.jobPosition,
      role: empMatch?.role || 'Employee',
      salary: empMatch?.salary || 50000,
      employeeType: empMatch?.employeeType || 'Permanent',
      status: empMatch?.status || 'ACTIVE',
      photo: empMatch?.photo || selectedUserForDetail.avatar,
      contractStartDate: empMatch?.contractStartDate,
      contractEndDate: empMatch?.contractEndDate,
      contractDuration: empMatch?.contractDuration
    };
  }, [selectedUserForDetail, allEmployees]);

  // Complete attendance history for the selected user
  const userAttendanceLogs = useMemo(() => {
    if (!selectedUserForDetail) return [];
    const empId = selectedUserForDetail.employeeId?.toString();
    const empEmail = selectedUserForDetail.employeeEmail?.toLowerCase().trim();
    return allAttendances
      .filter((a) =>
        (empId && a.employeeId && a.employeeId.toString() === empId) ||
        (empEmail && a.employeeEmail && a.employeeEmail.toLowerCase().trim() === empEmail)
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [selectedUserForDetail, allAttendances]);

  // Aggregate stats for this user
  const userStats = useMemo(() => {
    const present = userAttendanceLogs.filter((a) => a.status === 'Present').length;
    const late = userAttendanceLogs.filter((a) => a.status === 'Late').length;
    const absent = userAttendanceLogs.filter((a) => a.status === 'Absent').length;
    const totalHours = userAttendanceLogs.reduce((acc, a) => acc + (Number(a.workedHours) || 0), 0).toFixed(1);
    const overtimeHours = userAttendanceLogs.reduce((acc, a) => acc + (Number(a.overtimeHours) || 0), 0).toFixed(1);
    return { present, late, absent, totalHours, overtimeHours, totalLogs: userAttendanceLogs.length };
  }, [userAttendanceLogs]);

  if (!isOpen || !selectedDate) return null;

  // Format date nicely (e.g. Saturday, 5 September 2026)
  const formattedDate = new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Filter records for the selected date
  const dayRecords = allAttendances.filter((a) => a.date === selectedDate);

  // Combine employees list with day records
  const employeeDayList = (allEmployees.length > 0 ? allEmployees : dayRecords).map((emp) => {
    const empIdStr = emp.id || emp._id;
    const empEmail = emp.email || emp.employeeEmail;
    const empName = emp.name || emp.employeeName;
    const empDept = emp.department || 'General';
    const empRole = emp.jobPosition || emp.role || 'Employee';

    const record = dayRecords.find(
      (r) =>
        (r.employeeId && r.employeeId.toString() === empIdStr?.toString()) ||
        (r.employeeEmail && r.employeeEmail.toLowerCase() === empEmail?.toLowerCase())
    );

    const dayOfWeek = new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
    const isWeeklyOff = (attendanceConfig?.weeklyOffDays || ['Sunday']).includes(dayOfWeek);
    const isCustomHoliday = attendanceConfig?.holidays?.some((h) => h.date === selectedDate);
    const isOffOrHoliday = isWeeklyOff || isCustomHoliday;

    let status = record?.status;
    if (!status) {
      status = isOffOrHoliday ? 'Holiday' : 'Absent';
    }

    return {
      employeeId: empIdStr,
      employeeName: empName,
      employeeEmail: empEmail,
      department: empDept,
      jobPosition: empRole,
      avatar: emp.avatar || emp.photo || null,
      record: record || null,
      status,
      checkIn: record?.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--',
      checkOut: record?.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--',
      workedHours: record?.workedHours || 0,
      overtimeHours: record?.overtimeHours || 0
    };
  });

  // Unique departments for filter
  const departments = Array.from(new Set(employeeDayList.map((e) => e.department).filter(Boolean)));

  // Filtered List
  const filteredList = employeeDayList.filter((item) => {
    const matchesSearch =
      !search ||
      item.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
      item.employeeEmail?.toLowerCase().includes(search.toLowerCase()) ||
      item.department?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = !statusFilter || item.status === statusFilter;
    const matchesDept = !deptFilter || item.department === deptFilter;

    return matchesSearch && matchesStatus && matchesDept;
  });

  // Status Metrics for Header Cards
  const presentCount = employeeDayList.filter((i) => i.status === 'Present').length;
  const lateCount = employeeDayList.filter((i) => i.status === 'Late').length;
  const absentCount = employeeDayList.filter((i) => i.status === 'Absent').length;
  const holidayCount = employeeDayList.filter((i) => i.status === 'Holiday').length;

  const handleMouseEnter = (item) => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    const timeout = setTimeout(() => {
      setHoveredUser(item);
    }, 300);
    setHoverTimeout(timeout);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setHoveredUser(null);
  };

  const getBadgeStyle = (st) => {
    switch (st) {
      case 'Present':
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: 'rgba(16, 185, 129, 0.4)' };
      case 'Late':
        return { bg: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24', border: 'rgba(245, 158, 11, 0.4)' };
      case 'Absent':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#FCA5A5', border: 'rgba(239, 68, 68, 0.4)' };
      case 'Holiday':
        return { bg: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', border: 'rgba(59, 130, 246, 0.4)' };
      case 'Overtime':
      case 'Half Day':
        return { bg: 'rgba(168, 85, 247, 0.15)', color: '#C084FC', border: 'rgba(168, 85, 247, 0.4)' };
      default:
        return { bg: 'rgba(156, 163, 175, 0.15)', color: '#9CA3AF', border: 'rgba(156, 163, 175, 0.4)' };
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'Admin':
        return { background: 'rgba(239, 68, 68, 0.15)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.3)' };
      case 'HR Payroll Manager':
      case 'HR Manager':
        return { background: 'rgba(168, 85, 247, 0.15)', color: '#C084FC', border: '1px solid rgba(168, 85, 247, 0.3)' };
      case 'HOD':
      case 'Manager':
        return { background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', border: '1px solid rgba(59, 130, 246, 0.3)' };
      default:
        return { background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)' };
    }
  };

  return (
    <div className="modal-overlay fade-in" style={{ zIndex: 1100 }}>
      <div
        className="modal-content glass-panel"
        style={{
          maxWidth: '1100px',
          width: '94%',
          padding: '2rem',
          maxHeight: '92vh',
          overflowY: 'auto',
          position: 'relative'
        }}
      >
        {/* VIEW 1: DEDICATED USER INFO & ATTENDANCE DETAILS VIEW */}
        {selectedUserForDetail && detailedUserProfile ? (
          <div className="fade-in">
            {/* Top Navigation Bar with Prominent Backward Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              paddingBottom: '1rem'
            }}>
              <button
                onClick={() => setSelectedUserForDetail(null)}
                className="btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.55rem 1.1rem',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  background: 'rgba(124, 58, 237, 0.15)',
                  border: '1px solid rgba(124, 58, 237, 0.45)',
                  color: '#C084FC',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Back to Daily Overview Table"
              >
                <ArrowLeft size={17} />
                <span>Back to Daily Overview</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Overview Date: <strong style={{ color: '#fff' }}>{formattedDate}</strong>
                </span>
                <button
                  onClick={onClose}
                  className="btn-icon"
                  style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}
                  title="Close Window"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Profile Info Card Header */}
            <div className="glass-panel" style={{
              padding: '1.5rem',
              marginBottom: '1.5rem',
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(17, 23, 38, 0.98) 100%)',
              border: '1px solid rgba(124, 58, 237, 0.35)',
              borderRadius: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                  {detailedUserProfile.photo ? (
                    <img
                      src={detailedUserProfile.photo}
                      alt={detailedUserProfile.name}
                      style={{ width: '68px', height: '68px', borderRadius: '16px', objectFit: 'cover', border: '2px solid rgba(167, 139, 250, 0.5)' }}
                    />
                  ) : (
                    <div style={{
                      width: '68px',
                      height: '68px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.6rem',
                      fontWeight: 800,
                      color: '#fff',
                      border: '2px solid rgba(167, 139, 250, 0.5)',
                      boxShadow: '0 8px 20px rgba(124, 58, 237, 0.3)'
                    }}>
                      {(detailedUserProfile.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                        {detailedUserProfile.name}
                      </h2>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '8px', ...getRoleBadgeStyle(detailedUserProfile.role) }}>
                        {detailedUserProfile.role}
                      </span>
                      <span className={`status-badge ${(detailedUserProfile.status || 'ACTIVE').toLowerCase()}`} style={{ fontSize: '0.72rem' }}>
                        {detailedUserProfile.status || 'ACTIVE'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '0.4rem', flexWrap: 'wrap', fontSize: '0.85rem', color: '#94A3B8' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Mail size={13} /> {detailedUserProfile.email}</span>
                      <span>&bull;</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Building size={13} /> {detailedUserProfile.department}</span>
                      <span>&bull;</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Briefcase size={13} /> {detailedUserProfile.jobPosition}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Employment Type</div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: detailedUserProfile.employeeType === 'Contract' ? '#FBBF24' : '#34D399' }}>
                      {detailedUserProfile.employeeType || 'Permanent'}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Monthly Base Salary</div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#34D399' }}>
                      ₹{Number(detailedUserProfile.salary || 50000).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Highlighted Status on Selected Date */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#A78BFA', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Attendance Record On {formattedDate} ({selectedDate})
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.6rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Check In: </span>
                    <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{selectedUserForDetail.checkIn}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Check Out: </span>
                    <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{selectedUserForDetail.checkOut}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Worked Hours: </span>
                    <strong style={{ color: '#C084FC', fontSize: '0.95rem' }}>{selectedUserForDetail.workedHours} hrs</strong>
                  </div>
                </div>
              </div>

              <span style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                padding: '0.4rem 1.1rem',
                borderRadius: '14px',
                background: getBadgeStyle(selectedUserForDetail.status).bg,
                color: getBadgeStyle(selectedUserForDetail.status).color,
                border: `1px solid ${getBadgeStyle(selectedUserForDetail.status).border}`
              }}>
                Status: {selectedUserForDetail.status}
              </span>
            </div>

            {/* Attendance Summary Performance KPIs for this user */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.9rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '10px', borderLeft: '3px solid #7C3AED' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Records</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>{userStats.totalLogs}</div>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.8rem', borderRadius: '10px', borderLeft: '3px solid #10B981' }}>
                <div style={{ fontSize: '0.7rem', color: '#34D399' }}>Present Days</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10B981' }}>{userStats.present}</div>
              </div>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.8rem', borderRadius: '10px', borderLeft: '3px solid #F59E0B' }}>
                <div style={{ fontSize: '0.7rem', color: '#FBBF24' }}>Late Days</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F59E0B' }}>{userStats.late}</div>
              </div>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.8rem', borderRadius: '10px', borderLeft: '3px solid #EF4444' }}>
                <div style={{ fontSize: '0.7rem', color: '#FCA5A5' }}>Absent Days</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#EF4444' }}>{userStats.absent}</div>
              </div>
              <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '0.8rem', borderRadius: '10px', borderLeft: '3px solid #A855F7' }}>
                <div style={{ fontSize: '0.7rem', color: '#C084FC' }}>Total Worked</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#C084FC' }}>{userStats.totalHours} hrs</div>
              </div>
            </div>

            {/* Attendance History Logs Table */}
            <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} color="#A78BFA" /> Attendance History for {detailedUserProfile.name}
            </h3>

            {userAttendanceLogs.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                No prior attendance history recorded for this employee.
              </div>
            ) : (
              <div className="data-table-container" style={{ maxHeight: '340px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Worked Hours</th>
                      <th>Overtime</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userAttendanceLogs.map((log) => {
                      const logBadge = getBadgeStyle(log.status);
                      const isCurrentSelectedDate = log.date === selectedDate;
                      return (
                        <tr
                          key={log._id || log.id || log.date}
                          style={{
                            background: isCurrentSelectedDate ? 'rgba(124, 58, 237, 0.12)' : 'transparent',
                            borderLeft: isCurrentSelectedDate ? '3px solid #7C3AED' : 'none'
                          }}
                        >
                          <td style={{ fontWeight: 600, color: isCurrentSelectedDate ? '#C084FC' : '#fff' }}>
                            {log.date} {isCurrentSelectedDate && <span style={{ fontSize: '0.7rem', color: '#A78BFA', marginLeft: '0.4rem' }}>(Viewing)</span>}
                          </td>
                          <td>{log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</td>
                          <td>{log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</td>
                          <td style={{ fontWeight: 600, color: '#C084FC' }}>{log.workedHours || 0} hrs</td>
                          <td>{log.overtimeHours || 0} hrs</td>
                          <td>
                            <span style={{ fontSize: '0.76rem', fontWeight: 600, padding: '0.15rem 0.55rem', borderRadius: '10px', background: logBadge.bg, color: logBadge.color, border: `1px solid ${logBadge.border}` }}>
                              {log.status}
                            </span>
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
          /* VIEW 2: DAILY OVERVIEW LIST / TABLE */
          <>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Calendar color="#A78BFA" size={24} />
                  Daily Attendance Overview
                </h2>
                <div style={{ fontSize: '0.9rem', color: '#A78BFA', fontWeight: 600, marginTop: '0.2rem' }}>
                  {formattedDate} ({selectedDate})
                </div>
              </div>
              <button onClick={onClose} className="btn-icon" style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            {/* Summary Metric Badges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem 1rem', borderRadius: '10px', borderLeft: '4px solid #7C3AED' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Tracked</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{employeeDayList.length}</div>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.8rem 1rem', borderRadius: '10px', borderLeft: '4px solid #10B981' }}>
                <div style={{ fontSize: '0.75rem', color: '#34D399' }}>Present</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10B981' }}>{presentCount}</div>
              </div>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.8rem 1rem', borderRadius: '10px', borderLeft: '4px solid #F59E0B' }}>
                <div style={{ fontSize: '0.75rem', color: '#FBBF24' }}>Late</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F59E0B' }}>{lateCount}</div>
              </div>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.8rem 1rem', borderRadius: '10px', borderLeft: '4px solid #EF4444' }}>
                <div style={{ fontSize: '0.75rem', color: '#FCA5A5' }}>Absent</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#EF4444' }}>{absentCount}</div>
              </div>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.8rem 1rem', borderRadius: '10px', borderLeft: '4px solid #3B82F6' }}>
                <div style={{ fontSize: '0.75rem', color: '#60A5FA' }}>Holidays / Off</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#60A5FA' }}>{holidayCount}</div>
              </div>
            </div>

            {/* Filters and View Controls Bar */}
            <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', flex: 1 }}>
                {/* Search Input */}
                <div style={{ position: 'relative', minWidth: '240px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search employee or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.2rem', borderRadius: '8px', background: '#111726', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ padding: '0.55rem 0.8rem', borderRadius: '8px', background: '#111726', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.85rem' }}
                >
                  <option value="">All Statuses</option>
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Absent">Absent</option>
                  <option value="Holiday">Holiday</option>
                  <option value="Overtime">Overtime</option>
                  <option value="Half Day">Half Day</option>
                </select>

                {/* Department Filter */}
                {departments.length > 0 && (
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    style={{ padding: '0.55rem 0.8rem', borderRadius: '8px', background: '#111726', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.85rem' }}
                  >
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* View Mode Switcher (Table vs Card Grid) */}
              <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(255,255,255,0.05)', padding: '0.3rem', borderRadius: '8px' }}>
                <button
                  onClick={() => setViewMode('table')}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: viewMode === 'table' ? '#7C3AED' : 'transparent',
                    color: viewMode === 'table' ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.82rem',
                    fontWeight: 600
                  }}
                >
                  <List size={16} /> Table View
                </button>

                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: viewMode === 'grid' ? '#7C3AED' : 'transparent',
                    color: viewMode === 'grid' ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.82rem',
                    fontWeight: 600
                  }}
                >
                  <LayoutGrid size={16} /> Card View
                </button>
              </div>
            </div>

            {/* Hover Floating Card */}
            {hoveredUser && (
              <div
                className="glass-panel fade-in"
                style={{
                  position: 'fixed',
                  bottom: '2.5rem',
                  right: '2.5rem',
                  width: '320px',
                  padding: '1.2rem',
                  zIndex: 1200,
                  background: '#111726',
                  border: '1px solid rgba(167, 139, 250, 0.5)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                  borderRadius: '14px',
                  pointerEvents: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.8rem' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '1rem'
                    }}
                  >
                    {hoveredUser.employeeName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{hoveredUser.employeeName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{hoveredUser.jobPosition} &bull; {hoveredUser.department}</div>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div><Mail size={13} /> {hoveredUser.employeeEmail}</div>
                  <div><Clock size={13} /> Check-In: <strong style={{ color: '#fff' }}>{hoveredUser.checkIn}</strong> | Check-Out: <strong style={{ color: '#fff' }}>{hoveredUser.checkOut}</strong></div>
                  <div><Award size={13} /> Worked: <strong style={{ color: '#C084FC' }}>{hoveredUser.workedHours} hrs</strong></div>
                  <div style={{ marginTop: '0.4rem' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.25rem 0.6rem',
                        borderRadius: '12px',
                        background: getBadgeStyle(hoveredUser.status).bg,
                        color: getBadgeStyle(hoveredUser.status).color,
                        border: `1px solid ${getBadgeStyle(hoveredUser.status).border}`
                      }}
                    >
                      Status: {hoveredUser.status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Display Content: Table View vs Card Grid View */}
            {filteredList.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No attendance records found for {selectedDate} matching your filters.
              </div>
            ) : viewMode === 'table' ? (
              /* TABLE VIEW */
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Worked Hours</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.map((item) => {
                      const badge = getBadgeStyle(item.status);
                      return (
                        <tr
                          key={item.employeeId || item.employeeEmail}
                          onMouseEnter={() => handleMouseEnter(item)}
                          onMouseLeave={handleMouseLeave}
                          onClick={() => setSelectedUserForDetail(item)}
                          style={{ cursor: 'pointer', transition: 'background 0.2s ease' }}
                          title="Click to view full employee profile and attendance history"
                        >
                          <td>
                            <UserDisplayCell
                              name={item.employeeName}
                              email={item.employeeEmail}
                              photo={item.avatar}
                              size={34}
                            />
                          </td>
                          <td>{item.department}</td>
                          <td>{item.checkIn}</td>
                          <td>{item.checkOut}</td>
                          <td style={{ fontWeight: 600, color: '#C084FC' }}>{item.workedHours} hrs</td>
                          <td>
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '12px', background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                              {item.status}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUserForDetail(item);
                              }}
                              className="btn-secondary"
                              style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                              title="Inspect full logs & profile"
                            >
                              <span>All Logs</span> <ExternalLink size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* CARD GRID VIEW */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.2rem' }}>
                {filteredList.map((item) => {
                  const badge = getBadgeStyle(item.status);
                  return (
                    <div
                      key={item.employeeId || item.employeeEmail}
                      onMouseEnter={() => handleMouseEnter(item)}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => setSelectedUserForDetail(item)}
                      className="glass-panel"
                      style={{
                        padding: '1.2rem',
                        borderRadius: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        border: '1px solid rgba(255,255,255,0.08)'
                      }}
                      title="Click to view full employee profile and attendance history"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                        <UserDisplayCell
                          name={item.employeeName}
                          subtitle={item.department}
                          photo={item.avatar}
                          size={38}
                        />

                        <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '12px', background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                          {item.status}
                        </span>
                      </div>

                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.8rem' }}>
                        <div>
                          <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>Check In</div>
                          <div style={{ color: '#fff', fontWeight: 600 }}>{item.checkIn}</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>Check Out</div>
                          <div style={{ color: '#fff', fontWeight: 600 }}>{item.checkOut}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Worked: <strong style={{ color: '#C084FC' }}>{item.workedHours} hrs</strong></span>
                        <span style={{ color: '#A78BFA', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          View History &rarr;
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
