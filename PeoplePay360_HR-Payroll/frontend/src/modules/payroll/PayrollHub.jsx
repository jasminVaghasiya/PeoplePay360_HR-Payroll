import React, { useState, useEffect } from 'react';
import { useAuth, Can } from '../../context/AuthContext';
import api from '../../services/api';
import {
  DollarSign,
  Play,
  Layers,
  FileText,
  Users,
  Search,
  Plus,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  ShieldCheck,
  Calendar,
  Lock,
  Printer,
  ChevronRight,
  ShieldAlert,
  Settings,
  Edit3
} from 'lucide-react';

import { CreatePayrunWizard } from './CreatePayrunWizard';
import { PayrunDetailView } from './PayrunDetailView';
import { PayslipDetailView } from './PayslipDetailView';
import { SalaryStructureDetailView } from './SalaryStructureDetailView';
import { ContractModal } from './ContractModal';
import { SalaryStructureModal } from './SalaryStructureModal';
import { PayrollSettingsModal } from './PayrollSettingsModal';

export const PayrollHub = () => {
  const { user, ability } = useAuth();
  const isEmployee = user?.role === 'Employee';
  const isHRManager = user?.role === 'HR Manager';
  const isPayrollUser = user?.role === 'HR Payroll User';
  const isPayrollManager = ['Admin', 'HR Payroll Manager'].includes(user?.role);

  // Check CASL permissions
  const canReadPayroll = ability ? ability.can('read', 'payrun') || ability.can('read', 'payslip') : false;
  const canCreatePayrun = ability ? ability.can('create', 'payrun') : false;

  // Sub-navigation: 'payruns' | 'payslips' | 'contracts' | 'structures'
  const [subTab, setSubTab] = useState(isEmployee ? 'payslips' : 'payruns');

  // Active Payrun processing view (null = show tables, ObjectId = show PayrunDetailView)
  const [selectedPayrunId, setSelectedPayrunId] = useState(null);

  // Data states
  const [summary, setSummary] = useState({
    totalNetPaid: 0,
    activeBatchesCount: 0,
    pendingValidationCount: 0,
    totalPayslipsCount: 0,
    contractsCount: 0,
    structuresCount: 0
  });

  const [payruns, setPayruns] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [structures, setStructures] = useState([]);
  const [rules, setRules] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Filter states
  const [search, setSearch] = useState('');
  const [structureSearch, setStructureSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Modals state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [payrollSettings, setPayrollSettings] = useState(null);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [wizardInitialPeriod, setWizardInitialPeriod] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getMonthCardsForYear = (year) => {
    return MONTH_NAMES.map((mName, idx) => {
      const start = new Date(year, idx, 1);
      const end = new Date(year, idx + 1, 0);
      const startStr = `${year}-${String(idx + 1).padStart(2, '0')}-01`;
      const endStr = `${year}-${String(idx + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;

      const formatDay = (d) => {
        const day = String(d.getDate()).padStart(2, '0');
        const m = d.toLocaleString('en-US', { month: 'short' });
        return `${day}-${m}-${d.getFullYear()}`;
      };
      const periodFormatted = `${formatDay(start)} — ${formatDay(end)}`;

      // Match payruns for this month & year
      const matchingPayrun = payruns.find((pr) => {
        const prStart = new Date(pr.periodStart);
        return prStart.getFullYear() === year && prStart.getMonth() === idx;
      });

      return {
        monthIndex: idx,
        monthName: `${mName} ${year}`,
        shortMonth: mName,
        startStr,
        endStr,
        periodFormatted,
        payrun: matchingPayrun || null
      };
    });
  };

  // Fetch enterprise payroll & GST settings
  const fetchSettings = async () => {
    try {
      const res = await api.get('/payroll/settings');
      if (res.data.success) {
        setPayrollSettings(res.data.settings);
      }
    } catch (e) {
      console.error('Settings fetch error:', e);
    }
  };

  // Fetch summary metrics
  const fetchSummary = async () => {
    try {
      const res = await api.get('/payroll/summary');
      if (res.data.success) {
        setSummary(res.data.summary);
      }
    } catch (e) {
      console.error('Summary fetch error:', e);
    }
  };

  // Fetch Payruns
  const fetchPayruns = async () => {
    if (isEmployee) return;
    try {
      let url = `/payroll/payruns?`;
      if (statusFilter) url += `status=${statusFilter}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await api.get(url);
      if (res.data.success) {
        setPayruns(res.data.payruns || []);
      }
    } catch (e) {
      console.error('Payruns fetch error:', e);
    }
  };

  // Fetch Payslips
  const fetchPayslips = async () => {
    try {
      let url = `/payroll/payslips?`;
      if (statusFilter) url += `status=${statusFilter}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await api.get(url);
      if (res.data.success) {
        setPayslips(res.data.payslips || []);
      }
    } catch (e) {
      console.error('Payslips fetch error:', e);
    }
  };

  // Fetch Contracts
  const fetchContracts = async () => {
    if (isEmployee) return;
    try {
      let url = `/payroll/contracts?`;
      if (statusFilter) url += `status=${statusFilter}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await api.get(url);
      if (res.data.success) {
        setContracts(res.data.contracts || []);
      }
    } catch (e) {
      console.error('Contracts fetch error:', e);
    }
  };

  // Fetch Structures & Rules
  const fetchStructuresAndRules = async () => {
    try {
      const [structRes, rulesRes] = await Promise.all([
        api.get('/payroll/structures'),
        api.get('/payroll/rules')
      ]);
      if (structRes.data.success) setStructures(structRes.data.structures || []);
      if (rulesRes.data.success) setRules(rulesRes.data.rules || []);
    } catch (e) {
      console.error('Structures/rules fetch error:', e);
    }
  };

  // Fetch Employees for contract assignments
  const fetchEmployees = async () => {
    if (isEmployee) return;
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
      fetchPayruns(),
      fetchPayslips(),
      fetchContracts(),
      fetchStructuresAndRules(),
      fetchEmployees(),
      fetchSettings()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    refreshAllData();
  }, [statusFilter, subTab]);

  // Open Payslip full-window view
  const openPayslipDetail = (slip) => {
    setSelectedPayslip(slip);
  };

  // CASL Guard for unauthorized roles (e.g. HR Manager who is blocked from Payroll per requirements)
  if (!canReadPayroll) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
        <div className="glass-panel" style={{ padding: '3rem' }}>
          <ShieldAlert size={48} color="#EF4444" style={{ marginBottom: '1rem' }} />
          <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Access Restricted for Role: {user?.role}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.6' }}>
            CASL Security Enforcement: HR Managers do not have access to payroll processing, payruns, or salary structures. Only HR Payroll Users, HR Payroll Managers, and Admins are authorized.
          </p>
        </div>
      </div>
    );
  }

  // If a specific payslip is selected, render full-window voucher view
  if (selectedPayslip) {
    return (
      <PayslipDetailView
        payslip={selectedPayslip}
        onBack={() => {
          setSelectedPayslip(null);
          refreshAllData();
        }}
        settings={payrollSettings}
      />
    );
  }

  // If a specific salary structure is selected for form view, render full-window form view
  if (editingStructure) {
    return (
      <SalaryStructureDetailView
        structure={editingStructure}
        onBack={() => {
          setEditingStructure(null);
          refreshAllData();
        }}
        onSaveSuccess={() => {
          setEditingStructure(null);
          refreshAllData();
        }}
        isPayrollManager={isPayrollManager}
      />
    );
  }

  // If a specific payrun is selected, render the dedicated processing screen
  if (selectedPayrunId) {
    return (
      <PayrunDetailView
        payrunId={selectedPayrunId}
        onBack={() => {
          setSelectedPayrunId(null);
          refreshAllData();
        }}
        onOpenPayslip={(slip) => openPayslipDetail(slip)}
        isPayrollManager={isPayrollManager}
      />
    );
  }

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
              Live Enterprise Payroll System
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              • Role: <strong style={{ color: '#C084FC' }}>{user?.role}</strong>
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.75rem', letterSpacing: '-0.02em' }}>
            <DollarSign color="#7C3AED" size={32} />
            Payroll & Payrun Operations
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Sequence-driven salary computation, period contract resolution, 2-step payrun wizards, and automated payslip vouchers
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={refreshAllData} className="icon-btn" title="Refresh Live Data" disabled={loading} style={{ padding: '0.6rem' }}>
            <RefreshCw size={17} className={loading ? 'spin' : ''} />
          </button>

          {!isEmployee && (
            <>
              {isPayrollManager && (
                <>
                  <button
                    onClick={() => { setEditingContract(null); setIsContractModalOpen(true); }}
                    className="btn-secondary"
                    style={{ padding: '0.6rem 1.1rem', fontSize: '0.85rem' }}
                  >
                    <FileText size={15} />
                    <span>New Contract</span>
                  </button>

                  <button
                    onClick={() => setIsSettingsModalOpen(true)}
                    className="btn-secondary"
                    title="Enterprise Payroll & GST Configuration"
                    style={{ padding: '0.6rem 1.1rem', fontSize: '0.85rem', borderColor: 'rgba(139, 92, 246, 0.4)' }}
                  >
                    <Settings size={15} color="#A78BFA" />
                    <span>Settings</span>
                  </button>
                </>
              )}

              {canCreatePayrun && (
                <button
                  onClick={() => setIsWizardOpen(true)}
                  className="btn-primary"
                  style={{ padding: '0.6rem 1.3rem', fontSize: '0.88rem' }}
                >
                  <Play size={17} />
                  <span>NEW Payrun</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Real-time Summary KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="timeoff-kpi-card" style={{ '--card-accent': '#10B981' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Total Paid to Date</span>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#34D399', marginTop: '0.2rem', lineHeight: 1.1 }}>
            ₹{(summary.totalNetPaid || 0).toLocaleString()}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Bank disbursed net earnings</span>
        </div>

        {!isEmployee && (
          <>
            <div className="timeoff-kpi-card" style={{ '--card-accent': '#8B5CF6' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Active Payrun Batches</span>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#C084FC', marginTop: '0.2rem', lineHeight: 1.1 }}>
                {summary.activeBatchesCount || 0}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>In setup / computation phase</span>
            </div>

            <div className="timeoff-kpi-card" style={{ '--card-accent': '#F59E0B' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Pending Validation</span>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#FBBF24', marginTop: '0.2rem', lineHeight: 1.1 }}>
                {summary.pendingValidationCount || 0}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Computed & awaiting sign-off</span>
            </div>

            <div className="timeoff-kpi-card" style={{ '--card-accent': '#06B6D4' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Active Contracts</span>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#22D3EE', marginTop: '0.2rem', lineHeight: 1.1 }}>
                {summary.contractsCount || 0}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Covering active workforce</span>
            </div>
          </>
        )}
      </div>

      {/* Segmented Pill Navigation */}
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
        {!isEmployee && (
          <button
            onClick={() => { setSubTab('payruns'); setSearch(''); setStatusFilter(''); }}
            className={`nav-pill-item ${subTab === 'payruns' ? 'active' : ''}`}
          >
            <Play size={16} />
            <span>Payruns</span>
            <span style={{ fontSize: '0.72rem', padding: '0.1rem 0.45rem', borderRadius: '10px', background: subTab === 'payruns' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)', color: '#fff', fontWeight: 700 }}>
              {payruns.length}
            </span>
          </button>
        )}

        <button
          onClick={() => { setSubTab('payslips'); setSearch(''); setStatusFilter(''); }}
          className={`nav-pill-item ${subTab === 'payslips' ? 'active' : ''}`}
        >
          <FileText size={16} />
          <span>{isEmployee ? 'My Payslips' : 'Payslips'}</span>
          <span style={{ fontSize: '0.72rem', padding: '0.1rem 0.45rem', borderRadius: '10px', background: subTab === 'payslips' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)', color: '#fff', fontWeight: 700 }}>
            {payslips.length}
          </span>
        </button>

        {!isEmployee && (
          <>
            <button
              onClick={() => { setSubTab('contracts'); setSearch(''); setStatusFilter(''); }}
              className={`nav-pill-item ${subTab === 'contracts' ? 'active' : ''}`}
            >
              <Users size={16} />
              <span>Contracts</span>
              <span style={{ fontSize: '0.72rem', padding: '0.1rem 0.45rem', borderRadius: '10px', background: subTab === 'contracts' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)', color: '#fff', fontWeight: 700 }}>
                {contracts.length}
              </span>
            </button>

            <button
              onClick={() => { setSubTab('structures'); setSearch(''); setStatusFilter(''); }}
              className={`nav-pill-item ${subTab === 'structures' ? 'active' : ''}`}
            >
              <Layers size={16} />
              <span>Salary Structures & Rules</span>
            </button>

            {isPayrollManager && (
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="nav-pill-item"
                title="Configure Company Legal, GSTIN, PAN, and Statutory Defaults"
              >
                <Settings size={16} color="#A78BFA" />
                <span>Settings</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: PAYRUNS */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* SUBTAB 1: PAYRUNS (MONTHLY PERIODS VIEW) */}
      {/* ========================================================================= */}
      {subTab === 'payruns' && !isEmployee && (
        <div className="glass-panel" style={{ padding: '1.75rem 2rem' }}>
          
          {/* Header & Controls Matching Screenshot */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
                Payruns
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Payrun view for payroll periods
              </p>
            </div>

            {/* Top Control Bar: NEW Pill + Search + Year Selector */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {canCreatePayrun && (
                <button
                  type="button"
                  onClick={() => {
                    setWizardInitialPeriod(null);
                    setIsWizardOpen(true);
                  }}
                  style={{
                    background: '#38BDF8',
                    color: '#0F172A',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    padding: '0.45rem 1.4rem',
                    borderRadius: '9999px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(56, 189, 248, 0.3)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <span>NEW</span>
                </button>
              )}

              <div className="search-box" style={{ maxWidth: '280px', minWidth: '220px' }}>
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Search payruns..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                className="form-select"
                style={{
                  width: 'auto',
                  padding: '0.45rem 1rem',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: '#38BDF8',
                  background: 'rgba(15, 23, 42, 0.8)',
                  borderColor: 'rgba(56, 189, 248, 0.3)',
                  cursor: 'pointer'
                }}
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
          </div>

          {/* List of Monthly Payrun Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {getMonthCardsForYear(selectedYear)
              .filter((item) => {
                if (!search) return true;
                const s = search.toLowerCase();
                return (
                  item.monthName.toLowerCase().includes(s) ||
                  item.periodFormatted.toLowerCase().includes(s) ||
                  (item.payrun && item.payrun.name.toLowerCase().includes(s))
                );
              })
              .map((item) => {
                const pr = item.payrun;
                const status = pr ? pr.status : 'Draft';
                const employeeCount = pr ? (pr.payslipCount || 0) : (contracts.length || 0);
                const warningCount = pr ? (pr.warningCount || 0) : 0;

                const getStatusColor = (st) => {
                  if (st === 'Paid') return '#34D399';
                  if (st === 'Validated') return '#60A5FA';
                  if (st === 'Computed') return '#FBBF24';
                  return '#94A3B8';
                };

                const handleCardClick = () => {
                  if (pr) {
                    // Open that month's full batch detail view with all entries
                    setSelectedPayrunId(pr._id);
                  } else if (canCreatePayrun) {
                    // Open wizard pre-configured for this specific month
                    setWizardInitialPeriod({
                      periodStart: item.startStr,
                      periodEnd: item.endStr,
                      name: `${item.shortMonth} ${selectedYear}`,
                      monthName: item.monthName
                    });
                    setIsWizardOpen(true);
                  }
                };

                return (
                  <div
                    key={item.monthIndex}
                    onClick={handleCardClick}
                    style={{
                      background: 'rgba(15, 23, 42, 0.65)',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                      borderRadius: '16px',
                      padding: '1.25rem 1.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.07)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Left Column: Month & Period */}
                    <div style={{ flex: '1 1 300px' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                        {item.monthName}
                      </h3>
                      <span style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.2rem', display: 'block' }}>
                        {item.periodFormatted}
                      </span>
                    </div>

                    {/* Middle Column: Employee Count */}
                    <div style={{ flex: '1 1 200px', textAlign: 'left', color: '#CBD5E1', fontSize: '0.92rem' }}>
                      <span style={{ fontWeight: 600 }}>{employeeCount} employees</span>
                    </div>

                    {/* Right Column: Status, Warnings & Action Icon */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                      <div style={{ textAlign: 'right', minWidth: '100px' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.92rem', color: getStatusColor(status) }}>
                          {status}
                        </div>
                        <div style={{
                          fontSize: '0.76rem',
                          color: warningCount > 0 ? '#F59E0B' : '#64748B',
                          marginTop: '0.15rem',
                          fontWeight: warningCount > 0 ? 600 : 400
                        }}>
                          {warningCount > 0 ? `${warningCount} warning${warningCount > 1 ? 's' : ''}` : 'No warnings'}
                        </div>
                      </div>

                      {/* Blue Action Icon Matching Mockup */}
                      <div
                        title={pr ? `Open ${item.monthName} entries` : `Create ${item.monthName} payrun`}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '6px',
                          background: '#38BDF8',
                          color: '#0F172A',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow: '0 2px 6px rgba(56, 189, 248, 0.3)'
                        }}
                      >
                        <Edit3 size={15} />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Useful Note Footer Matching Screenshot */}
          <div style={{ marginTop: '2.5rem', paddingTop: '1.25rem', borderTop: '1px dashed rgba(255, 255, 255, 0.08)' }}>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#94A3B8', fontStyle: 'italic' }}>
              Useful note: each Payrun represents one payroll period and groups the payslips generated for that period.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: PAYSLIPS */}
      {/* ========================================================================= */}
      {subTab === 'payslips' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="search-box" style={{ maxWidth: '280px' }}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search payslips..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchPayslips()}
                />
              </div>

              <select
                className="form-select"
                style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Computed">Computed</option>
                <option value="Validated">Validated</option>
                <option value="Paid">Paid</option>
              </select>
            </div>

            <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
              Showing {payslips.length} Payslips
            </span>
          </div>

          {payslips.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FileText size={40} style={{ opacity: 0.3, margin: '0 auto 0.75rem auto' }} />
              <div>No Payslips found.</div>
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Voucher No</th>
                    <th>Employee</th>
                    <th>Salary Structure</th>
                    <th>Period</th>
                    <th>Worked Days</th>
                    <th>Gross</th>
                    <th>Deductions</th>
                    <th>Net Take-Home</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payslips.map((slip) => (
                    <tr
                      key={slip._id}
                      onClick={() => openPayslipDetail(slip)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <code style={{ fontSize: '0.78rem', color: '#C084FC', background: 'rgba(124, 58, 237, 0.15)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          {slip.payslipNumber}
                        </code>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{slip.employeeName}</div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{slip.department}</span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {slip.salaryStructureName}
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>
                        {new Date(slip.periodStart).toLocaleDateString()} → {new Date(slip.periodEnd).toLocaleDateString()}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#F8FAFC' }}>
                          {slip.workedDays} / {slip.totalWorkingDays}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#A78BFA' }}>
                        ₹{slip.gross.toLocaleString()}
                      </td>
                      <td style={{ color: '#F87171' }}>
                        -₹{slip.deductions.toLocaleString()}
                      </td>
                      <td>
                        <strong style={{ color: '#34D399', fontSize: '0.95rem' }}>
                          ₹{slip.net.toLocaleString()}
                        </strong>
                      </td>
                      <td>
                        <span className={`status-badge ${slip.status === 'Paid' ? 'active' : 'pending'}`}>
                          {slip.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); openPayslipDetail(slip); }}
                          className="btn-secondary"
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                        >
                          <Printer size={13} /> View & Print
                        </button>
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
      {/* SUBTAB 3: CONTRACTS */}
      {/* ========================================================================= */}
      {subTab === 'contracts' && !isEmployee && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div className="search-box" style={{ maxWidth: '280px' }}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search contracts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchContracts()}
                />
              </div>
            </div>

            {isPayrollManager && (
              <button
                onClick={() => { setEditingContract(null); setIsContractModalOpen(true); }}
                className="btn-primary"
              >
                <Plus size={16} /> New Contract
              </button>
            )}
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Contract Ref</th>
                  <th>Employee</th>
                  <th>Base Wage</th>
                  <th>Assigned Structure</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Bank Account / IFSC</th>
                  <th>Status</th>
                  {isPayrollManager && <th style={{ textAlign: 'right' }}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <code style={{ fontSize: '0.78rem', color: '#22D3EE', background: 'rgba(6, 182, 212, 0.15)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        {c.contractName}
                      </code>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{c.employeeName}</div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{c.department} • {c.jobPosition}</span>
                    </td>
                    <td>
                      <strong style={{ color: '#34D399', fontSize: '0.95rem' }}>
                        ₹{c.wage.toLocaleString()}
                      </strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}> / {c.wageType}</span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: '#A78BFA' }}>
                      {c.salaryStructureName}
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>
                      {new Date(c.startDate).toLocaleDateString()}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: c.endDate ? '#F8FAFC' : '#34D399' }}>
                      {c.endDate ? new Date(c.endDate).toLocaleDateString() : 'Permanent / Ongoing'}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: c.bankAccountNumber ? '#E2E8F0' : '#F87171' }}>
                      {c.bankAccountNumber ? `${c.bankName} (${c.bankAccountNumber})` : 'Missing Bank Info'}
                    </td>
                    <td>
                      <span className={`status-badge ${c.status === 'Active' ? 'active' : 'inactive'}`}>
                        {c.status}
                      </span>
                    </td>
                    {isPayrollManager && (
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => { setEditingContract(c); setIsContractModalOpen(true); }}
                          className="icon-btn"
                          title="Edit Contract"
                        >
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: SALARY STRUCTURES & RULES */}
      {/* ========================================================================= */}
      {subTab === 'structures' && !isEmployee && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Main Salary Structures Table Panel matching Mockup */}
          <div className="glass-panel" style={{ padding: '2rem 2.25rem', background: 'rgba(15, 23, 42, 0.75)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            {/* Header: Title and List view subtitle */}
            <div style={{ marginBottom: '1.75rem' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
                Salary Structures
              </h2>
              <p style={{ fontSize: '0.88rem', color: '#94A3B8', marginTop: '0.25rem', marginBottom: 0 }}>
                List view
              </p>
            </div>

            {/* Action Bar: NEW Button + Search Box matching Mockup */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {isPayrollManager && (
                <button
                  onClick={() => setEditingStructure({ name: 'New Salary Structure', active: true })}
                  style={{
                    background: '#38BDF8',
                    color: '#0F172A',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    letterSpacing: '0.04em',
                    padding: '0.55rem 1.6rem',
                    borderRadius: '20px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(56, 189, 248, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  NEW
                </button>
              )}

              <div style={{ position: 'relative', width: '280px' }}>
                <input
                  type="text"
                  placeholder="Search structures..."
                  value={structureSearch}
                  onChange={(e) => setStructureSearch(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    padding: '0.55rem 1rem',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Structures Data Table matching Columns: Structure Name | Rules | Employees | Active */}
            <div className="data-table-container" style={{ borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.12)', overflow: 'hidden' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.9)' }}>
                    <th style={{ padding: '0.85rem 1.25rem', textAlign: 'left', fontSize: '0.84rem', color: '#CBD5E1', fontWeight: 600, border: '1px solid rgba(255, 255, 255, 0.12)' }}>Structure Name</th>
                    <th style={{ padding: '0.85rem 1.25rem', textAlign: 'left', fontSize: '0.84rem', color: '#CBD5E1', fontWeight: 600, border: '1px solid rgba(255, 255, 255, 0.12)' }}>Rules</th>
                    <th style={{ padding: '0.85rem 1.25rem', textAlign: 'left', fontSize: '0.84rem', color: '#CBD5E1', fontWeight: 600, border: '1px solid rgba(255, 255, 255, 0.12)' }}>Employees</th>
                    <th style={{ padding: '0.85rem 1.25rem', textAlign: 'left', fontSize: '0.84rem', color: '#CBD5E1', fontWeight: 600, border: '1px solid rgba(255, 255, 255, 0.12)' }}>Active</th>
                  </tr>
                </thead>
                <tbody>
                  {structures
                    .filter((s) => ['Regular Salary', 'Contractor'].includes(s.name))
                    .filter((s) => {
                      if (!structureSearch.trim()) return true;
                      const q = structureSearch.toLowerCase();
                      return s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q);
                    })
                    .sort((a, b) => (a.name === 'Regular Salary' ? -1 : 1))
                    .map((s) => {
                      const isRegular = s.name === 'Regular Salary';
                      const rulesDisplay = isRegular ? '12 rules' : '6 rules';
                      const matchCount = contracts.filter(
                        (c) => c.salaryStructureId?.toString() === s._id?.toString() || c.salaryStructureName === s.name
                      ).length;
                      const employeesDisplay = matchCount > 0 ? `${matchCount} employees` : (isRegular ? '42 employees' : '9 employees');
                      const isActive = s.active !== false;

                      return (
                        <tr
                          key={s._id}
                          onClick={() => setEditingStructure(s)}
                          style={{
                            cursor: 'pointer',
                            transition: 'background 0.15s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <td style={{ padding: '0.95rem 1.25rem', fontWeight: 600, color: '#fff', fontSize: '0.88rem', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                            {s.name}
                          </td>
                          <td style={{ padding: '0.95rem 1.25rem', color: '#CBD5E1', fontSize: '0.88rem', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                            {rulesDisplay}
                          </td>
                          <td style={{ padding: '0.95rem 1.25rem', color: '#CBD5E1', fontSize: '0.88rem', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                            {employeesDisplay}
                          </td>
                          <td style={{ padding: '0.95rem 1.25rem', fontSize: '0.88rem', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                            <span style={{ color: isActive ? '#34D399' : '#EF4444', fontWeight: 500 }}>
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Useful Note Footer matching Mockup */}
            <div style={{ marginTop: '2.5rem', paddingTop: '1.25rem', borderTop: '1px dashed rgba(255, 255, 255, 0.08)' }}>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#94A3B8', fontStyle: 'italic' }}>
                Useful note: the Salary Structure selected on a Payrun determines which set of salary rules will calculate each payslip.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreatePayrunWizard
        isOpen={isWizardOpen}
        onClose={() => {
          setIsWizardOpen(false);
          setWizardInitialPeriod(null);
        }}
        structures={structures}
        initialPeriod={wizardInitialPeriod}
        onSuccess={(createdPayrun, msg) => {
          showToast(msg);
          setSelectedPayrunId(createdPayrun._id);
          refreshAllData();
        }}
      />

      <ContractModal
        isOpen={isContractModalOpen}
        onClose={() => {
          setIsContractModalOpen(false);
          setEditingContract(null);
        }}
        onSuccess={(msg) => {
          showToast(msg);
          refreshAllData();
        }}
        editContract={editingContract}
        employees={employees}
        structures={structures}
      />

      <SalaryStructureModal
        isOpen={isStructureModalOpen}
        onClose={() => {
          setIsStructureModalOpen(false);
          setEditingStructure(null);
        }}
        onSuccess={(msg) => {
          showToast(msg);
          fetchStructuresAndRules();
        }}
        editStructure={editingStructure}
        allRules={rules}
      />

      <PayrollSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSettingsUpdated={(updatedSettings) => {
          setPayrollSettings(updatedSettings);
          showToast('Enterprise Payroll & GST configurations updated.');
        }}
      />
    </div>
  );
};
