import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import CustomDropdown from '../../components/CustomDropdown';
import {
  Calendar,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Search,
  Filter,
  Layers,
  Award,
  BarChart3,
  History,
  FileText,
  User,
  Building,
  RefreshCw,
  Eye,
  Check,
  Ban,
  AlertCircle,
  Maximize2,
  List,
  LayoutGrid,
  ArrowUpDown,
  ChevronRight
} from 'lucide-react';

import { RequestModal } from './RequestModal';
import { RequestDetailModal } from './RequestDetailModal';
import { AllocationModal } from './AllocationModal';
import { TimeOffTypeModal } from './TimeOffTypeModal';
import { LeaveCalendarView } from './LeaveCalendarView';
import { LeaveBalanceCards } from './LeaveBalanceCards';
import { LeaveAuditTrailView } from './LeaveAuditTrailView';
import { FullWindowLeaveModal } from './FullWindowLeaveModal';
import { UserDisplayCell } from '../../components/UserDisplayCell';

export const TimeOffHub = () => {
  const { user } = useAuth();
  const isHR = ['Admin', 'HR Payroll Manager', 'HR Manager'].includes(user?.role);
  const isPayroll = ['Admin', 'HR Payroll Manager', 'HR Payroll User', 'HR Manager'].includes(user?.role);

  // Active sub-navigation tab
  const [subTab, setSubTab] = useState('requests'); // 'requests' | 'allocations' | 'types' | 'calendar' | 'balances' | 'audit'

  // Data states
  const [summary, setSummary] = useState({
    pendingRequests: 0,
    approvedRequests: 0,
    refusedRequests: 0,
    totalAllocatedDays: 0,
    totalUsedDays: 0,
    totalRemainingDays: 0,
    employeesOnLeaveToday: 0
  });

  const [requests, setRequests] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [types, setTypes] = useState([]);
  const [balances, setBalances] = useState([]);
  const [staffBalances, setStaffBalances] = useState([]);
  const [balanceViewMode, setBalanceViewMode] = useState('table'); // 'table' | 'cards'
  const [balanceSearch, setBalanceSearch] = useState('');
  const [balanceDeptFilter, setBalanceDeptFilter] = useState('');
  const [balanceStatusFilter, setBalanceStatusFilter] = useState('');
  const [balanceSort, setBalanceSort] = useState('remaining_desc');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeForBalance, setSelectedEmployeeForBalance] = useState(null);
  const [isFullWindowLeaveOpen, setIsFullWindowLeaveOpen] = useState(false);

  // Filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Modals state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Fetch Summary Metrics
  const fetchSummary = async () => {
    try {
      const res = await api.get('/timeoff/summary');
      if (res.data.success) {
        setSummary(res.data.summary);
      }
    } catch (e) {
      console.error('Summary fetch error:', e);
    }
  };

  // Fetch Requests
  const fetchRequests = async () => {
    try {
      let url = `/timeoff/requests?`;
      if (statusFilter) url += `status=${statusFilter}&`;
      if (typeFilter) url += `timeOffTypeId=${typeFilter}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await api.get(url);
      if (res.data.success) {
        setRequests(res.data.requests);
      }
    } catch (e) {
      console.error('Requests fetch error:', e);
    }
  };

  // Fetch Allocations
  const fetchAllocations = async () => {
    try {
      let url = `/timeoff/allocations?`;
      if (statusFilter) url += `status=${statusFilter}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await api.get(url);
      if (res.data.success) {
        setAllocations(res.data.allocations);
      }
    } catch (e) {
      console.error('Allocations fetch error:', e);
    }
  };

  // Fetch Time Off Types
  const fetchTypes = async () => {
    try {
      const res = await api.get('/timeoff/types');
      if (res.data.success) {
        setTypes(res.data.types);
      }
    } catch (e) {
      console.error('Types fetch error:', e);
    }
  };

  // Fetch Balances
  const fetchBalances = async (targetEmpId = null) => {
    try {
      const empId = targetEmpId || (selectedEmployeeForBalance?._id || selectedEmployeeForBalance?.id) || (user?._id || user?.id);
      const res = await api.get('/timeoff/balances', { params: empId ? { employeeId: empId } : {} });
      if (res.data.success) {
        setBalances(res.data.balances);
      }
    } catch (e) {
      console.error('Balances fetch error:', e);
    }
  };

  // Fetch Staff Balances for directory table
  const fetchStaffBalances = async () => {
    if (!isHR) return;
    try {
      const res = await api.get('/timeoff/balances', { params: { all: true } });
      if (res.data.success && res.data.staffBalances) {
        setStaffBalances(res.data.staffBalances);
      }
    } catch (e) {
      console.error('Staff balances fetch error:', e);
    }
  };

  // Fetch Employees Directory list for HR selectors
  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      if (res.data.success) {
        setEmployees(res.data.employees || []);
      }
    } catch (e) {
      console.error('Employees fetch error:', e);
    }
  };

  const refreshAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchSummary(),
      fetchRequests(),
      fetchAllocations(),
      fetchTypes(),
      fetchBalances(),
      fetchEmployees(),
      fetchStaffBalances()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    refreshAllData();
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    if (subTab === 'balances') {
      fetchStaffBalances();
      fetchBalances();
    }
  }, [subTab]);

  // Quick Manager Approve Request
  const handleQuickApproveRequest = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await api.patch(`/timeoff/requests/${id}/approve`);
      if (res.data.success) {
        showToast(res.data.message || 'Leave request approved.');
        refreshAllData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Approval failed');
    }
  };

  // Quick Manager Refuse Request
  const handleQuickRefuseRequest = async (id, e) => {
    e.stopPropagation();
    const reason = window.prompt('Specify reason for refusing this leave request:');
    if (reason === null) return; // User cancelled prompt

    try {
      const res = await api.patch(`/timeoff/requests/${id}/refuse`, { refusalReason: reason || 'Refused by HR' });
      if (res.data.success) {
        showToast(res.data.message || 'Leave request refused.');
        refreshAllData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Refusal failed');
    }
  };

  // Manager Approve Allocation
  const handleApproveAllocation = async (id) => {
    try {
      const res = await api.patch(`/timeoff/allocations/${id}/approve`);
      if (res.data.success) {
        showToast(res.data.message || 'Allocation approved.');
        refreshAllData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve allocation');
    }
  };

  // Manager Refuse Allocation
  const handleRefuseAllocation = async (id) => {
    const reason = window.prompt('Specify reason for refusing this allocation:');
    if (reason === null) return;

    try {
      const res = await api.patch(`/timeoff/allocations/${id}/refuse`, { refusalReason: reason });
      if (res.data.success) {
        showToast(res.data.message || 'Allocation refused.');
        refreshAllData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to refuse allocation');
    }
  };

  // Toggle Type Active / Inactive
  const handleToggleTypeStatus = async (id) => {
    try {
      const res = await api.patch(`/timeoff/types/${id}/toggle`);
      if (res.data.success) {
        showToast(res.data.message || 'Policy status updated.');
        fetchTypes();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Status toggle failed');
    }
  };

  const openRequestModal = () => {
    setIsAllocationModalOpen(false);
    setIsTypeModalOpen(false);
    setIsDetailModalOpen(false);
    setIsRequestModalOpen(true);
  };

  const openAllocationModal = () => {
    setIsRequestModalOpen(false);
    setIsTypeModalOpen(false);
    setIsDetailModalOpen(false);
    setIsAllocationModalOpen(true);
  };

  const openTypeModal = (type = null) => {
    setIsRequestModalOpen(false);
    setIsAllocationModalOpen(false);
    setIsDetailModalOpen(false);
    setEditingType(type);
    setIsTypeModalOpen(true);
  };

  // Open Request Detail Modal
  const openRequestDetail = (req) => {
    setIsRequestModalOpen(false);
    setIsAllocationModalOpen(false);
    setIsTypeModalOpen(false);
    setSelectedRequest(req);
    setIsDetailModalOpen(true);
  };

  // Helper from calendar or table ID
  const openRequestDetailById = async (id) => {
    try {
      const res = await api.get(`/timeoff/requests/${id}`);
      if (res.data.success) {
        openRequestDetail(res.data.request);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="status-dot-badge approved">
            <span className="status-dot" />
            Approved
          </span>
        );
      case 'Pending':
      case 'Pending Approval':
        return (
          <span className="status-dot-badge pending">
            <span className="status-dot" />
            Pending HR
          </span>
        );
      case 'Refused':
        return (
          <span className="status-dot-badge refused">
            <span className="status-dot" />
            Refused
          </span>
        );
      case 'Cancelled':
        return (
          <span className="status-dot-badge cancelled">
            <span className="status-dot" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="status-dot-badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
            {status}
          </span>
        );
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="responsive-page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid #7C3AED',
          boxShadow: 'var(--shadow-glow)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.25rem',
          color: '#F8FAFC',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}>
          <CheckCircle2 size={18} color="#34D399" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span className="form-badge" style={{ marginBottom: 0, padding: '0.2rem 0.6rem', fontSize: '0.72rem' }}>
              <span className="live-pulse" />
              Live Time Off & Leave Portal
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              • Role: <strong style={{ color: '#C084FC' }}>{user?.role}</strong>
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.75rem', letterSpacing: '-0.02em' }}>
            Time Off & Leave Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Streamlined leave lifecycle, automated duration calculations, multi-target allocations, and real-time balance tracking
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={refreshAllData} className="icon-btn" title="Refresh Live Data" disabled={loading} style={{ padding: '0.6rem' }}>
            <RefreshCw size={17} className={loading ? 'spin' : ''} />
          </button>

          {isHR && (
            <>
              <button
                onClick={() => openTypeModal(null)}
                className="btn-secondary"
                style={{ padding: '0.6rem 1.1rem', fontSize: '0.85rem' }}
              >
                <Layers size={15} />
                <span>New Leave Policy</span>
              </button>

              <button
                onClick={() => openAllocationModal()}
                className="btn-secondary"
                style={{ borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34D399', padding: '0.6rem 1.1rem', fontSize: '0.85rem' }}
              >
                <Award size={15} />
                <span>New Allocation</span>
              </button>
            </>
          )}

          <button onClick={() => openRequestModal()} className="btn-primary" style={{ padding: '0.6rem 1.3rem', fontSize: '0.88rem' }}>
            <Plus size={17} />
            <span>Apply for Leave</span>
          </button>
        </div>
      </div>

      {/* Real-time Summary Dashboard Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))', gap: '1rem', marginBottom: '2.2rem' }}>
        {/* Card 1: Pending */}
        <div className="timeoff-kpi-card" style={{ '--card-accent': '#F59E0B' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                Pending Review
              </span>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#FBBF24', marginTop: '0.2rem', lineHeight: 1.1 }}>
                {summary.pendingRequests}
              </div>
            </div>
            <div className="kpi-icon-bubble" style={{ background: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.25)' }}>
              <Clock size={20} color="#F59E0B" />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ color: '#FBBF24' }}>●</span> Awaiting approval action
          </div>
        </div>

        {/* Card 2: Approved */}
        <div className="timeoff-kpi-card" style={{ '--card-accent': '#10B981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                Approved Leaves
              </span>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#34D399', marginTop: '0.2rem', lineHeight: 1.1 }}>
                {summary.approvedRequests}
              </div>
            </div>
            <div className="kpi-icon-bubble" style={{ background: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
              <CheckCircle2 size={20} color="#10B981" />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ color: '#34D399' }}>●</span> Confirmed time off
          </div>
        </div>

        {/* Card 3: Allocated */}
        <div className="timeoff-kpi-card" style={{ '--card-accent': '#06B6D4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                Total Allocated
              </span>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#22D3EE', marginTop: '0.2rem', lineHeight: 1.1 }}>
                {summary.totalAllocatedDays} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>Days</span>
              </div>
            </div>
            <div className="kpi-icon-bubble" style={{ background: 'rgba(6, 182, 212, 0.12)', borderColor: 'rgba(6, 182, 212, 0.25)' }}>
              <Award size={20} color="#06B6D4" />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Granted policy pool
          </div>
        </div>

        {/* Card 4: Used */}
        <div className="timeoff-kpi-card" style={{ '--card-accent': '#8B5CF6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                Total Used
              </span>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#C084FC', marginTop: '0.2rem', lineHeight: 1.1 }}>
                {summary.totalUsedDays} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>Days</span>
              </div>
            </div>
            <div className="kpi-icon-bubble" style={{ background: 'rgba(139, 92, 246, 0.12)', borderColor: 'rgba(139, 92, 246, 0.25)' }}>
              <Clock size={20} color="#8B5CF6" />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Deducted approved leaves
          </div>
        </div>

        {/* Card 5: Remaining */}
        <div className="timeoff-kpi-card" style={{ '--card-accent': '#14B8A6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                Remaining Balance
              </span>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#2DD4BF', marginTop: '0.2rem', lineHeight: 1.1 }}>
                {summary.totalRemainingDays} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>Days</span>
              </div>
            </div>
            <div className="kpi-icon-bubble" style={{ background: 'rgba(20, 184, 166, 0.12)', borderColor: 'rgba(20, 184, 166, 0.25)' }}>
              <BarChart3 size={20} color="#14B8A6" />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Available for booking
          </div>
        </div>

        {/* Card 6: On Leave Today */}
        <div className="timeoff-kpi-card" style={{ '--card-accent': '#F43F5E' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                On Leave Today
              </span>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#FB7185', marginTop: '0.2rem', lineHeight: 1.1 }}>
                {summary.employeesOnLeaveToday} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>Staff</span>
              </div>
            </div>
            <div className="kpi-icon-bubble" style={{ background: 'rgba(244, 63, 94, 0.12)', borderColor: 'rgba(244, 63, 94, 0.25)' }}>
              <User size={20} color="#F43F5E" />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Active out-of-office
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs (Segmented Pill Design) */}
      <div className="scrollable-subtabs" style={{
        display: 'inline-flex',
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 'var(--radius-lg)',
        padding: '0.35rem',
        marginBottom: '1.75rem',
        gap: '0.25rem',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => { setSubTab('requests'); setSearch(''); setStatusFilter(''); }}
          className={`nav-pill-item ${subTab === 'requests' ? 'active' : ''}`}
        >
          <Clock size={16} />
          <span>{isHR ? 'Leave Requests' : 'My Requests'}</span>
          <span style={{
            fontSize: '0.72rem',
            padding: '0.1rem 0.45rem',
            borderRadius: '10px',
            background: subTab === 'requests' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
            color: '#fff',
            fontWeight: 700
          }}>
            {requests.length}
          </span>
        </button>

        <button
          onClick={() => { setSubTab('balances'); }}
          className={`nav-pill-item ${subTab === 'balances' ? 'active' : ''}`}
        >
          <BarChart3 size={16} />
          <span>Leave Balances</span>
        </button>

        <button
          onClick={() => { setSubTab('calendar'); }}
          className={`nav-pill-item ${subTab === 'calendar' ? 'active' : ''}`}
        >
          <Calendar size={16} />
          <span>Leave Calendar</span>
        </button>

        <button
          onClick={() => { setSubTab('allocations'); setSearch(''); setStatusFilter(''); }}
          className={`nav-pill-item ${subTab === 'allocations' ? 'active' : ''}`}
        >
          <Award size={16} />
          <span>Allocations</span>
          <span style={{
            fontSize: '0.72rem',
            padding: '0.1rem 0.45rem',
            borderRadius: '10px',
            background: subTab === 'allocations' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
            color: '#fff',
            fontWeight: 700
          }}>
            {allocations.length}
          </span>
        </button>

        {isHR && (
          <button
            onClick={() => { setSubTab('types'); setSearch(''); setStatusFilter(''); }}
            className={`nav-pill-item ${subTab === 'types' ? 'active' : ''}`}
          >
            <Layers size={16} />
            <span>Time Off Types</span>
            <span style={{
              fontSize: '0.72rem',
              padding: '0.1rem 0.45rem',
              borderRadius: '10px',
              background: subTab === 'types' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
              color: '#fff',
              fontWeight: 700
            }}>
              {types.length}
            </span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: REQUESTS TABLE */}
      {/* ========================================================================= */}
      {subTab === 'requests' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          {/* Filter Bar */}
          <div className="toolbar-flex-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="search-box" style={{ maxWidth: '280px' }}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search by employee, type, reason..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchRequests()}
                />
              </div>

              <div style={{ minWidth: '160px' }}>
                <CustomDropdown
                  options={[
                    { value: '', label: 'All Statuses' },
                    { value: 'Pending', label: 'Pending' },
                    { value: 'Approved', label: 'Approved' },
                    { value: 'Refused', label: 'Refused' },
                    { value: 'Cancelled', label: 'Cancelled' },
                    { value: 'Draft', label: 'Draft' }
                  ]}
                  value={statusFilter}
                  onChange={(val) => setStatusFilter(val)}
                  placeholder="All Statuses"
                />
              </div>

              <div style={{ minWidth: '170px' }}>
                <CustomDropdown
                  options={[
                    { value: '', label: 'All Leave Types' },
                    ...types.map((t) => ({ value: t._id, label: t.name }))
                  ]}
                  value={typeFilter}
                  onChange={(val) => setTypeFilter(val)}
                  placeholder="All Leave Types"
                />
              </div>
            </div>

            <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
              Showing {requests.length} records
            </span>
          </div>

          {/* Table */}
          {requests.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Calendar size={40} style={{ opacity: 0.3, margin: '0 auto 0.75rem auto' }} />
              <div>No leave requests found.</div>
              <button onClick={() => openRequestModal()} className="btn-primary" style={{ marginTop: '1rem' }}>
                <Plus size={16} /> Apply for Leave
              </button>
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Leave Type</th>
                    <th>Date Interval</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req._id} onClick={() => openRequestDetail(req)} style={{ cursor: 'pointer' }}>
                      <td>
                        <UserDisplayCell
                          name={req.employeeName}
                          subtitle={req.department || 'General'}
                          photo={req.employeePhoto || req.photo}
                          size={34}
                        />
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          color: '#C084FC',
                          background: 'rgba(124, 58, 237, 0.12)',
                          border: '1px solid rgba(139, 92, 246, 0.25)',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px'
                        }}>
                          {req.timeOffTypeName}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: '#E2E8F0' }}>
                        {new Date(req.startDate).toLocaleDateString()} → {new Date(req.endDate).toLocaleDateString()}
                      </td>
                      <td>
                        <strong style={{ color: '#34D399', fontSize: '0.95rem' }}>
                          {req.duration} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>{req.unit}</span>
                        </strong>
                      </td>
                      <td>{getStatusBadge(req.status)}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        {new Date(req.requestedDate || req.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', alignItems: 'center' }}>
                          {isHR && req.status === 'Pending' ? (
                            <>
                              <button
                                onClick={(e) => handleQuickApproveRequest(req._id, e)}
                                className="btn-primary"
                                style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                                title="Approve Request"
                              >
                                <Check size={14} /> Approve
                              </button>
                              <button
                                onClick={(e) => handleQuickRefuseRequest(req._id, e)}
                                className="btn-danger-outline"
                                style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                                title="Refuse Request"
                              >
                                <Ban size={14} /> Refuse
                              </button>
                            </>
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                              {req.status}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: ALLOCATIONS */}
      {/* ========================================================================= */}
      {subTab === 'allocations' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div className="search-box" style={{ maxWidth: '280px' }}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search allocations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchAllocations()}
                />
              </div>

              <div style={{ minWidth: '170px' }}>
                <CustomDropdown
                  options={[
                    { value: '', label: 'All Statuses' },
                    { value: 'Approved', label: 'Approved' },
                    { value: 'Pending Approval', label: 'Pending Approval' },
                    { value: 'Refused', label: 'Refused' }
                  ]}
                  value={statusFilter}
                  onChange={(val) => setStatusFilter(val)}
                  placeholder="All Statuses"
                />
              </div>
            </div>

            {isHR && (
              <button onClick={() => openAllocationModal()} className="btn-primary">
                <Plus size={16} /> New Allocation
              </button>
            )}
          </div>

          {allocations.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No leave allocations recorded yet.
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Time Off Type</th>
                    <th>Allocated Balance</th>
                    <th>Validity Cycle</th>
                    <th>Validity Dates</th>
                    <th>Status</th>
                    <th>Assigned By</th>
                    {isHR && <th style={{ textAlign: 'right' }}>Manager Approval</th>}
                  </tr>
                </thead>
                <tbody>
                  {allocations.map((alloc) => (
                    <tr key={alloc._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className="avatar-circle" style={{ background: 'linear-gradient(135deg, #06B6D4, #3B82F6)' }}>
                            {getInitials(alloc.employeeName)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#fff' }}>{alloc.employeeName}</div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{alloc.department || 'General'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: '#A78BFA' }}>{alloc.timeOffTypeName}</strong>
                      </td>
                      <td>
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: '#34D399' }}>
                          +{alloc.allocatedAmount} {alloc.unit}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{alloc.validityPeriod || 'Annual'}</td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {new Date(alloc.startDate).toLocaleDateString()} → {new Date(alloc.endDate).toLocaleDateString()}
                      </td>
                      <td>{getStatusBadge(alloc.status)}</td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                        {alloc.createdByName}
                      </td>
                      {isHR && (
                        <td style={{ textAlign: 'right' }}>
                          {alloc.status === 'Pending Approval' ? (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                              <button
                                onClick={() => handleApproveAllocation(alloc._id)}
                                className="btn-primary"
                                style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRefuseAllocation(alloc._id)}
                                className="btn-danger-outline"
                                style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                              >
                                Refuse
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                              {alloc.approvedByName ? `Approved by ${alloc.approvedByName}` : 'Closed'}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: TIME OFF TYPES */}
      {/* ========================================================================= */}
      {subTab === 'types' && isHR && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>Time Off Policy Configuration</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Configure leave categories, allocation requirements, negative balance rules, and payroll treatment
              </p>
            </div>
            <button
              onClick={() => openTypeModal(null)}
              className="btn-primary"
            >
              <Plus size={16} /> Add Leave Policy
            </button>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Policy Name</th>
                  <th>Code</th>
                  <th>Unit</th>
                  <th>Requires Allocation</th>
                  <th>Approval Required</th>
                  <th>Negative Balance</th>
                  <th>Payroll Treatment</th>
                  <th>Allocations</th>
                  <th>Requests</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {types.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: t.color || '#7C3AED' }} />
                        <span style={{ fontWeight: 600, color: '#fff' }}>{t.name}</span>
                      </div>
                    </td>
                    <td>
                      <code style={{ background: 'rgba(255,255,255,0.06)', padding: '0.15rem 0.4rem', borderRadius: '4px', color: '#C084FC' }}>
                        {t.code}
                      </code>
                    </td>
                    <td>{t.unit}</td>
                    <td>{t.requiresAllocation ? 'Yes' : 'No'}</td>
                    <td>{t.approvalRequired ? 'Yes' : 'No'}</td>
                    <td>{t.allowNegativeBalance ? 'Allowed' : 'Strict 0'}</td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: t.payrollTreatment === 'Paid' ? '#34D399' : '#EF4444' }}>
                        {t.payrollTreatment}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{t.allocationsCount || 0}</td>
                    <td style={{ fontWeight: 600, color: '#C084FC' }}>{t.requestsCount || 0}</td>
                    <td>
                      <span className={`status-badge ${t.status === 'Active' ? 'active' : 'inactive'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button
                          onClick={() => openTypeModal(t)}
                          className="icon-btn"
                          title="Edit Policy"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleTypeStatus(t._id)}
                          className="btn-secondary"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          {t.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: CALENDAR VIEW */}
      {/* ========================================================================= */}
      {subTab === 'calendar' && (
        <LeaveCalendarView
          onRequestClick={(id) => openRequestDetailById(id)}
          employees={employees}
          types={types}
        />
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 5: BALANCES VIEW */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* SUBTAB 5: BALANCES VIEW */}
      {/* ========================================================================= */}
      {subTab === 'balances' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Top Title & View Mode Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
                <BarChart3 size={22} color="#A855F7" />
                <span>{isHR ? 'Staff Leave Balances & Entitlements Directory' : 'My Leave Balances & Entitlements'}</span>
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.35rem 0 0 0' }}>
                Real-time annual quotas, utilized days, pending submissions, and remaining available time-off.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* View Switcher: Table vs Cards */}
              <div
                style={{
                  display: 'flex',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '0.2rem'
                }}
              >
                <button
                  onClick={() => setBalanceViewMode('table')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: balanceViewMode === 'table' ? 'linear-gradient(135deg, #7C3AED, #9333EA)' : 'transparent',
                    color: balanceViewMode === 'table' ? '#fff' : '#94A3B8',
                    fontSize: '0.82rem',
                    fontWeight: balanceViewMode === 'table' ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title="View employee balances in table format"
                >
                  <List size={15} />
                  <span>Table View</span>
                </button>

                <button
                  onClick={() => setBalanceViewMode('cards')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: balanceViewMode === 'cards' ? 'linear-gradient(135deg, #7C3AED, #9333EA)' : 'transparent',
                    color: balanceViewMode === 'cards' ? '#fff' : '#94A3B8',
                    fontSize: '0.82rem',
                    fontWeight: balanceViewMode === 'cards' ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title="View leave policy cards"
                >
                  <LayoutGrid size={15} />
                  <span>Cards View</span>
                </button>
              </div>

              {/* View Full Window Button */}
              <button
                onClick={() => {
                  setSelectedEmployeeForBalance(null);
                  setIsFullWindowLeaveOpen(true);
                }}
                className="btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'linear-gradient(135deg, #7C3AED, #9333EA)',
                  boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                  fontSize: '0.85rem'
                }}
                title="Open leave details in full window modal"
              >
                <Maximize2 size={15} />
                <span>Open in Full Window</span>
              </button>

              <button
                onClick={() => openRequestModal()}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              >
                <Plus size={15} />
                <span>Request Time Off</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TABULAR VIEW WITH FILTERS */}
          {/* ========================================================================= */}
          {balanceViewMode === 'table' ? (
            <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
              {/* Filter Ribbon */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.85rem',
                  marginBottom: '1.25rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
                  {/* Search Filter */}
                  <div className="search-box" style={{ minWidth: '240px', maxWidth: '320px', flex: 1 }}>
                    <Search size={15} color="#94A3B8" />
                    <input
                      type="text"
                      placeholder="Search employee, email, role..."
                      value={balanceSearch}
                      onChange={(e) => setBalanceSearch(e.target.value)}
                    />
                  </div>

                  {/* Department Filter */}
                  <div style={{ minWidth: '160px' }}>
                    <CustomDropdown
                      options={[
                        { value: '', label: 'All Departments' },
                        ...Array.from(new Set(staffBalances.map((s) => s.employee?.department).filter(Boolean))).map((d) => ({
                          value: d,
                          label: d
                        }))
                      ]}
                      value={balanceDeptFilter}
                      onChange={(val) => setBalanceDeptFilter(val)}
                      placeholder="Department"
                    />
                  </div>

                  {/* Leave Availability Filter */}
                  <div style={{ minWidth: '175px' }}>
                    <CustomDropdown
                      options={[
                        { value: '', label: 'All Leave Statuses' },
                        { value: 'has_remaining', label: 'Has Available Days (> 0)' },
                        { value: 'zero_remaining', label: 'Exhausted Quota (0 Days)' },
                        { value: 'pending_req', label: 'Has Pending Approvals' },
                        { value: 'high_used', label: 'High Usage (> 5 Days)' }
                      ]}
                      value={balanceStatusFilter}
                      onChange={(val) => setBalanceStatusFilter(val)}
                      placeholder="Availability"
                    />
                  </div>

                  {/* Sort Filter */}
                  <div style={{ minWidth: '185px' }}>
                    <CustomDropdown
                      options={[
                        { value: 'remaining_desc', label: 'Sort: Most Remaining Leave' },
                        { value: 'remaining_asc', label: 'Sort: Least Remaining Leave' },
                        { value: 'used_desc', label: 'Sort: Most Days Used' },
                        { value: 'name_asc', label: 'Sort: Name (A to Z)' }
                      ]}
                      value={balanceSort}
                      onChange={(val) => setBalanceSort(val)}
                      placeholder="Sort Order"
                    />
                  </div>

                  {/* Reset Filters */}
                  {(balanceSearch || balanceDeptFilter || balanceStatusFilter || balanceSort !== 'remaining_desc') && (
                    <button
                      onClick={() => {
                        setBalanceSearch('');
                        setBalanceDeptFilter('');
                        setBalanceStatusFilter('');
                        setBalanceSort('remaining_desc');
                      }}
                      style={{
                        padding: '0.45rem 0.8rem',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#F87171',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>Click any employee row to open full window</span>
                </div>
              </div>

              {/* Tabular Data Grid */}
              {(() => {
                // Build unified employee balances with live pending and used requests
                const baseList = employees.length > 0 ? employees : staffBalances.map(s => s.employee);
                const list = baseList.map((emp) => {
                  const empId = (emp._id || emp.id || '').toString();
                  const empName = (emp.name || '').trim();
                  const empEmail = (emp.email || '').toLowerCase().trim();

                  // Find if staffBalances has this employee's computed record
                  const fromStaffBalances = staffBalances.find((s) => {
                    const sId = (s.employee?._id || s.employee?.id || '').toString();
                    const sEmail = (s.employee?.email || '').toLowerCase().trim();
                    return (sId && sId === empId) || (sEmail && sEmail === empEmail);
                  });

                  // Calculate live pending requests for this employee from requests state
                  const empPendingRequests = requests.filter((r) => {
                    const rEmpId = (r.employee?._id || r.employee?.id || r.employee || '').toString();
                    const rName = (r.employeeName || '').trim();
                    const rEmail = (r.employeeEmail || '').toLowerCase().trim();
                    const isEmpMatch = (rEmpId && rEmpId === empId) || (rEmail && rEmail === empEmail) || (rName && rName.toLowerCase() === empName.toLowerCase());
                    return isEmpMatch && (r.status === 'Pending' || r.status === 'Pending Approval');
                  });
                  const livePendingDays = empPendingRequests.reduce((sum, r) => sum + (Number(r.duration) || Number(r.days) || 0), 0);

                  // Calculate live approved requests for this employee from requests state
                  const empApprovedRequests = requests.filter((r) => {
                    const rEmpId = (r.employee?._id || r.employee?.id || r.employee || '').toString();
                    const rName = (r.employeeName || '').trim();
                    const rEmail = (r.employeeEmail || '').toLowerCase().trim();
                    const isEmpMatch = (rEmpId && rEmpId === empId) || (rEmail && rEmail === empEmail) || (rName && rName.toLowerCase() === empName.toLowerCase());
                    return isEmpMatch && r.status === 'Approved';
                  });
                  const liveUsedDays = empApprovedRequests.reduce((sum, r) => sum + (Number(r.duration) || Number(r.days) || 0), 0);

                  // Calculate live allocations for this employee from allocations state
                  const empAllocations = allocations.filter((a) => {
                    const aEmpId = (a.employee?._id || a.employee?.id || a.employee || '').toString();
                    const aName = (a.employeeName || '').trim();
                    const aEmail = (a.employeeEmail || '').toLowerCase().trim();
                    const isEmpMatch = (aEmpId && aEmpId === empId) || (aEmail && aEmail === empEmail) || (aName && aName.toLowerCase() === empName.toLowerCase());
                    return isEmpMatch && (a.status === 'Approved' || a.status === 'Active');
                  });
                  const liveAllocatedDays = empAllocations.length > 0
                    ? empAllocations.reduce((sum, a) => sum + (Number(a.allocatedAmount) || 0), 0)
                    : (fromStaffBalances?.totalAllocated || 24);

                  const totalAllocated = fromStaffBalances?.totalAllocated || liveAllocatedDays;
                  const totalUsed = Math.max(fromStaffBalances?.totalUsed || 0, liveUsedDays);
                  const totalPending = Math.max(fromStaffBalances?.totalPending || 0, livePendingDays);
                  const totalRemaining = fromStaffBalances?.totalRemaining !== undefined
                    ? fromStaffBalances.totalRemaining
                    : Math.max(0, totalAllocated - totalUsed);

                  // Resolve employee type dynamically from contract end date & contract duration attributes
                  const isContract = emp.employeeType === 'Contract' && Boolean(emp.contractEndDate || emp.contractDuration);
                  const resolvedType = isContract ? 'Contract' : (emp.employeeType === 'Contract' && !emp.contractEndDate && !emp.contractDuration ? 'Permanent' : (emp.employeeType || 'Permanent'));

                  // Per policy breakdown
                  let balancesList = fromStaffBalances?.balances || [];
                  if (!balancesList || balancesList.length === 0) {
                    const policyTypes = types.length > 0 ? types : [
                      { name: 'Paid Time Off', code: 'PTO', defaultDays: 12 },
                      { name: 'Sick Leave', code: 'SICK', defaultDays: 8 },
                      { name: 'Casual Leave', code: 'CASUAL', defaultDays: 4 }
                    ];
                    balancesList = policyTypes.map((t) => {
                      const tAlloc = empAllocations.filter(a => (a.timeOffType?._id || a.timeOffType) === t._id || a.timeOffTypeName === t.name)
                        .reduce((sum, a) => sum + (Number(a.allocatedAmount) || 0), 0) || t.defaultDays || (t.code === 'SICK' ? 8 : (t.code === 'CASUAL' ? 4 : 12));
                      const tUsed = empApprovedRequests.filter(r => (r.timeOffType?._id || r.timeOffType) === t._id || r.timeOffTypeName === t.name)
                        .reduce((sum, r) => sum + (Number(r.duration) || Number(r.days) || 0), 0);
                      const tPending = empPendingRequests.filter(r => (r.timeOffType?._id || r.timeOffType) === t._id || r.timeOffTypeName === t.name)
                        .reduce((sum, r) => sum + (Number(r.duration) || Number(r.days) || 0), 0);
                      return {
                        timeOffTypeName: t.name,
                        code: t.code || (t.name || 'LEV').slice(0, 3).toUpperCase(),
                        allocated: tAlloc,
                        used: tUsed,
                        pending: tPending,
                        remaining: Math.max(0, tAlloc - tUsed)
                      };
                    });
                  }

                  return {
                    employee: {
                      ...emp,
                      employeeType: resolvedType
                    },
                    totalRemaining,
                    totalAllocated,
                    totalUsed,
                    totalPending,
                    balances: balancesList
                  };
                });

                const filtered = list.filter((item) => {
                  const emp = item.employee || {};
                  const query = balanceSearch.toLowerCase();
                  const matchSearch =
                    !query ||
                    (emp.name || '').toLowerCase().includes(query) ||
                    (emp.email || '').toLowerCase().includes(query) ||
                    (emp.department || '').toLowerCase().includes(query) ||
                    (emp.jobPosition || '').toLowerCase().includes(query);

                  const matchDept = !balanceDeptFilter || emp.department === balanceDeptFilter;

                  let matchStatus = true;
                  if (balanceStatusFilter === 'has_remaining') matchStatus = item.totalRemaining > 0;
                  else if (balanceStatusFilter === 'zero_remaining') matchStatus = item.totalRemaining === 0;
                  else if (balanceStatusFilter === 'pending_req') matchStatus = item.totalPending > 0;
                  else if (balanceStatusFilter === 'high_used') matchStatus = item.totalUsed > 5;

                  return matchSearch && matchDept && matchStatus;
                }).sort((a, b) => {
                  if (balanceSort === 'remaining_desc') return b.totalRemaining - a.totalRemaining;
                  if (balanceSort === 'remaining_asc') return a.totalRemaining - b.totalRemaining;
                  if (balanceSort === 'used_desc') return b.totalUsed - a.totalUsed;
                  if (balanceSort === 'name_asc') return (a.employee?.name || '').localeCompare(b.employee?.name || '');
                  return 0;
                });

                if (filtered.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                      <BarChart3 size={38} style={{ opacity: 0.35, margin: '0 auto 0.75rem auto' }} />
                      <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff' }}>No Employee Balances Found</div>
                      <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>No employee records matched your filter criteria.</p>
                      <button
                        onClick={() => {
                          setBalanceSearch('');
                          setBalanceDeptFilter('');
                          setBalanceStatusFilter('');
                        }}
                        className="btn-secondary"
                        style={{ marginTop: '1rem', fontSize: '0.82rem' }}
                      >
                        Reset All Filters
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Department & Role</th>
                          <th>Policy Balances Breakdown</th>
                          <th>Remaining Available Leave</th>
                          <th style={{ textAlign: 'center', minWidth: '95px' }}>Days Used</th>
                          <th style={{ textAlign: 'center', minWidth: '130px' }}>Pending</th>
                          <th style={{ textAlign: 'right' }}>Full Window Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((item) => {
                          const emp = item.employee || {};
                          const empId = emp._id || emp.id;
                          const totalRem = item.totalRemaining || 0;
                          const totalAlloc = item.totalAllocated || 0;
                          const totalUsed = item.totalUsed || 0;
                          const totalPend = item.totalPending || 0;
                          const pctRemaining = totalAlloc > 0 ? Math.round((totalRem / totalAlloc) * 100) : 100;

                          return (
                            <tr
                              key={empId}
                              onClick={() => {
                                setSelectedEmployeeForBalance(emp);
                                setIsFullWindowLeaveOpen(true);
                              }}
                              style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
                              title="Click to inspect complete leave details and request history in full window"
                            >
                              <td>
                                <UserDisplayCell
                                  name={emp.name}
                                  email={emp.email}
                                  photo={emp.photo}
                                  role={emp.role}
                                  department={emp.department}
                                  employeeType={emp.employeeType}
                                  size={36}
                                />
                              </td>

                              {/* Department & Role */}
                              <td>
                                <div style={{ color: '#E2E8F0', fontWeight: 600, fontSize: '0.88rem' }}>{emp.department || 'General'}</div>
                                <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>{emp.jobPosition || emp.role || 'Staff'}</div>
                              </td>

                              {/* Policy Breakdown Chips */}
                              <td>
                                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', maxWidth: '280px' }}>
                                  {(item.balances || []).map((b, bIdx) => {
                                    const code = b.code || (b.timeOffTypeName || '').slice(0, 3).toUpperCase();
                                    const rem = b.remaining || 0;
                                    return (
                                      <span
                                        key={b.timeOffTypeId || bIdx}
                                        style={{
                                          padding: '0.2rem 0.5rem',
                                          borderRadius: '6px',
                                          fontSize: '0.74rem',
                                          fontWeight: 600,
                                          background: 'rgba(255, 255, 255, 0.04)',
                                          border: '1px solid rgba(255, 255, 255, 0.08)',
                                          color: rem > 0 ? '#CBD5E1' : '#64748B',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.3rem'
                                        }}
                                        title={`${b.timeOffTypeName}: ${rem} days remaining out of ${b.allocated} allocated`}
                                      >
                                        <strong style={{ color: '#A855F7' }}>{code}:</strong>
                                        <span style={{ color: rem > 0 ? '#34D399' : '#94A3B8' }}>{rem}d</span>
                                      </span>
                                    );
                                  })}
                                </div>
                              </td>

                              {/* Remaining Available Leave */}
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '150px' }}>
                                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem' }}>
                                    <span
                                      style={{
                                        fontSize: '1.25rem',
                                        fontWeight: 800,
                                        color: totalRem > 0 ? '#34D399' : '#F87171'
                                      }}
                                    >
                                      {totalRem}
                                    </span>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                      / {totalAlloc} days remaining
                                    </span>
                                  </div>

                                  {/* Progress bar */}
                                  <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div
                                      style={{
                                        width: `${pctRemaining}%`,
                                        height: '100%',
                                        background: pctRemaining > 50 ? '#10B981' : pctRemaining > 20 ? '#F59E0B' : '#EF4444',
                                        borderRadius: '3px',
                                        transition: 'width 0.3s ease'
                                      }}
                                    />
                                  </div>
                                </div>
                              </td>

                              {/* Days Used */}
                              <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                <span
                                  style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    color: totalUsed > 0 ? '#F87171' : 'var(--text-muted)'
                                  }}
                                >
                                  {totalUsed}d
                                </span>
                              </td>

                              {/* Pending Approvals */}
                              <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                {totalPend > 0 ? (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.35rem',
                                      padding: '0.28rem 0.65rem',
                                      borderRadius: '6px',
                                      fontSize: '0.78rem',
                                      fontWeight: 600,
                                      background: 'rgba(245, 158, 11, 0.12)',
                                      color: '#FBBF24',
                                      border: '1px solid rgba(245, 158, 11, 0.3)',
                                      whiteSpace: 'nowrap',
                                      boxShadow: '0 1px 4px rgba(0,0,0,0.15)'
                                    }}
                                    title={`${totalPend} day(s) currently awaiting approval`}
                                  >
                                    <Clock size={12} color="#FBBF24" />
                                    <span>{totalPend}d Pending</span>
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 500 }}>
                                    0d
                                  </span>
                                )}
                              </td>

                              {/* Full Window Action */}
                              <td style={{ textAlign: 'right' }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEmployeeForBalance(emp);
                                    setIsFullWindowLeaveOpen(true);
                                  }}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.45rem',
                                    padding: '0.4rem 0.85rem',
                                    borderRadius: '8px',
                                    background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(147, 51, 234, 0.25))',
                                    border: '1px solid rgba(168, 85, 247, 0.4)',
                                    color: '#C084FC',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, #7C3AED, #9333EA)';
                                    e.currentTarget.style.color = '#fff';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(147, 51, 234, 0.25))';
                                    e.currentTarget.style.color = '#C084FC';
                                  }}
                                  title="Open comprehensive leave details in full window"
                                >
                                  <Maximize2 size={13} />
                                  <span>View Details</span>
                                  <ChevronRight size={13} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          ) : (
            /* ========================================================================= */
            /* CARDS VIEW WITH EMPLOYEE QUICK SELECTOR */
            /* ========================================================================= */
            <div>
              {/* Employee Selector Bar for HR/Management */}
              {isHR && (
                <div
                  className="glass-panel"
                  style={{
                    padding: '1rem 1.25rem',
                    marginBottom: '1.25rem',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <User size={15} color="#C084FC" />
                      <span>Select Employee to Inspect Live Balances:</span>
                    </div>
                    {selectedEmployeeForBalance && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                          Active: <strong style={{ color: '#fff' }}>{selectedEmployeeForBalance.name}</strong> ({selectedEmployeeForBalance.department || 'General'})
                        </span>
                        <button
                          onClick={() => setIsFullWindowLeaveOpen(true)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '6px',
                            background: 'rgba(124, 58, 237, 0.2)',
                            border: '1px solid rgba(168, 85, 247, 0.35)',
                            color: '#C084FC',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <Maximize2 size={12} />
                          <span>Inspect in Full Window</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Quick Employee Selection Chips */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      overflowX: 'auto',
                      paddingBottom: '0.4rem'
                    }}
                  >
                    <button
                      onClick={() => {
                        setSelectedEmployeeForBalance(null);
                        fetchBalances(user?._id || user?.id);
                      }}
                      style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: '20px',
                        border: !selectedEmployeeForBalance ? '1px solid #A855F7' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: !selectedEmployeeForBalance ? 'rgba(124, 58, 237, 0.3)' : 'rgba(255, 255, 255, 0.04)',
                        color: !selectedEmployeeForBalance ? '#fff' : '#94A3B8',
                        fontSize: '0.8rem',
                        fontWeight: !selectedEmployeeForBalance ? 700 : 500,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>My Own Balances ({user?.name})</span>
                    </button>

                    {employees.map((emp) => {
                      const empId = emp._id || emp.id;
                      const isSelected = selectedEmployeeForBalance && (selectedEmployeeForBalance._id || selectedEmployeeForBalance.id) === empId;
                      return (
                        <button
                          key={empId}
                          onClick={() => {
                            setSelectedEmployeeForBalance(emp);
                            fetchBalances(empId);
                          }}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '20px',
                            border: isSelected ? '1px solid #A855F7' : '1px solid rgba(255, 255, 255, 0.08)',
                            background: isSelected ? 'rgba(124, 58, 237, 0.35)' : 'rgba(255, 255, 255, 0.03)',
                            color: isSelected ? '#fff' : '#CBD5E1',
                            fontSize: '0.8rem',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {emp.photo ? (
                            <img src={emp.photo} alt={emp.name} style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.65rem', fontWeight: 700 }}>
                              {(emp.name || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span>{emp.name}</span>
                          <span style={{ fontSize: '0.7rem', color: isSelected ? '#C084FC' : '#64748B' }}>({emp.department || 'Gen'})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <LeaveBalanceCards balances={balances} />
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP MODALS */}
      {/* ========================================================================= */}
      <RequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={(msg) => {
          showToast(msg);
          refreshAllData();
        }}
        employees={employees}
        types={types}
      />

      <AllocationModal
        isOpen={isAllocationModalOpen}
        onClose={() => setIsAllocationModalOpen(false)}
        onSuccess={(msg) => {
          showToast(msg);
          refreshAllData();
        }}
        employees={employees}
        types={types}
      />

      <TimeOffTypeModal
        isOpen={isTypeModalOpen}
        onClose={() => {
          setIsTypeModalOpen(false);
          setEditingType(null);
        }}
        onSuccess={(msg) => {
          showToast(msg);
          fetchTypes();
        }}
        editType={editingType}
      />

      <RequestDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        onActionSuccess={(msg) => {
          showToast(msg);
          refreshAllData();
        }}
      />

      {/* Full Window Leave & Entitlements Modal */}
      <FullWindowLeaveModal
        isOpen={isFullWindowLeaveOpen}
        onClose={() => setIsFullWindowLeaveOpen(false)}
        employee={selectedEmployeeForBalance || user}
        types={types}
        onRequestTimeOff={() => {
          setIsFullWindowLeaveOpen(false);
          openRequestModal();
        }}
        onAllocateLeave={() => {
          setIsFullWindowLeaveOpen(false);
          openAllocationModal();
        }}
      />
    </div>
  );
};
