import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { UserAvatarHoverPreview } from '../../components/UserAvatarHoverPreview';
import { ContractFormModal } from './ContractFormModal';
import { EmployeeContractDetailsModal } from './EmployeeContractDetailsModal';
import CustomDropdown from '../../components/CustomDropdown';
import { 
  FileText, 
  Search, 
  Plus, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Edit2, 
  RefreshCw, 
  DollarSign, 
  Building, 
  Calendar,
  Eye,
  ShieldCheck,
  MoreVertical,
  XCircle
} from 'lucide-react';
import { StatusToggleSwitch } from '../../components/StatusToggleSwitch';

export const ContractManagementModule = () => {
  const { user } = useAuth();
  const isHRAdmin = user && ['Admin', 'HR Payroll Manager', 'HR Manager', 'HR Payroll User'].includes(user.role);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [departmentsList, setDepartmentsList] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContractForEdit, setSelectedContractForEdit] = useState(null);
  const [isRenewalMode, setIsRenewalMode] = useState(false);

  // Employee Details Modal State
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedContractForDetails, setSelectedContractForDetails] = useState(null);

  // Dropdown action menu state
  const [activeDropdownContractId, setActiveDropdownContractId] = useState(null);

  useEffect(() => {
    const handleOutsideClick = () => setActiveDropdownContractId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const loadDepartments = async (contractsData = []) => {
    const deptSet = new Set();
    try {
      const res = await api.get('/settings/departments');
      const list = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data?.departments)
        ? res.data.departments
        : Array.isArray(res.data)
        ? res.data
        : [];

      list.forEach((d) => {
        const name = typeof d === 'string' ? d : d.name;
        if (name && name.trim()) deptSet.add(name.trim());
      });

      if (list.length > 0) {
        localStorage.setItem('peoplepay360_departments', JSON.stringify(list));
      }
    } catch (err) {
      console.warn('[ContractManagement] Could not fetch departments from DB, using cache:', err.message);
      const cached = localStorage.getItem('peoplepay360_departments');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            parsed.forEach((d) => {
              const name = typeof d === 'string' ? d : d.name;
              if (name && name.trim()) deptSet.add(name.trim());
            });
          }
        } catch (e) {}
      }
    }

    // Also include any department values present in loaded contracts
    (contractsData || []).forEach((c) => {
      if (c.department && c.department.trim()) {
        deptSet.add(c.department.trim());
      }
    });

    if (deptSet.size > 0) {
      setDepartmentsList((prev) => {
        const merged = new Set([...prev, ...deptSet]);
        return Array.from(merged).sort((a, b) => a.localeCompare(b));
      });
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (deptFilter) params.department = deptFilter;

      const res = await api.get('/contracts', { params });
      if (res.data.contracts) {
        setContracts(res.data.contracts);
        loadDepartments(res.data.contracts);
      }
    } catch (err) {
      console.error('[Load Contracts Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, [search, statusFilter, deptFilter]);

  const handleActivateContract = async (contractId) => {
    if (!isHRAdmin) return;
    try {
      await api.put(`/contracts/${contractId}/status`, { status: 'RUNNING' });
      await loadContracts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to activate contract');
    }
  };

  const handleToggleContractStatus = async (contractId, currentStatus) => {
    if (!isHRAdmin) return;
    const isRunning = ['running', 'active'].includes((currentStatus || '').toLowerCase());
    const targetStatus = isRunning ? 'EXPIRED' : 'RUNNING';
    try {
      await api.put(`/contracts/${contractId}/status`, { status: targetStatus });
      await loadContracts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update contract status');
    }
  };

  const handleOpenDetails = (contract) => {
    setSelectedContractForDetails(contract);
    setIsDetailsOpen(true);
  };

  const handleRenewPlan = (contract) => {
    if (!isHRAdmin) return;
    setSelectedContractForEdit(contract);
    setIsRenewalMode(true);
    setIsModalOpen(true);
  };

  // Map total contract counts per employee for renewal count calculation
  const employeeContractCounts = React.useMemo(() => {
    const map = new Map();
    contracts.forEach((c) => {
      const key = (c.employeeEmail || c.employeeName || c.id || c._id).toLowerCase().trim();
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [contracts]);

  // Only include Contract-based employees in Contract Management module
  const contractEmployeesOnly = React.useMemo(() => {
    return contracts.filter((c) => {
      const type = (c.employeeType || '').trim().toLowerCase();
      if (type === 'permanent') return false;
      return type === 'contract' || Boolean(c.endDate || c.contractDuration);
    });
  }, [contracts]);

  // Deduplicate contracts for main directory list table (show 1 consolidated row per unique employee)
  const displayContracts = React.useMemo(() => {
    let list = contractEmployeesOnly;
    if (!isHRAdmin && user) {
      const uEmail = (user.email || '').toLowerCase().trim();
      const uName = (user.name || '').toLowerCase().trim();
      const uId = String(user.id || user._id || '');
      list = contractEmployeesOnly.filter(
        (c) =>
          (c.employeeEmail && c.employeeEmail.toLowerCase().trim() === uEmail) ||
          (c.employeeId && String(c.employeeId) === uId) ||
          (c.employeeName && c.employeeName.toLowerCase().trim() === uName)
      );
    }

    if (deptFilter) {
      const targetDept = deptFilter.trim().toLowerCase();
      list = list.filter((c) => (c.department || '').trim().toLowerCase() === targetDept);
    }

    if (statusFilter) {
      return list;
    }

    const isRunningStatus = (s) => ['running', 'active'].includes((s || '').toLowerCase());

    const employeeMap = new Map();
    list.forEach((c) => {
      const key = (c.employeeEmail || c.employeeName || c.id || c._id).toLowerCase().trim();
      if (!employeeMap.has(key)) {
        employeeMap.set(key, c);
      } else {
        const existing = employeeMap.get(key);
        if (!isRunningStatus(existing.status) && isRunningStatus(c.status)) {
          employeeMap.set(key, c);
        }
      }
    });

    return Array.from(employeeMap.values());
  }, [contractEmployeesOnly, statusFilter, deptFilter, isHRAdmin, user]);

  const isRunningStatus = (s) => ['running', 'active'].includes((s || '').toLowerCase());
  const isDraftStatus = (s) => ['draft', 'new'].includes((s || '').toLowerCase());
  const isExpiredStatus = (s) => ['expired', 'terminated', 'cancelled', 'closed'].includes((s || '').toLowerCase());

  // Metrics computation strictly for contract employees
  const activeCount = contractEmployeesOnly.filter((c) => isRunningStatus(c.status)).length;
  const draftCount = contractEmployeesOnly.filter((c) => isDraftStatus(c.status)).length;
  const expiredCount = contractEmployeesOnly.filter((c) => isExpiredStatus(c.status)).length;
  const totalWageCommitment = contractEmployeesOnly
    .filter((c) => isRunningStatus(c.status))
    .reduce((acc, c) => acc + (Number(c.wage) || 0), 0);

  const formatDateDisplay = (d) => {
    if (!d) return '';
    try {
      const s = typeof d === 'string' ? d.split('T')[0] : new Date(d).toISOString().split('T')[0];
      return s;
    } catch {
      return String(d);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'RUNNING' || s === 'ACTIVE') {
      return (
        <span style={{
          background: 'rgba(16, 185, 129, 0.2)',
          color: '#34D399',
          border: '1px solid rgba(16, 185, 129, 0.45)',
          padding: '0.25rem 0.65rem',
          borderRadius: '6px',
          fontSize: '0.78rem',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          boxShadow: '0 0 8px rgba(16, 185, 129, 0.2)'
        }}>
          <CheckCircle2 size={12} />
          Active
        </span>
      );
    }
    if (s === 'DRAFT' || s === 'NEW') {
      return (
        <span style={{
          background: 'rgba(245, 158, 11, 0.2)',
          color: '#FBBF24',
          border: '1px solid rgba(245, 158, 11, 0.45)',
          padding: '0.25rem 0.65rem',
          borderRadius: '6px',
          fontSize: '0.78rem',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem'
        }}>
          <Clock size={12} />
          Draft
        </span>
      );
    }
    if (s === 'EXPIRED' || s === 'TERMINATED' || s === 'CANCELLED') {
      return (
        <span style={{
          background: 'rgba(148, 163, 184, 0.15)',
          color: '#94A3B8',
          border: '1px solid rgba(148, 163, 184, 0.3)',
          padding: '0.25rem 0.65rem',
          borderRadius: '6px',
          fontSize: '0.78rem',
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem'
        }}>
          <AlertCircle size={12} />
          Expired
        </span>
      );
    }
    return (
      <span style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.78rem' }}>
        {status}
      </span>
    );
  };

  const handleEditFromDetails = (contract) => {
    if (!isHRAdmin) return;
    setSelectedContractForEdit(contract);
    setIsRenewalMode(false);
    setIsModalOpen(true);
  };

  const departmentDropdownOptions = React.useMemo(() => {
    const list = [...departmentsList];
    if (deptFilter && !list.includes(deptFilter)) {
      list.push(deptFilter);
    }
    return [
      { value: '', label: 'All Departments' },
      ...list.map((d) => ({ value: d, label: d }))
    ];
  }, [departmentsList, deptFilter]);

  if (isDetailsOpen && selectedContractForDetails) {
    return (
      <div className="responsive-page-container">
        <EmployeeContractDetailsModal
          isOpen={true}
          onClose={() => setIsDetailsOpen(false)}
          contractData={selectedContractForDetails}
          onRenewPlan={handleRenewPlan}
          onEditContract={handleEditFromDetails}
        />
        <ContractFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          contractToEdit={selectedContractForEdit}
          isRenewal={isRenewalMode}
          onSaved={loadContracts}
        />
      </div>
    );
  }

  return (
    <div className="responsive-page-container">
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileText color="#10B981" size={28} />
            Contract Management & Employment Terms
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Maintain historical contract records, terms, wages, and active payroll contract tracking
          </p>
        </div>

        {isHRAdmin && (
          <button
            onClick={() => {
              setSelectedContractForEdit(null);
              setIsRenewalMode(false);
              setIsModalOpen(true);
            }}
            className="btn-primary"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
          >
            <Plus size={18} />
            <span>Create New Contract</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '0.78rem', color: '#34D399', textTransform: 'uppercase', fontWeight: 600 }}>Active Running Contracts</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10B981', marginTop: '0.2rem' }}>{activeCount}</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '0.78rem', color: '#FBBF24', textTransform: 'uppercase', fontWeight: 600 }}>Draft Contracts</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F59E0B', marginTop: '0.2rem' }}>{draftCount}</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #94A3B8' }}>
          <div style={{ fontSize: '0.78rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Expired / Historical</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#94A3B8', marginTop: '0.2rem' }}>{expiredCount}</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #60A5FA' }}>
          <div style={{ fontSize: '0.78rem', color: '#93C5FD', textTransform: 'uppercase', fontWeight: 600 }}>Monthly Wage Commitment</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#60A5FA', marginTop: '0.2rem' }}>
            ₹{totalWageCommitment.toLocaleString()} /mo
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel toolbar-flex-wrap" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', position: 'relative', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
            <Search size={18} color="#64748B" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search contract ref, employee, position..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '180px' }}>
            <Filter size={16} color="var(--text-muted)" />
            <CustomDropdown
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'RUNNING', label: 'Running' },
                { value: 'DRAFT', label: 'Draft' },
                { value: 'EXPIRED', label: 'Expired' }
              ]}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              placeholder="All Statuses"
            />
          </div>

          <div style={{ minWidth: '180px' }}>
            <CustomDropdown
              options={departmentDropdownOptions}
              value={deptFilter}
              onChange={(val) => setDeptFilter(val)}
              placeholder="All Departments"
            />
          </div>
        </div>

        <button
          onClick={() => {
            loadContracts();
            loadDepartments(contracts);
          }}
          className="btn-secondary"
          style={{ padding: '0.6rem 0.9rem' }}
          title="Refresh Contracts & Departments"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Main Contracts Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading employment contract records...</div>
      ) : (
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Contract Ref</th>
                  <th>Employee Details</th>
                  <th>Type & Duration</th>
                  <th>Department & Position</th>
                  <th>Wage ($/mo)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayContracts.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No contract records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  displayContracts.map((c) => {
                    const isRunning = isRunningStatus(c.status);
                    const isPermanent = c.employeeType === 'Permanent';
                    return (
                      <tr key={c.id || c._id} style={{ background: isRunning ? 'rgba(16, 185, 129, 0.04)' : 'transparent' }}>
                        <td>
                          <div
                            onClick={() => handleOpenDetails(c)}
                            style={{ fontWeight: 700, color: isRunning ? '#34D399' : '#fff', letterSpacing: '0.03em', cursor: 'pointer' }}
                            title="Click to view full employee & contract details"
                          >
                            {c.contractRef}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                            By {c.createdByName || 'HR Admin'}
                          </div>
                        </td>
                        <td>
                          <div
                            onClick={() => handleOpenDetails(c)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                            title="Click to view full employee & contract details"
                          >
                            <UserAvatarHoverPreview name={c.employeeName} role="Employee" photoUrl="" size={36} />
                            <div>
                              <div style={{ fontWeight: 600, color: '#fff' }}>{c.employeeName}</div>
                              {c.employeeEmail && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.employeeEmail}</div>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: isPermanent ? '#34D399' : '#FBBF24', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span>{c.employeeType || 'Permanent'}</span>
                            {(() => {
                              const empKey = (c.employeeEmail || c.employeeName || c.id || c._id).toLowerCase().trim();
                              const totalCount = employeeContractCounts.get(empKey) || 1;
                              const renewCount = Math.max(0, totalCount - 1);
                              if (renewCount > 0) {
                                return (
                                  <span style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    color: '#34D399',
                                    border: '1px solid rgba(16, 185, 129, 0.35)',
                                    padding: '0.1rem 0.45rem',
                                    borderRadius: '4px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.2rem'
                                  }} title={`This contract has been renewed ${renewCount} time(s)`}>
                                    <RefreshCw size={9} /> Renewed {renewCount}x
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            📅 {formatDateDisplay(c.startDate)} {c.endDate ? `to ${formatDateDisplay(c.endDate)}` : '(Indefinite)'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{c.department}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{c.jobPosition}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#10B981', fontSize: '0.95rem' }}>
                            ₹{Number(c.wage || 0).toLocaleString()}
                          </div>
                        </td>
                        <td>{getStatusBadge(c.status)}</td>
                        <td>
                          {isHRAdmin ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', position: 'relative' }}>
                              <button
                                onClick={() => {
                                  setSelectedContractForEdit(c);
                                  setIsRenewalMode(false);
                                  setIsModalOpen(true);
                                }}
                                className="btn-secondary"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                title="Edit contract terms"
                              >
                                <Edit2 size={13} />
                                Edit
                              </button>

                              {/* Renew Plan Action Button */}
                              <button
                                onClick={() => handleRenewPlan(c)}
                                className="btn-primary"
                                style={{
                                  padding: '0.3rem 0.65rem',
                                  fontSize: '0.75rem',
                                  background: 'linear-gradient(135deg, #10B981, #059669)',
                                  color: '#fff',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                                title="Renew plan with new duration & terms"
                              >
                                <RefreshCw size={12} />
                                Renew Plan
                              </button>

                              {/* 3-Dots Action Menu */}
                              <div style={{ position: 'relative' }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const cId = c.id || c._id;
                                    setActiveDropdownContractId(activeDropdownContractId === cId ? null : cId);
                                  }}
                                  style={{
                                    background: activeDropdownContractId === (c.id || c._id) ? 'rgba(124, 58, 237, 0.3)' : 'rgba(255, 255, 255, 0.06)',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    color: '#E2E8F0',
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                  title="Actions & Options"
                                >
                                  <MoreVertical size={14} />
                                </button>

                                {/* Dropdown Menu */}
                                {activeDropdownContractId === (c.id || c._id) && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      position: 'absolute',
                                      right: 0,
                                      top: 'calc(100% + 4px)',
                                      background: '#1A162B',
                                      border: '1px solid rgba(255, 255, 255, 0.15)',
                                      borderRadius: '10px',
                                      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.65)',
                                      padding: '0.35rem',
                                      minWidth: '200px',
                                      zIndex: 100,
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '0.2rem',
                                      textAlign: 'left'
                                    }}
                                  >
                                    <button
                                      onClick={() => {
                                        setActiveDropdownContractId(null);
                                        setSelectedContractForEdit(c);
                                        setIsRenewalMode(false);
                                        setIsModalOpen(true);
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.6rem',
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: 'transparent',
                                        color: '#E2E8F0',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        width: '100%',
                                        transition: 'background 0.15s'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                      <Edit2 size={13} color="#A78BFA" />
                                      <span>Edit Contract</span>
                                    </button>

                                    <button
                                      onClick={() => {
                                        setActiveDropdownContractId(null);
                                        handleRenewPlan(c);
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.6rem',
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: 'transparent',
                                        color: '#E2E8F0',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        width: '100%',
                                        transition: 'background 0.15s'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                      <RefreshCw size={13} color="#10B981" />
                                      <span>Renew Plan</span>
                                    </button>

                                    <button
                                      onClick={() => {
                                        setActiveDropdownContractId(null);
                                        handleToggleContractStatus(c.id || c._id, c.status);
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: 'transparent',
                                        color: isRunningStatus(c.status) ? '#FBBF24' : '#34D399',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        width: '100%',
                                        transition: 'background 0.15s'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        {isRunningStatus(c.status) ? <XCircle size={14} color="#FBBF24" /> : <CheckCircle2 size={14} color="#34D399" />}
                                        <span>{isRunningStatus(c.status) ? 'Deactivate (Expire)' : 'Activate Contract'}</span>
                                      </div>
                                      <StatusToggleSwitch
                                        isActive={isRunningStatus(c.status)}
                                        onToggle={() => {
                                          setActiveDropdownContractId(null);
                                          handleToggleContractStatus(c.id || c._id, c.status);
                                        }}
                                        size="sm"
                                      />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenDetails(c)}
                              className="btn-secondary"
                              style={{
                                padding: '0.35rem 0.75rem',
                                fontSize: '0.75rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem'
                              }}
                              title="View read-only contract details"
                            >
                              <Eye size={13} />
                              <span>View Details</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Employee & Contract Details Modal */}
      <EmployeeContractDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        contractData={selectedContractForDetails}
        onRenewPlan={handleRenewPlan}
      />

      {/* Contract Form Modal */}
      <ContractFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        contractToEdit={selectedContractForEdit}
        isRenewal={isRenewalMode}
        onSaved={loadContracts}
      />
    </div>
  );
};

