import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import CustomDropdown from '../../components/CustomDropdown';
import {
  Clock,
  Play,
  Square,
  CheckCircle,
  AlertTriangle,
  Calendar,
  BarChart2,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  UserCheck,
  UserX,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Settings
} from 'lucide-react';
import { AttendanceFormModal } from './AttendanceFormModal';
import { AttendanceCorrectionModal } from './AttendanceCorrectionModal';
import { AttendanceDetailModal } from './AttendanceDetailModal';
import { AttendanceSettingsModal } from './AttendanceSettingsModal';
import { DailyAttendanceOverviewModal } from './DailyAttendanceOverviewModal';

export const AttendanceModule = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('my'); // 'my' | 'records' | 'corrections' | 'summary' | 'calendar'

  // Data States
  const [attendances, setAttendances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [todayStatus, setTodayStatus] = useState(null);
  const [attendanceConfig, setAttendanceConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Modals State
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedRecordForEdit, setSelectedRecordForEdit] = useState(null);

  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [selectedRecordForCorrection, setSelectedRecordForCorrection] = useState(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState(null);

  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [dailyOverviewModalOpen, setDailyOverviewModalOpen] = useState(false);

  // Live Digital Clock State
  const [currentTime, setCurrentTime] = useState(new Date());

  const isAuthorized = ['Admin', 'HR Payroll Manager', 'HR Manager', 'HOD', 'Manager'].includes(user?.role);
  const isHr = isAuthorized;

  useEffect(() => {
    if (!isAuthorized && ['records', 'corrections', 'summary'].includes(activeTab)) {
      setActiveTab('my');
    }
  }, [isAuthorized, activeTab]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Today Status
      const todayRes = await api.get('/attendance/today');
      if (todayRes.data.success) {
        setTodayStatus(todayRes.data);
      }

      // 2. Fetch Attendance Records List
      const listParams = {};
      if (search) listParams.search = search;
      if (statusFilter) listParams.status = statusFilter;
      if (deptFilter) listParams.department = deptFilter;
      if (employeeFilter) listParams.employeeId = employeeFilter;
      if (startDateFilter) listParams.startDate = startDateFilter;
      if (endDateFilter) listParams.endDate = endDateFilter;

      const listRes = await api.get('/attendance', { params: listParams });
      if (listRes.data.success) {
        setAttendances(listRes.data.attendances);
      }

      // 3. Fetch Summary Metrics
      const summaryRes = await api.get('/attendance/summary', { params: listParams });
      if (summaryRes.data.success) {
        setSummary(summaryRes.data.summary);
      }

      // 4. Fetch Employees list for Authorized users
      if (isAuthorized) {
        const empRes = await api.get('/auth/users');
        if (empRes.data.users) {
          setEmployees(empRes.data.users);
        }
      }

      // 5. Fetch Attendance Settings / Config
      try {
        const configRes = await api.get('/attendance/settings');
        if (configRes.data.success) {
          setAttendanceConfig(configRes.data.config);
        }
      } catch (configErr) {
        console.error('[Attendance Config Load Error]', configErr);
      }
    } catch (err) {
      console.error('[Attendance Module Load Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [search, statusFilter, deptFilter, employeeFilter, startDateFilter, endDateFilter, activeTab]);

  // Action: Check In
  const handleCheckIn = async () => {
    try {
      const res = await api.post('/attendance/check-in', { notes: 'Web Kiosk Check-In' });
      if (res.data.success) {
        await loadAllData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Check-in failed');
    }
  };

  // Action: Check Out
  const handleCheckOut = async () => {
    try {
      const res = await api.post('/attendance/check-out', { breakHours: 1.0 });
      if (res.data.success) {
        await loadAllData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Check-out failed');
    }
  };

  // Action: Create / Edit Attendance Record
  const handleSaveAttendance = async (payload, recordId) => {
    try {
      let res;
      if (recordId) {
        res = await api.put(`/attendance/${recordId}`, payload);
      } else {
        res = await api.post('/attendance', payload);
      }
      if (res.data.success) {
        await loadAllData();
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Save failed' };
    }
  };

  // Action: Delete Attendance Record
  const handleDeleteAttendance = async (id) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) return;
    try {
      const res = await api.delete(`/attendance/${id}`);
      if (res.data.success) {
        await loadAllData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete record');
    }
  };

  // Action: Request Correction
  const handleRequestCorrection = async (id, data) => {
    try {
      const res = await api.post(`/attendance/${id}/correction`, data);
      if (res.data.success) {
        await loadAllData();
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Request failed' };
    }
  };

  // Action: Approve Correction
  const handleApproveCorrection = async (id, data) => {
    try {
      const res = await api.post(`/attendance/corrections/${id}/approve`, data);
      if (res.data.success) {
        await loadAllData();
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Approval failed' };
    }
  };

  // Action: Reject Correction
  const handleRejectCorrection = async (id, data) => {
    try {
      const res = await api.post(`/attendance/corrections/${id}/reject`, data);
      if (res.data.success) {
        await loadAllData();
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Rejection failed' };
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      'Present': { class: 'active', color: '#10B981', label: 'Present' },
      'Late': { class: 'pending', color: '#F59E0B', label: 'Late' },
      'Absent': { class: 'inactive', color: '#EF4444', label: 'Absent' },
      'Half Day': { class: 'pending', color: '#3B82F6', label: 'Half Day' },
      'Overtime': { class: 'active', color: '#A855F7', label: 'Overtime' },
      'Missing Check-Out': { class: 'inactive', color: '#F43F5E', label: 'Missing Punch' },
      'Corrected': { class: 'active', color: '#60A5FA', label: 'Corrected' }
    };
    const item = map[status] || { class: 'pending', color: '#9CA3AF', label: status };
    return (
      <span className={`status-badge ${item.class}`} style={{ fontSize: '0.78rem' }}>
        {status === 'Present' && <CheckCircle size={12} />}
        {status === 'Late' && <Clock size={12} />}
        {status === 'Missing Check-Out' && <AlertTriangle size={12} />}
        {item.label}
      </span>
    );
  };

  // Corrections list filtering
  const correctionRequests = attendances.filter(
    (a) => ['Requested', 'Approved', 'Refused'].includes(a.correctionStatus)
  );

  const formatElapsedTime = (checkInIso) => {
    if (!checkInIso) return '00h 00m 00s';
    const checkInMs = new Date(checkInIso).getTime();
    const diffMs = Math.max(0, currentTime.getTime() - checkInMs);
    const totalSecs = Math.floor(diffMs / 1000);
    const hrs = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSecs % 60).padStart(2, '0');
    return `${hrs}h ${mins}m ${secs}s`;
  };

  const formatHoursNice = (hoursNum) => {
    if (!hoursNum || hoursNum <= 0) return '00h 00m 00s';
    const hrs = String(Math.floor(hoursNum)).padStart(2, '0');
    const totalMins = (hoursNum - Math.floor(hoursNum)) * 60;
    const mins = String(Math.floor(totalMins)).padStart(2, '0');
    const secs = String(Math.round((totalMins - Math.floor(totalMins)) * 60)).padStart(2, '0');
    return `${hrs}h ${mins}m ${secs}s`;
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Module Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Clock color="#7C3AED" size={28} />
            Attendance & Schedule Operations
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Real-time Check-In/Out kiosk, Worked Hours calculation, Late detection, and HR Correction Workflow.
          </p>
        </div>

        {isHr && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setSettingsModalOpen(true)}
              className="btn-secondary"
              style={{ padding: '0.75rem 1.25rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Settings size={18} />
              <span>Schedule & Holiday Settings</span>
            </button>
            <button
              onClick={() => {
                setSelectedRecordForEdit(null);
                setFormModalOpen(true);
              }}
              className="btn-primary"
              style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}
            >
              <Plus size={18} />
              <span>Manual Attendance Entry</span>
            </button>
          </div>
        )}
      </div>

      {/* Sub Navigation Bar Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('my')}
          className={`sidebar-link ${activeTab === 'my' ? 'active' : ''}`}
          style={{ width: 'auto', padding: '0.6rem 1.2rem', borderRadius: '8px', fontSize: '0.9rem' }}
        >
          <Clock size={18} />
          <span>My Attendance</span>
        </button>

        {isAuthorized && (
          <>
            <button
              onClick={() => setActiveTab('records')}
              className={`sidebar-link ${activeTab === 'records' ? 'active' : ''}`}
              style={{ width: 'auto', padding: '0.6rem 1.2rem', borderRadius: '8px', fontSize: '0.9rem' }}
            >
              <FileText size={18} />
              <span>Attendance Records</span>
            </button>

            <button
              onClick={() => setActiveTab('corrections')}
              className={`sidebar-link ${activeTab === 'corrections' ? 'active' : ''}`}
              style={{ width: 'auto', padding: '0.6rem 1.2rem', borderRadius: '8px', fontSize: '0.9rem' }}
            >
              <AlertCircle size={18} />
              <span>Attendance Corrections ({correctionRequests.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('summary')}
              className={`sidebar-link ${activeTab === 'summary' ? 'active' : ''}`}
              style={{ width: 'auto', padding: '0.6rem 1.2rem', borderRadius: '8px', fontSize: '0.9rem' }}
            >
              <BarChart2 size={18} />
              <span>Attendance Summary</span>
            </button>
          </>
        )}

        <button
          onClick={() => setActiveTab('calendar')}
          className={`sidebar-link ${activeTab === 'calendar' ? 'active' : ''}`}
          style={{ width: 'auto', padding: '0.6rem 1.2rem', borderRadius: '8px', fontSize: '0.9rem' }}
        >
          <Calendar size={18} />
          <span>{isAuthorized ? 'Attendance Calendar' : 'Attendance Schedule & Calendar'}</span>
        </button>
      </div>

      {/* TAB 1: MY ATTENDANCE (KIOSK & TODAY'S STATUS) */}
      {activeTab === 'my' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Interactive Check-In/Check-Out Kiosk */}
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', position: 'relative' }}>
              <div style={{ fontSize: '0.82rem', color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '0.3rem' }}>
                Personal Web Kiosk
              </div>
              <h2 style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 700, marginBottom: '0.8rem' }}>
                {user?.name}
              </h2>

              {/* Local Clock & Date Header Badge */}
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.04)', padding: '0.4rem 0.9rem', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Clock size={14} color="#A78BFA" />
                <span>Local Time: {currentTime.toLocaleTimeString()} | {currentTime.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>

              {/* PROMINENT WORK TIMER DISPLAY */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '0.5rem' }}>
                  ⏱️ WORK TIMER / SHIFT DURATION
                </div>

                {todayStatus?.isCheckedIn ? (
                  <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', padding: '1.25rem', borderRadius: '16px' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#10B981', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                      {formatElapsedTime(todayStatus.record.checkIn)}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#34D399', fontWeight: 600, marginTop: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 8px #10B981' }}></span>
                      Active Shift — Checked In at {new Date(todayStatus.record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ) : todayStatus?.isCheckedOut ? (
                  <div style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.35)', padding: '1.25rem', borderRadius: '16px' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#60A5FA', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                      {formatHoursNice(todayStatus.record.workedHours)}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#93C5FD', fontWeight: 600, marginTop: '0.4rem' }}>
                      ✓ Day Finalized — Worked {todayStatus.record.workedHours} hrs today ({todayStatus.record.status})
                    </div>
                  </div>
                ) : (
                  <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)', padding: '1.25rem', borderRadius: '16px' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#F59E0B', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                      00h 00m 00s
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#FBBF24', fontWeight: 600, marginTop: '0.4rem' }}>
                      ⏳ Shift Not Started — Click CHECK IN NOW to start work timer
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                {!todayStatus?.isCheckedIn && !todayStatus?.isCheckedOut && (
                  <button
                    onClick={handleCheckIn}
                    className="btn-primary"
                    style={{ padding: '0.9rem 2.5rem', fontSize: '1.05rem', background: 'linear-gradient(135deg, #10B981, #059669)' }}
                  >
                    <Play size={20} />
                    <span>CHECK IN NOW</span>
                  </button>
                )}

                {todayStatus?.isCheckedIn && (
                  <button
                    onClick={handleCheckOut}
                    className="btn-primary"
                    style={{ padding: '0.9rem 2.5rem', fontSize: '1.05rem', background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}
                  >
                    <Square size={20} />
                    <span>CHECK OUT NOW</span>
                  </button>
                )}

                {todayStatus?.isCheckedOut && (
                  <button
                    disabled
                    className="btn-secondary"
                    style={{ padding: '0.9rem 2.5rem', fontSize: '1.05rem', opacity: 0.6, cursor: 'not-allowed' }}
                  >
                    <span>ATTENDANCE COMPLETED TODAY</span>
                  </button>
                )}
              </div>
            </div>

            {/* Today's Metrics Card */}
            <div className="glass-panel" style={{ padding: '1.8rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', pb: '0.5rem' }}>
                  Today's Attendance Summary
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Scheduled Hours</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>8.00 hrs</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Worked Hours</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#C084FC' }}>
                      {todayStatus?.record?.workedHours ? `${todayStatus.record.workedHours} hrs` : '0.00 hrs'}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Overtime Hours</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#FBBF24' }}>
                      {todayStatus?.record?.overtimeHours ? `${todayStatus.record.overtimeHours} hrs` : '0.00 hrs'}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Late Minutes</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#FCA5A5' }}>
                      {todayStatus?.record?.lateMinutes ? `${todayStatus.record.lateMinutes} mins` : '0 mins'}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px' }}>
                Standard Schedule: Mon-Fri (09:00 AM - 06:00 PM).
              </div>
            </div>
          </div>

          {/* Personal Logs Table */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem' }}>Personal Attendance History</h3>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Worked Hrs</th>
                    <th>Overtime</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attendances
                    .filter((a) => a.employeeEmail?.toLowerCase() === user?.email?.toLowerCase())
                    .map((log) => (
                      <tr key={log._id || log.id}>
                        <td style={{ fontWeight: 600, color: '#fff' }}>{log.date}</td>
                        <td>{log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</td>
                        <td>{log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</td>
                        <td style={{ fontWeight: 600, color: '#C084FC' }}>{log.workedHours || 0} hrs</td>
                        <td>{log.overtimeHours || 0} hrs</td>
                        <td>{getStatusBadge(log.status)}</td>
                        <td>
                          <button
                            onClick={() => {
                              setSelectedRecordForDetail(log);
                              setDetailModalOpen(true);
                            }}
                            className="btn-secondary"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE RECORDS (LIST VIEW TABLE) */}
      {activeTab === 'records' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          {/* Filters Control Bar */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', minWidth: '260px', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search employee name, department, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.8rem 0.65rem 2.4rem', borderRadius: '8px', background: '#111726', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
              />
            </div>

            <div style={{ minWidth: '170px' }}>
              <CustomDropdown
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'Present', label: 'Present' },
                  { value: 'Late', label: 'Late' },
                  { value: 'Absent', label: 'Absent' },
                  { value: 'Half Day', label: 'Half Day' },
                  { value: 'Overtime', label: 'Overtime' },
                  { value: 'Missing Check-Out', label: 'Missing Check-Out' },
                  { value: 'Corrected', label: 'Corrected' }
                ]}
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                placeholder="All Statuses"
              />
            </div>

            <input
              type="date"
              placeholder="Start Date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              style={{ padding: '0.65rem 0.8rem', borderRadius: '8px', background: '#111726', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
            />

            <input
              type="date"
              placeholder="End Date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              style={{ padding: '0.65rem 0.8rem', borderRadius: '8px', background: '#111726', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
            />

            {isAuthorized && (
              <div style={{ minWidth: '200px' }}>
                <CustomDropdown
                  options={[
                    { value: '', label: 'All Employees' },
                    ...employees.map((emp) => ({
                      value: emp.id || emp._id,
                      label: `${emp.name} (${emp.department || 'General'})`
                    }))
                  ]}
                  value={employeeFilter}
                  onChange={(val) => setEmployeeFilter(val)}
                  placeholder="All Employees"
                />
              </div>
            )}

            {(search || statusFilter || deptFilter || employeeFilter || startDateFilter || endDateFilter) && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setDeptFilter('');
                  setEmployeeFilter('');
                  setStartDateFilter('');
                  setEndDateFilter('');
                }}
                className="btn-secondary"
                style={{ padding: '0.65rem 1rem' }}
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Records Table */}
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Worked Hours</th>
                  <th>Overtime</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attendances.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No attendance records found matching the current filters.
                    </td>
                  </tr>
                ) : (
                  attendances.map((rec) => (
                    <tr key={rec._id || rec.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{rec.employeeName}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                          {rec.department || 'General'} &bull; {rec.employeeEmail}
                        </div>
                      </td>
                      <td style={{ fontWeight: 500 }}>{rec.date}</td>
                      <td>{rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</td>
                      <td>{rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</td>
                      <td style={{ fontWeight: 600, color: '#C084FC' }}>{rec.workedHours || 0} hrs</td>
                      <td>{rec.overtimeHours || 0} hrs</td>
                      <td>{getStatusBadge(rec.status)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => {
                              setSelectedRecordForDetail(rec);
                              setDetailModalOpen(true);
                            }}
                            className="btn-secondary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem' }}
                            title="Inspect details"
                          >
                            Details
                          </button>
                          {isHr && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedRecordForEdit(rec);
                                  setFormModalOpen(true);
                                }}
                                className="btn-secondary"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem' }}
                                title="Edit record"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteAttendance(rec._id || rec.id)}
                                className="btn-danger-outline"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem' }}
                                title="Delete record"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE CORRECTIONS WORKFLOW */}
      {activeTab === 'corrections' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle color="#FBBF24" size={22} />
            Attendance Corrections Review Dashboard
          </h3>

          {correctionRequests.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No attendance correction requests filed yet.
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Current Status</th>
                    <th>Correction Request</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {correctionRequests.map((req) => (
                    <tr key={req._id || req.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{req.employeeName}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{req.employeeEmail}</div>
                      </td>
                      <td>{req.date}</td>
                      <td>{getStatusBadge(req.status)}</td>
                      <td style={{ fontSize: '0.85rem' }}>
                        <div>In: {req.correctedCheckIn ? new Date(req.correctedCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unchanged'}</div>
                        <div>Out: {req.correctedCheckOut ? new Date(req.correctedCheckOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unchanged'}</div>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: '#E5E7EB', fontStyle: 'italic', maxWidth: '240px' }}>
                        &quot;{req.correctionReason}&quot;
                      </td>
                      <td>
                        <span className={`role-badge ${req.correctionStatus === 'Approved' ? 'admin' : req.correctionStatus === 'Refused' ? 'employee' : 'hr-manager'}`}>
                          {req.correctionStatus}
                        </span>
                      </td>
                      <td>
                        {isHr && req.correctionStatus === 'Requested' ? (
                          <button
                            onClick={() => {
                              setSelectedRecordForCorrection(req);
                              setCorrectionModalOpen(true);
                            }}
                            className="btn-primary"
                            style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
                          >
                            Review Request
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                            {req.correctedBy ? `Reviewed by ${req.correctedBy}` : 'Finalized'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ATTENDANCE SUMMARY METRICS */}
      {activeTab === 'summary' && summary && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem', marginBottom: '2rem' }}>
            <div className="glass-panel" style={{ padding: '1.2rem', borderLeft: '4px solid #10B981' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Present Days</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10B981', marginTop: '0.2rem' }}>{summary.presentDays}</div>
            </div>

            <div className="glass-panel" style={{ padding: '1.2rem', borderLeft: '4px solid #F59E0B' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Late Days</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F59E0B', marginTop: '0.2rem' }}>{summary.lateDays}</div>
            </div>

            <div className="glass-panel" style={{ padding: '1.2rem', borderLeft: '4px solid #EF4444' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Absent Days</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#EF4444', marginTop: '0.2rem' }}>{summary.absentDays}</div>
            </div>

            <div className="glass-panel" style={{ padding: '1.2rem', borderLeft: '4px solid #3B82F6' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Half Days</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3B82F6', marginTop: '0.2rem' }}>{summary.halfDays}</div>
            </div>

            <div className="glass-panel" style={{ padding: '1.2rem', borderLeft: '4px solid #A855F7' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Overtime</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#A855F7', marginTop: '0.2rem' }}>{summary.totalOvertimeHours} hrs</div>
            </div>

            <div className="glass-panel" style={{ padding: '1.2rem', borderLeft: '4px solid #F43F5E' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Missing Check-Outs</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F43F5E', marginTop: '0.2rem' }}>{summary.missingCheckOuts}</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem' }}>Aggregated Attendance Breakdown</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Total Worked Hours Tracked</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#C084FC' }}>{summary.totalWorkedHours} hours</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Corrected Audit Records</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#60A5FA' }}>{summary.correctedRecords} records</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ATTENDANCE CALENDAR VIEW */}
      {activeTab === 'calendar' && (() => {
        const activeDate = selectedCalendarDate || '2026-09-05';
        const activeDayRecords = attendances.filter((a) => a.date === activeDate);
        const dayPresent = activeDayRecords.filter((r) => r.status === 'Present').length;
        const dayLate = activeDayRecords.filter((r) => r.status === 'Late').length;
        const dayAbsent = activeDayRecords.filter((r) => r.status === 'Absent').length;
        const dayOvertime = activeDayRecords.filter((r) => r.status === 'Overtime' || r.status === 'Half Day').length;
        const dayWorkedHours = parseFloat(activeDayRecords.reduce((acc, r) => acc + (r.workedHours || 0), 0).toFixed(2));

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* DAILY ATTENDANCE SUMMARY PANEL */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #7C3AED' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                    📅 Day Summary of Attendance
                  </span>
                  <h2 style={{ fontSize: '1.35rem', color: '#fff', fontWeight: 700, marginTop: '0.2rem' }}>
                    {new Date(`${activeDate}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </h2>
                </div>

                {isAuthorized && (
                  <button
                    onClick={() => {
                      setSelectedCalendarDate(activeDate);
                      setDailyOverviewModalOpen(true);
                    }}
                    className="btn-primary"
                    style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}
                  >
                    Inspect All Employee Logs ({activeDayRecords.length})
                  </button>
                )}
              </div>

              {/* Daily KPI Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1rem', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.78rem', color: '#34D399', textTransform: 'uppercase', fontWeight: 600 }}>Present Today</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10B981', marginTop: '0.2rem' }}>{dayPresent}</div>
                </div>

                <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '1rem', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.78rem', color: '#FBBF24', textTransform: 'uppercase', fontWeight: 600 }}>Late Check-Ins</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F59E0B', marginTop: '0.2rem' }}>{dayLate}</div>
                </div>

                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1rem', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.78rem', color: '#FCA5A5', textTransform: 'uppercase', fontWeight: 600 }}>Absent / Off</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#EF4444', marginTop: '0.2rem' }}>{dayAbsent}</div>
                </div>

                <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '1rem', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.78rem', color: '#C084FC', textTransform: 'uppercase', fontWeight: 600 }}>Overtime / Half Day</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#A855F7', marginTop: '0.2rem' }}>{dayOvertime}</div>
                </div>

                <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '1rem', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.78rem', color: '#93C5FD', textTransform: 'uppercase', fontWeight: 600 }}>Total Worked Hours</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#60A5FA', marginTop: '0.2rem' }}>{dayWorkedHours} hrs</div>
                </div>
              </div>
            </div>

            {/* Monthly Calendar Grid */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1.2rem' }}>
                September 2026 Monthly Attendance Calendar
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <div key={day} style={{ fontWeight: 700, color: '#A78BFA', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                    {day}
                  </div>
                ))}

                {/* Leading Empty Cells for Grid Alignment (Sept 1 2026 starts on Tue) */}
                {Array.from({ length: (new Date('2026-09-01T00:00:00').getDay() + 6) % 7 }).map((_, idx) => (
                  <div key={`empty-${idx}`} style={{ minHeight: '92px', opacity: 0.12, border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '8px' }} />
                ))}

                {Array.from({ length: 30 }, (_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `2026-09-${String(dayNum).padStart(2, '0')}`;
                  const dateObj = new Date(`${dateStr}T00:00:00`);
                  const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

                  // Check Holiday & Weekly Off (Sunday default)
                  const weeklyOffList = attendanceConfig?.weeklyOffDays || ['Sunday'];
                  const isWeeklyOff = weeklyOffList.includes(dayOfWeek);
                  const holidayObj = attendanceConfig?.holidays?.find((h) => h.date === dateStr);
                  const isHoliday = !!holidayObj || isWeeklyOff;

                  // Day Records & Metrics
                  const dayRecords = attendances.filter((a) => {
                    if (!a.date) return false;
                    const dStr = typeof a.date === 'string' ? a.date.split('T')[0] : '';
                    return dStr === dateStr;
                  });

                  const dPresent = dayRecords.filter((r) => ['Present', 'Late', 'Overtime', 'Half Day', 'Corrected'].includes(r.status)).length;
                  const dLate = dayRecords.filter((r) => r.status === 'Late').length;
                  const dAbsent = dayRecords.filter((r) => r.status === 'Absent').length;
                  const dOvertimeHalf = dayRecords.filter((r) => r.status === 'Half Day' || r.status === 'Overtime').length;
                  const dHours = parseFloat(dayRecords.reduce((acc, r) => acc + (r.workedHours || 0), 0).toFixed(2));

                  const isSelected = activeDate === dateStr;

                  // Dynamic Card Color Theme: Present -> Green, Late/Half Day -> Orange/Amber, Absent -> Red, Holiday -> Sky Blue
                  const primaryStatus = dayRecords[0]?.status;
                  let cardBg = 'rgba(255,255,255,0.02)';
                  let cardBorder = '1px solid rgba(255,255,255,0.05)';
                  let cardGlow = 'none';

                  if (isHoliday) {
                    cardBg = isSelected ? 'rgba(59, 130, 246, 0.38)' : 'rgba(59, 130, 246, 0.15)';
                    cardBorder = isSelected ? '2px solid #60A5FA' : '1px solid rgba(59, 130, 246, 0.45)';
                    cardGlow = '0 0 10px rgba(59, 130, 246, 0.2)';
                  } else if (dayRecords.length > 0) {
                    if (primaryStatus === 'Present' || primaryStatus === 'Overtime' || primaryStatus === 'Corrected') {
                      cardBg = isSelected ? 'rgba(16, 185, 129, 0.38)' : 'rgba(16, 185, 129, 0.15)';
                      cardBorder = isSelected ? '2px solid #34D399' : '1px solid rgba(16, 185, 129, 0.45)';
                      cardGlow = '0 0 10px rgba(16, 185, 129, 0.2)';
                    } else if (primaryStatus === 'Late' || primaryStatus === 'Half Day') {
                      cardBg = isSelected ? 'rgba(245, 158, 11, 0.38)' : 'rgba(245, 158, 11, 0.15)';
                      cardBorder = isSelected ? '2px solid #FBBF24' : '1px solid rgba(245, 158, 11, 0.45)';
                      cardGlow = '0 0 10px rgba(245, 158, 11, 0.2)';
                    } else if (primaryStatus === 'Absent') {
                      cardBg = isSelected ? 'rgba(239, 68, 68, 0.38)' : 'rgba(239, 68, 68, 0.15)';
                      cardBorder = isSelected ? '2px solid #FCA5A5' : '1px solid rgba(239, 68, 68, 0.45)';
                      cardGlow = '0 0 10px rgba(239, 68, 68, 0.2)';
                    } else {
                      cardBg = isSelected ? 'rgba(124, 58, 237, 0.38)' : 'rgba(124, 58, 237, 0.15)';
                      cardBorder = isSelected ? '2px solid #A78BFA' : '1px solid rgba(124, 58, 237, 0.4)';
                    }
                  } else if (isSelected) {
                    cardBg = 'rgba(255, 255, 255, 0.1)';
                    cardBorder = '2px solid #A78BFA';
                  }

                  return (
                    <div
                      key={dayNum}
                      onClick={() => {
                        setSelectedCalendarDate(dateStr);
                        if (isAuthorized) {
                          setDailyOverviewModalOpen(true);
                        }
                      }}
                      style={{
                        background: cardBg,
                        border: cardBorder,
                        borderRadius: '8px',
                        padding: '0.65rem 0.4rem',
                        minHeight: '92px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s ease',
                        boxShadow: cardGlow
                      }}
                      title={`Click to inspect day summary & employee logs for ${dateStr}`}
                    >
                      {/* Top Header Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: isHoliday ? '#93C5FD' : '#fff' }}>
                          {dayNum}
                        </span>
                        {holidayObj ? (
                          <span style={{ fontSize: '0.6rem', fontWeight: 700, background: 'rgba(59, 130, 246, 0.3)', color: '#60A5FA', padding: '1px 5px', borderRadius: '4px' }}>
                            🎉 {holidayObj.name}
                          </span>
                        ) : isWeeklyOff ? (
                          <span style={{ fontSize: '0.6rem', fontWeight: 700, background: 'rgba(59, 130, 246, 0.22)', color: '#93C5FD', padding: '1px 5px', borderRadius: '4px' }}>
                            {dayOfWeek === 'Sunday' ? 'Sun Off' : 'Off'}
                          </span>
                        ) : null}
                      </div>

                      {/* Day Attendance Metrics Summary */}
                      {dayRecords.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '100%', marginTop: '0.4rem' }}>
                          <div style={{ fontSize: '0.68rem', color: '#A78BFA', fontWeight: 600, display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <span>Logs: {dayRecords.length}</span>
                            {dHours > 0 && <span style={{ color: '#60A5FA' }}>{dHours}h</span>}
                          </div>
                          <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <span style={{ fontSize: '0.62rem', background: 'rgba(16, 185, 129, 0.25)', color: '#34D399', padding: '1px 4px', borderRadius: '3px', fontWeight: 700 }}>
                              P: {dPresent}
                            </span>
                            {dLate > 0 && (
                              <span style={{ fontSize: '0.62rem', background: 'rgba(245, 158, 11, 0.25)', color: '#FBBF24', padding: '1px 4px', borderRadius: '3px', fontWeight: 700 }}>
                                L: {dLate}
                              </span>
                            )}
                            {dAbsent > 0 && (
                              <span style={{ fontSize: '0.62rem', background: 'rgba(239, 68, 68, 0.25)', color: '#FCA5A5', padding: '1px 4px', borderRadius: '3px', fontWeight: 700 }}>
                                A: {dAbsent}
                              </span>
                            )}
                            {dOvertimeHalf > 0 && (
                              <span style={{ fontSize: '0.62rem', background: 'rgba(168, 85, 247, 0.25)', color: '#C084FC', padding: '1px 4px', borderRadius: '3px', fontWeight: 700 }}>
                                O/H: {dOvertimeHalf}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div style={{ marginTop: 'auto', marginBottom: '0.2rem' }}>
                          <span style={{ fontSize: '0.72rem', color: isHoliday ? '#60A5FA' : 'var(--text-dim)', fontWeight: isHoliday ? 600 : 400 }}>
                            {isHoliday ? (holidayObj ? holidayObj.name : 'Weekly Off') : 'Off'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modals */}
      <AttendanceFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSave={handleSaveAttendance}
        initialData={selectedRecordForEdit}
        employees={employees}
      />

      <AttendanceCorrectionModal
        isOpen={correctionModalOpen}
        onClose={() => setCorrectionModalOpen(false)}
        record={selectedRecordForCorrection}
        onSubmitRequest={handleRequestCorrection}
        onApprove={handleApproveCorrection}
        onReject={handleRejectCorrection}
        isHr={isHr}
      />

      <AttendanceDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        record={selectedRecordForDetail}
      />

      <AttendanceSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        onConfigSaved={loadAllData}
      />

      <DailyAttendanceOverviewModal
        isOpen={dailyOverviewModalOpen}
        onClose={() => setDailyOverviewModalOpen(false)}
        selectedDate={selectedCalendarDate}
        allAttendances={attendances}
        allEmployees={employees}
        onSelectEmployee={(empItem) => {
          if (empItem.employeeId || empItem.employeeEmail) {
            setSearch(empItem.employeeName || empItem.employeeEmail);
            setActiveTab('records');
          }
        }}
      />
    </div>
  );
};
