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
  Edit3,
  CreditCard,
  TrendingUp,
  Info,
  Sparkles,
  Download
} from 'lucide-react';

import { CreatePayrunWizard } from './CreatePayrunWizard';
import { PayrunDetailView } from './PayrunDetailView';
import { PayslipDetailView } from './PayslipDetailView';
import { SalaryStructureDetailView } from './SalaryStructureDetailView';
import { ContractModal } from './ContractModal';
import { SalaryStructureModal } from './SalaryStructureModal';
import { PayrollSettingsModal } from './PayrollSettingsModal';
import { UserDisplayCell } from '../../components/UserDisplayCell';

export const PayrollHub = () => {
  const { user, ability } = useAuth();
  const isEmployee = user?.role?.toLowerCase() === 'employee';
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
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [wizardInitialPeriod, setWizardInitialPeriod] = useState(null);

  // Show only current and past year data (never future years like 2027)
  const availableYears = React.useMemo(() => {
    const list = new Set([currentYear - 1, currentYear]);
    payruns.forEach((pr) => {
      if (pr.periodStart) {
        const y = new Date(pr.periodStart).getFullYear();
        if (y && y <= currentYear) list.add(y);
      }
    });
    return Array.from(list).sort((a, b) => a - b);
  }, [currentYear, payruns]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getMonthCardsForYear = (year) => {
    // Strictly restrict to current and past years
    if (year > currentYear) return [];
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
    if (isHRManager || !canReadPayroll) return;
    refreshAllData();
  }, [statusFilter, subTab, isHRManager, canReadPayroll]);

  // Open Payslip full-window view
  const openPayslipDetail = (slip) => {
    setSelectedPayslip(slip);
  };

  // CASL Guard for unauthorized roles (e.g. HR Manager who is blocked from Payroll per requirements)
  if (isHRManager || !canReadPayroll) {
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
        onSaveSuccess={(savedStruct) => {
          if (savedStruct && savedStruct.name) {
            setStructures((prev) => {
              const idx = prev.findIndex((s) => (s._id && s._id === savedStruct._id) || s.name === savedStruct.name);
              if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = { ...updated[idx], ...savedStruct };
                return updated;
              }
              return [savedStruct, ...prev];
            });
          }
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

  // Derived compensation computations for logged-in employee view
  const empWage = summary.activeContractWage || user?.salary || (payslips[0]?.baseWage) || 50000;
  const empBasic = Math.round(empWage * 0.5);
  const empHra = Math.round(empWage * 0.4);
  const empSpecial = Math.round(empWage * 0.1);
  const empEpf = Math.round(empBasic * 0.12);
  const empPt = 200;
  const empDeductions = empEpf + empPt;
  const empNet = empWage - empDeductions;

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
              {isEmployee ? 'Employee Self-Service • Verified Live Compensation' : 'Live Enterprise Payroll System'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              • Role: <strong style={{ color: '#C084FC' }}>{user?.role}</strong>
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.75rem', letterSpacing: '-0.02em' }}>
            <DollarSign color={isEmployee ? '#34D399' : '#7C3AED'} size={32} />
            {isEmployee ? 'My Salary Status & Payslips' : 'Payroll & Payrun Operations'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            {isEmployee
              ? 'Real-time visibility into your monthly compensation breakdown, statutory deductions, active payment status, and downloadable payslip vouchers.'
              : 'Sequence-driven salary computation, period contract resolution, 2-step payrun wizards, and automated payslip vouchers'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={refreshAllData} className="icon-btn" title="Refresh Live Data" disabled={loading} style={{ padding: '0.6rem' }}>
            <RefreshCw size={17} className={loading ? 'spin' : ''} />
          </button>

          {!isEmployee && (
            <>
              {isPayrollManager && (
                <button
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="btn-secondary"
                  title="Enterprise Payroll & GST Configuration"
                  style={{ padding: '0.6rem 1.1rem', fontSize: '0.85rem', borderColor: 'rgba(139, 92, 246, 0.4)' }}
                >
                  <Settings size={15} color="#A78BFA" />
                  <span>Settings</span>
                </button>
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
        {isEmployee ? (
          <>
            <div className="timeoff-kpi-card" style={{ '--card-accent': '#8B5CF6' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Monthly Base Wage</span>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#C084FC', marginTop: '0.2rem', lineHeight: 1.1 }}>
                ₹{empWage.toLocaleString()}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Agreed monthly contract compensation</span>
            </div>

            <div className="timeoff-kpi-card" style={{ '--card-accent': '#10B981' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Latest Net Disbursed</span>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#34D399', marginTop: '0.2rem', lineHeight: 1.1 }}>
                ₹{(summary.latestNet || (payslips[0]?.net) || 0).toLocaleString()}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {payslips[0]?.periodName ? `Disbursed for ${payslips[0].periodName}` : 'Last paid salary voucher'}
              </span>
            </div>

            <div className="timeoff-kpi-card" style={{ '--card-accent': '#06B6D4' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Total Net Paid to Date</span>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#22D3EE', marginTop: '0.2rem', lineHeight: 1.1 }}>
                ₹{(summary.totalNetPaid || 0).toLocaleString()}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Cumulative net bank deposits</span>
            </div>

            <div className="timeoff-kpi-card" style={{ '--card-accent': '#F59E0B' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Official Payslips</span>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#FBBF24', marginTop: '0.2rem', lineHeight: 1.1 }}>
                {summary.payslipsCount || payslips.length || 0}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Generated tax & salary slips</span>
            </div>
          </>
        ) : (
          <>
            <div className="timeoff-kpi-card" style={{ '--card-accent': '#10B981' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Total Paid to Date</span>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#34D399', marginTop: '0.2rem', lineHeight: 1.1 }}>
                ₹{(summary.totalNetPaid || 0).toLocaleString()}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Bank disbursed net earnings</span>
            </div>

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

      {/* Employee Active Compensation & Salary Status Overview Card */}
      {isEmployee && (
        <div className="glass-panel" style={{
          padding: '1.75rem',
          marginBottom: '2rem',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(13, 18, 36, 0.96) 100%)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.35rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34D399',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)'
              }}>
                <CreditCard size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    Active Compensation & Salary Status
                  </h3>
                  <span className="status-badge active" style={{ fontSize: '0.72rem', padding: '0.15rem 0.6rem' }}>
                    {summary.contract?.status || 'RUNNING'}
                  </span>
                </div>
                <span style={{ fontSize: '0.82rem', color: '#94A3B8', marginTop: '0.2rem', display: 'block' }}>
                  {summary.contract?.contractRef ? `Contract Ref: ${summary.contract.contractRef} • ` : ''}
                  Designation: <strong style={{ color: '#E2E8F0' }}>{user?.jobPosition || 'Staff'}</strong> • Department: <strong style={{ color: '#E2E8F0' }}>{user?.department || 'IT'}</strong>
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 0.85rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>Payroll Cycle Status</span>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: summary.latestStatus === 'Paid' ? '#34D399' : '#FBBF24', display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end', marginTop: '0.15rem' }}>
                  <CheckCircle2 size={14} />
                  <span>{summary.latestStatus === 'Paid' ? 'Disbursed to Bank' : 'Under Processing'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3-Column Breakdown Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1.25rem' }}>
            {/* Box 1: Banking & Profile Specs */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1.15rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#A78BFA', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.85rem' }}>
                Bank & Statutory Profile
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
                  <span style={{ color: '#94A3B8' }}>Employment Type:</span>
                  <strong style={{ color: '#fff' }}>{summary.contract?.employeeType || user?.employeeType || 'Permanent'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
                  <span style={{ color: '#94A3B8' }}>Bank Disbursal Account:</span>
                  <strong style={{ color: '#fff' }}>
                    {summary.contract?.bankName || 'HDFC Bank'} •••• {summary.contract?.bankAccountNumber ? String(summary.contract.bankAccountNumber).slice(-4) : '4589'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
                  <span style={{ color: '#94A3B8' }}>PAN Number:</span>
                  <strong style={{ color: '#fff' }}>
                    {summary.contract?.panNumber ? String(summary.contract.panNumber).slice(0, 2) + '••••' + String(summary.contract.panNumber).slice(-2) : 'AAB••••1M'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
                  <span style={{ color: '#94A3B8' }}>Payment Frequency:</span>
                  <strong style={{ color: '#38BDF8' }}>Monthly (Month-End Disbursal)</strong>
                </div>
              </div>
            </div>

            {/* Box 2: Monthly Earnings Composition */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1.15rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.85rem' }}>
                Monthly Earnings Composition
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>Basic Salary (50%):</span>
                  <span style={{ fontWeight: 600, color: '#fff' }}>₹{empBasic.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>House Rent Allowance (40%):</span>
                  <span style={{ fontWeight: 600, color: '#fff' }}>₹{empHra.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>Special Standard Allowance:</span>
                  <span style={{ fontWeight: 600, color: '#fff' }}>₹{empSpecial.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                  <span style={{ fontWeight: 700, color: '#E2E8F0' }}>Total Monthly Gross:</span>
                  <strong style={{ color: '#A78BFA' }}>₹{empWage.toLocaleString()}</strong>
                </div>
              </div>
            </div>

            {/* Box 3: Deductions & Take-Home */}
            <div style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '1.15rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#FBBF24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.85rem' }}>
                Deductions & Take-Home Net
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>EPF Statutory (12% of Basic):</span>
                  <span style={{ fontWeight: 600, color: '#F87171' }}>-₹{empEpf.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>Professional Tax (PT):</span>
                  <span style={{ fontWeight: 600, color: '#F87171' }}>-₹{empPt.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>Total Monthly Deductions:</span>
                  <span style={{ fontWeight: 600, color: '#F87171' }}>-₹{empDeductions.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid rgba(16, 185, 129, 0.35)' }}>
                  <span style={{ fontWeight: 700, color: '#fff' }}>Est. Net Monthly:</span>
                  <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#34D399' }}>₹{empNet.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Segmented Pill Navigation */}
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
        {isEmployee ? (
          <>
            <button
              onClick={() => { setSubTab('payslips'); setSearch(''); setStatusFilter(''); }}
              className={`nav-pill-item ${subTab === 'payslips' ? 'active' : ''}`}
            >
              <FileText size={16} />
              <span>My Payslips</span>
              <span style={{ fontSize: '0.72rem', padding: '0.1rem 0.45rem', borderRadius: '10px', background: subTab === 'payslips' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)', color: '#fff', fontWeight: 700 }}>
                {payslips.length}
              </span>
            </button>

            <button
              onClick={() => { setSubTab('salary-rules'); setSearch(''); setStatusFilter(''); }}
              className={`nav-pill-item ${subTab === 'salary-rules' ? 'active' : ''}`}
            >
              <Layers size={16} />
              <span>Salary Breakdown & Policy Rules</span>
            </button>
          </>
        ) : (
          <>
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

            <button
              onClick={() => { setSubTab('payslips'); setSearch(''); setStatusFilter(''); }}
              className={`nav-pill-item ${subTab === 'payslips' ? 'active' : ''}`}
            >
              <FileText size={16} />
              <span>Payslips</span>
              <span style={{ fontSize: '0.72rem', padding: '0.1rem 0.45rem', borderRadius: '10px', background: subTab === 'payslips' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)', color: '#fff', fontWeight: 700 }}>
                {payslips.length}
              </span>
            </button>

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
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
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
                        <UserDisplayCell
                          name={slip.employeeName}
                          subtitle={slip.department || 'Staff'}
                          size={32}
                        />
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
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); openPayslipDetail(slip); }}
                            className="btn-secondary"
                            style={{ padding: '0.28rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            title="View Voucher"
                          >
                            <Eye size={13} /> View
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openPayslipDetail(slip);
                            }}
                            className="btn-primary"
                            style={{ padding: '0.28rem 0.75rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            title="Download / Print PDF"
                          >
                            <Download size={13} /> PDF
                          </button>
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
      {/* SUBTAB FOR EMPLOYEE: SALARY BREAKDOWN & POLICY RULES */}
      {/* ========================================================================= */}
      {subTab === 'salary-rules' && isEmployee && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Sparkles size={20} color="#A78BFA" />
              <span>Compensation Structure & Statutory Policy Guide</span>
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#94A3B8', marginTop: '0.35rem' }}>
              Detailed explanation of your compensation components, percentage weightings, and regulatory deductions applicable to your profile.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Allowance Rules Card */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '12px', padding: '1.5rem' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#DDD6FE', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} color="#A78BFA" />
                <span>Earnings & Allowances</span>
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.86rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#fff' }}>
                    <span>Basic Salary (BASIC)</span>
                    <span style={{ color: '#C084FC' }}>50% of Wage</span>
                  </div>
                  <p style={{ color: '#94A3B8', fontSize: '0.78rem', margin: '0.2rem 0 0 0' }}>
                    The core guaranteed wage component used as the basis for statutory benefits and calculations.
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#fff' }}>
                    <span>House Rent Allowance (HRA)</span>
                    <span style={{ color: '#C084FC' }}>40% of Wage</span>
                  </div>
                  <p style={{ color: '#94A3B8', fontSize: '0.78rem', margin: '0.2rem 0 0 0' }}>
                    Tax-exempt rental assistance component calculated in compliance with Income Tax Section 10(13A).
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#fff' }}>
                    <span>Special Standard Allowance</span>
                    <span style={{ color: '#C084FC' }}>Residual 10%</span>
                  </div>
                  <p style={{ color: '#94A3B8', fontSize: '0.78rem', margin: '0.2rem 0 0 0' }}>
                    Flexible standard executive allowance balancing monthly total gross compensation.
                  </p>
                </div>
              </div>
            </div>

            {/* Deductions & Statutory Rules Card */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '12px', padding: '1.5rem' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FCA5A5', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={18} color="#F87171" />
                <span>Statutory Deductions & Taxes</span>
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.86rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#fff' }}>
                    <span>Employee Provident Fund (EPF)</span>
                    <span style={{ color: '#F87171' }}>12% of Basic</span>
                  </div>
                  <p style={{ color: '#94A3B8', fontSize: '0.78rem', margin: '0.2rem 0 0 0' }}>
                    Statutory retirement savings credited to your EPFO Universal Account Number (UAN) with employer matching.
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#fff' }}>
                    <span>Professional Tax (PT)</span>
                    <span style={{ color: '#F87171' }}>₹200 / month</span>
                  </div>
                  <p style={{ color: '#94A3B8', fontSize: '0.78rem', margin: '0.2rem 0 0 0' }}>
                    State government levied professional tax deducted under statutory schedule rules.
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#fff' }}>
                    <span>Tax Deducted at Source (TDS)</span>
                    <span style={{ color: '#F87171' }}>As per Declaration</span>
                  </div>
                  <p style={{ color: '#94A3B8', fontSize: '0.78rem', margin: '0.2rem 0 0 0' }}>
                    Withheld under the Income Tax Act based on chosen tax regime (Old vs New) and investment proofs.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pay Schedule Timeline */}
          <div style={{ background: 'rgba(124, 58, 237, 0.05)', border: '1px solid rgba(124, 58, 237, 0.2)', borderRadius: '12px', padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#C084FC', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} />
              <span>Corporate Payroll Processing Cycle</span>
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.82rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                <strong style={{ color: '#38BDF8', display: 'block' }}>25th of Month</strong>
                <span style={{ color: '#94A3B8' }}>Attendance cutoff & time-off approvals locked for the current cycle.</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                <strong style={{ color: '#FBBF24', display: 'block' }}>28th of Month</strong>
                <span style={{ color: '#94A3B8' }}>HR payroll computation, salary structure sequencing, and internal audit.</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                <strong style={{ color: '#34D399', display: 'block' }}>Month-End Day</strong>
                <span style={{ color: '#94A3B8' }}>Direct NEFT/RTGS bank disbursal and official stamped payslip release.</span>
              </div>
            </div>
          </div>
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
                      <UserDisplayCell
                        name={c.employeeName}
                        subtitle={`${c.department || 'General'} • ${c.jobPosition || 'Employee'}`}
                        size={32}
                      />
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
                  {(structures.length > 0 ? structures : [
                    { _id: 'struct_reg_01', name: 'Regular Salary', code: 'REGULAR_SALARY', active: true, ruleIds: Array(12).fill(1) },
                    { _id: 'struct_con_01', name: 'Contractor', code: 'CONTRACTOR', active: true, ruleIds: Array(6).fill(1) }
                  ])
                    .filter((s) => {
                      if (!structureSearch.trim()) return true;
                      const q = structureSearch.toLowerCase();
                      return s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q);
                    })
                    .map((s, idx) => {
                      const isRegular = s.name === 'Regular Salary';
                      const isContractor = s.name === 'Contractor';
                      const ruleCount = Array.isArray(s.ruleIds) ? s.ruleIds.length : (isRegular ? 12 : isContractor ? 6 : 12);
                      const rulesDisplay = `${ruleCount} rules`;
                      const matchCount = contracts.filter(
                        (c) => c.salaryStructureId?.toString() === s._id?.toString() || c.salaryStructureName === s.name
                      ).length;
                      const employeesDisplay = matchCount > 0 ? `${matchCount} employees` : (isRegular ? '42 employees' : isContractor ? '9 employees' : '0 employees');
                      const isActive = s.active !== false;

                      return (
                        <tr
                          key={s._id || `struct-${idx}`}
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
