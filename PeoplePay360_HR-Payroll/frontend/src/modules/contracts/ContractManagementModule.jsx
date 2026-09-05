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
  Trash2, 
  RefreshCw, 
  DollarSign, 
  Building, 
  Calendar,
  Eye,
  ShieldCheck
} from 'lucide-react';

export const ContractManagementModule = () => {
  const { user } = useAuth();
  const isHRAdmin = user && ['Admin', 'HR Payroll Manager', 'HR Manager', 'HR Payroll User'].includes(user.role);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContractForEdit, setSelectedContractForEdit] = useState(null);
  const [isRenewalMode, setIsRenewalMode] = useState(false);

  // Employee Details Modal State
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedContractForDetails, setSelectedContractForDetails] = useState(null);

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

  const handleDeleteContract = async (contractId, ref) => {
    if (!isHRAdmin) return;
    if (!window.confirm(`Are you sure you want to delete contract record '${ref}'?`)) return;
    try {
      await api.delete(`/contracts/${contractId}`);
      await loadContracts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete contract');
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

  // Deduplicate contracts for main directory list table (show 1 consolidated row per unique employee)
  const displayContracts = React.useMemo(() => {
    let list = contracts;
    if (!isHRAdmin && user) {
      const uEmail = (user.email || '').toLowerCase().trim();
      const uName = (user.name || '').toLowerCase().trim();
      const uId = String(user.id || user._id || '');
      list = contracts.filter(
        (c) =>
          (c.employeeEmail && c.employeeEmail.toLowerCase().trim() === uEmail) ||
          (c.employeeId && String(c.employeeId) === uId) ||
          (c.employeeName && c.employeeName.toLowerCase().trim() === uName)
      );
    }

    if (statusFilter) {
      return list;
    }

    const employeeMap = new Map();
    list.forEach((c) => {
      const key = (c.employeeEmail || c.employeeName || c.id || c._id).toLowerCase().trim();
      if (!employeeMap.has(key)) {
        employeeMap.set(key, c);
      } else {
        const existing = employeeMap.get(key);
        if (existing.status !== 'RUNNING' && c.status === 'RUNNING') {
          employeeMap.set(key, c);
        }
      }
    });

    return Array.from(employeeMap.values());
  }, [contracts, statusFilter, isHRAdmin, user]);

  // Metrics computation
  const activeCount = contracts.filter((c) => c.status === 'RUNNING').length;
  const draftCount = contracts.filter((c) => c.status === 'DRAFT').length;
  const expiredCount = contracts.filter((c) => c.status === 'EXPIRED').length;
  const totalWageCommitment = contracts
    .filter((c) => c.status === 'RUNNING')
    .reduce((acc, c) => acc + (Number(c.wage) || 0), 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RUNNING':
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
            Running
          </span>
        );
      case 'DRAFT':
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
      case 'EXPIRED':
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
            EXPIRED
          </span>
        );
      default:
        return (
          <span style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.78rem' }}>
            {status}
          </span>
        );
    }
  };

  const handleEditFromDetails = (contract) => {
    if (!isHRAdmin) return;
    setSelectedContractForEdit(contract);
    setIsRenewalMode(false);
    setIsModalOpen(true);
  };

  if (isDetailsOpen && selectedContractForDetails) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
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
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
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
            ${totalWageCommitment.toLocaleString()} /mo
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', position: 'relative', zIndex: 50 }}>
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
              options={[
                { value: '', label: 'All Departments' },
                { value: 'Engineering', label: 'Engineering' },
                { value: 'Executive Management', label: 'Executive Management' },
                { value: 'HR & Operations', label: 'HR & Operations' },
                { value: 'Sales & Marketing', label: 'Sales & Marketing' }
              ]}
              value={deptFilter}
              onChange={(val) => setDeptFilter(val)}
              placeholder="All Departments"
            />
          </div>
        </div>

        <button onClick={loadContracts} className="btn-secondary" style={{ padding: '0.6rem 0.9rem' }} title="Refresh Contracts">
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
                    const isRunning = c.status === 'RUNNING';
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
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FBBF24', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span>{c.employeeType || 'Contract'}</span>
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
                            📅 {c.startDate} {c.endDate ? `to ${c.endDate}` : '(Indefinite)'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{c.department}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{c.jobPosition}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#10B981', fontSize: '0.95rem' }}>
                            ${Number(c.wage || 0).toLocaleString()}
                          </div>
                        </td>
                        <td>{getStatusBadge(c.status)}</td>
                        <td>
                          {isHRAdmin ? (
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button
                                onClick={() => {
                                  setSelectedContractForEdit(c);
                                  setIsRenewalMode(false);
                                  setIsModalOpen(true);
                                }}
                                className="btn-secondary"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
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

                              {c.status === 'DRAFT' && (
                                <button
                                  onClick={() => handleActivateContract(c.id || c._id)}
                                  className="btn-primary"
                                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#34D399' }}
                                  title="Activate this contract as RUNNING for payroll"
                                >
                                  Activate
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteContract(c.id || c._id, c.contractRef)}
                                className="btn-danger-outline"
                                style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                                title="Delete record"
                              >
                                <Trash2 size={13} />
                              </button>
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

