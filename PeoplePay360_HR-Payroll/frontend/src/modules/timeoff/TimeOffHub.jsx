import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
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
  AlertCircle
} from 'lucide-react';

import { RequestModal } from './RequestModal';
import { RequestDetailModal } from './RequestDetailModal';
import { AllocationModal } from './AllocationModal';
import { TimeOffTypeModal } from './TimeOffTypeModal';
import { LeaveCalendarView } from './LeaveCalendarView';
import { LeaveBalanceCards } from './LeaveBalanceCards';
import { LeaveAuditTrailView } from './LeaveAuditTrailView';

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
  const [employees, setEmployees] = useState([]);

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
  const fetchBalances = async () => {
    try {
      const res = await api.get('/timeoff/balances');
      if (res.data.success) {
        setBalances(res.data.balances);
      }
    } catch (e) {
      console.error('Balances fetch error:', e);
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
      fetchEmployees()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    refreshAllData();
  }, [statusFilter, typeFilter]);

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
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
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
      <div style={{
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
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

              <select
                className="form-select"
                style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Refused">Refused</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Draft">Draft</option>
              </select>

              <select
                className="form-select"
                style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All Leave Types</option>
                {types.map((t) => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className="avatar-circle">
                            {getInitials(req.employeeName)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#fff' }}>{req.employeeName}</div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{req.department || 'General'}</span>
                          </div>
                        </div>
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

              <select
                className="form-select"
                style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Refused">Refused</option>
              </select>
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
      {subTab === 'balances' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                {isHR ? 'Staff Leave Balances & Entitlements' : 'My Leave Balances'}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Real-time calculated available days across all active policies
              </p>
            </div>
            <button onClick={() => openRequestModal()} className="btn-primary">
              <Plus size={16} /> Request Time Off
            </button>
          </div>

          <LeaveBalanceCards balances={balances} />
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
    </div>
  );
};
