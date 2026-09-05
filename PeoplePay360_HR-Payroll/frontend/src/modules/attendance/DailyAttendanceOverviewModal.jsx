import React, { useState } from 'react';
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
  AlertTriangle,
  User,
  ExternalLink,
  ShieldCheck,
  Briefcase,
  Mail,
  Award
} from 'lucide-react';

export const DailyAttendanceOverviewModal = ({
  isOpen,
  onClose,
  selectedDate,
  allAttendances = [],
  allEmployees = [],
  onSelectEmployee
}) => {
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [hoveredUser, setHoveredUser] = useState(null);
  const [hoverTimeout, setHoverTimeout] = useState(null);

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

    const isSunday = new Date(`${selectedDate}T00:00:00`).getDay() === 0;

    let status = record?.status;
    if (!status) {
      status = isSunday ? 'Holiday' : 'Absent';
    }

    return {
      employeeId: empIdStr,
      employeeName: empName,
      employeeEmail: empEmail,
      department: empDept,
      jobPosition: empRole,
      avatar: emp.avatar || null,
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
  const overtimeCount = employeeDayList.filter((i) => i.status === 'Overtime' || i.status === 'Half Day').length;

  const handleMouseEnter = (item) => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    const timeout = setTimeout(() => {
      setHoveredUser(item);
    }, 300); // Smooth 300ms hover activation
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

        {/* Floating 1.5s Hover Info Card Preview */}
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
              <div><Mail size={13} inline /> {hoveredUser.employeeEmail}</div>
              <div><Clock size={13} inline /> Check-In: <strong style={{ color: '#fff' }}>{hoveredUser.checkIn}</strong> | Check-Out: <strong style={{ color: '#fff' }}>{hoveredUser.checkOut}</strong></div>
              <div><Award size={13} inline /> Worked: <strong style={{ color: '#C084FC' }}>{hoveredUser.workedHours} hrs</strong></div>
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
                      onClick={() => {
                        onClose();
                        if (onSelectEmployee) onSelectEmployee(item);
                      }}
                      style={{ cursor: 'pointer', transition: 'background 0.2s ease' }}
                    >
                      <td>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{item.employeeName}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{item.employeeEmail}</div>
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
                          className="btn-secondary"
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
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
                  onClick={() => {
                    onClose();
                    if (onSelectEmployee) onSelectEmployee(item);
                  }}
                  className="glass-panel"
                  style={{
                    padding: '1.2rem',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.95rem'
                        }}
                      >
                        {item.employeeName?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff' }}>{item.employeeName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{item.department}</div>
                      </div>
                    </div>

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
      </div>
    </div>
  );
};
