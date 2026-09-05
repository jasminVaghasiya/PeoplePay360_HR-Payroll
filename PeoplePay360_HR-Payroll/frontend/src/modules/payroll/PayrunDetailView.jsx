import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  ArrowLeft,
  RefreshCw,
  Play,
  CheckCircle,
  DollarSign,
  Mail,
  AlertTriangle,
  FileText,
  Clock,
  Layers,
  Calendar,
  Users,
  Eye,
  CheckCircle2,
  Lock,
  Send,
  Building,
  ShieldCheck,
  Download
} from 'lucide-react';
import { PayslipDetailView } from './PayslipDetailView';

export const PayrunDetailView = ({ payrunId, onBack, onOpenPayslip, isPayrollManager = true }) => {
  const [payrun, setPayrun] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Payslip Full-Window View State
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [settings, setSettings] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  useEffect(() => {
    api.get('/payroll/settings')
      .then((res) => {
        if (res.data.success) setSettings(res.data.settings);
      })
      .catch(() => {});
  }, []);

  const fetchPayrunDetails = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await api.get(`/payroll/payruns/${payrunId}`);
      if (res.data.success) {
        setPayrun(res.data.payrun);
        setPayslips(res.data.payslips || []);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to load payrun details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (payrunId) fetchPayrunDetails();
  }, [payrunId]);

  // Actions: Compute
  const handleCompute = async () => {
    setActionLoading(true);
    setErrorMessage('');
    try {
      const res = await api.post(`/payroll/payruns/${payrunId}/compute`);
      if (res.data.success) {
        showToast(res.data.message || 'Payrun computed successfully.');
        fetchPayrunDetails();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Computation failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Actions: Validate
  const handleValidate = async () => {
    setActionLoading(true);
    setErrorMessage('');
    try {
      const res = await api.post(`/payroll/payruns/${payrunId}/validate`);
      if (res.data.success) {
        showToast(res.data.message || 'Payrun validated and approved for payment.');
        fetchPayrunDetails();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Validation failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Actions: Mark Paid
  const handleMarkPaid = async () => {
    if (!window.confirm('Are you sure you want to mark this payrun as PAID? This will archive the records.')) {
      return;
    }
    setActionLoading(true);
    setErrorMessage('');
    try {
      const res = await api.post(`/payroll/payruns/${payrunId}/pay`);
      if (res.data.success) {
        showToast(res.data.message || 'Payrun finalized and marked as PAID.');
        fetchPayrunDetails();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Payment update failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Actions: Send Bulk Payslips Email
  const handleSendPayslips = async () => {
    setActionLoading(true);
    setErrorMessage('');
    try {
      const res = await api.post(`/payroll/payruns/${payrunId}/send-payslips`);
      if (res.data.success) {
        showToast(res.data.message || 'Payslips successfully emailed to all staff.');
        fetchPayrunDetails();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Email delivery failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (selectedSlip) {
    return (
      <PayslipDetailView
        payslip={selectedSlip}
        onBack={() => setSelectedSlip(null)}
        settings={settings}
      />
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={32} className="spin" style={{ margin: '0 auto 1rem auto' }} />
        <div>Loading Payrun Batch Details...</div>
      </div>
    );
  }

  if (!payrun) {
    return (
      <div style={{ padding: '2rem' }}>
        <button onClick={onBack} className="btn-secondary" style={{ marginBottom: '1rem' }}>
          <ArrowLeft size={16} /> Back to Payruns
        </button>
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: '#F87171' }}>
          {errorMessage || 'Payrun not found'}
        </div>
      </div>
    );
  }

  // Format date range e.g. "01-Feb — 28-Feb"
  const formatDateRange = (start, end) => {
    if (!start || !end) return '—';
    const s = new Date(start);
    const e = new Date(end);
    const f = (d) => {
      const day = String(d.getDate()).padStart(2, '0');
      const m = d.toLocaleString('en-US', { month: 'short' });
      return `${day}-${m}`;
    };
    return `${f(s)} — ${f(e)}`;
  };

  // Currency short formatter e.g. ₹50k or ₹50,000
  const formatCurrencyShort = (val) => {
    if (val === undefined || val === null) return '₹0';
    if (val >= 1000) {
      return `₹${Math.round(val / 1000)}k`;
    }
    return `₹${val.toLocaleString()}`;
  };

  // Helper to find warning string for specific employee
  const getEmployeeWarning = (employeeId) => {
    if (!payrun.warnings || payrun.warnings.length === 0) return '—';
    const match = payrun.warnings.find(
      (w) => w.employeeId && w.employeeId.toString() === employeeId?.toString()
    );
    if (match) {
      if (match.message.toLowerCase().includes('bank') || match.message.toLowerCase().includes('account')) {
        return 'A/C missing';
      }
      if (match.message.toLowerCase().includes('duplicate')) {
        return 'Duplicate';
      }
      return match.message.length > 20 ? `${match.message.slice(0, 20)}...` : match.message;
    }
    return '—';
  };

  const isNew = payrun.status === 'New';
  const isComputed = payrun.status === 'Computed';
  const isValidated = payrun.status === 'Validated';
  const isPaid = payrun.status === 'Paid';

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid #10B981',
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

      {/* Top Header & Breadcrumb Matching Screenshot */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              onClick={onBack}
              className="icon-btn"
              title="Back to Payruns"
              style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center' }}
            >
              <ArrowLeft size={20} />
            </button>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
              Payrun / {payrun.name}
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.25rem', marginLeft: '1.8rem' }}>
            Open one Payrun to compute and manage its payslips
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={fetchPayrunDetails} className="icon-btn" title="Refresh Live Data" disabled={actionLoading}>
            <RefreshCw size={17} className={actionLoading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          color: '#F87171',
          fontSize: '0.85rem'
        }}>
          <AlertTriangle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Top Action Workflow Bar Matching Mockup (COMPUTE | VALIDATE | MARK PAID --- SEND PAYSLIPS) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Left Action Buttons: COMPUTE, VALIDATE, MARK PAID */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* COMPUTE BUTTON */}
          <button
            onClick={handleCompute}
            disabled={actionLoading || isPaid}
            style={{
              background: '#38BDF8',
              color: '#0F172A',
              fontWeight: 700,
              fontSize: '0.85rem',
              letterSpacing: '0.04em',
              padding: '0.55rem 1.6rem',
              borderRadius: '8px',
              border: 'none',
              cursor: isPaid ? 'not-allowed' : 'pointer',
              opacity: isPaid ? 0.5 : 1,
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(56, 189, 248, 0.25)'
            }}
          >
            {actionLoading ? 'COMPUTING...' : 'COMPUTE'}
          </button>

          {/* VALIDATE BUTTON */}
          <button
            onClick={handleValidate}
            disabled={actionLoading || isPaid || !isComputed}
            style={{
              background: isValidated ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              color: isValidated ? '#60A5FA' : (isComputed ? '#F8FAFC' : 'var(--text-dim)'),
              fontWeight: 700,
              fontSize: '0.85rem',
              letterSpacing: '0.04em',
              padding: '0.55rem 1.6rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              cursor: (isComputed && !actionLoading) ? 'pointer' : 'default',
              opacity: isComputed || isValidated ? 1 : 0.6,
              transition: 'all 0.2s ease'
            }}
          >
            VALIDATE
          </button>

          {/* MARK PAID BUTTON */}
          <button
            onClick={handleMarkPaid}
            disabled={actionLoading || isPaid || !isValidated}
            style={{
              background: isPaid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              color: isPaid ? '#34D399' : (isValidated ? '#F8FAFC' : 'var(--text-dim)'),
              fontWeight: 700,
              fontSize: '0.85rem',
              letterSpacing: '0.04em',
              padding: '0.55rem 1.6rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              cursor: (isValidated && !actionLoading) ? 'pointer' : 'default',
              opacity: isValidated || isPaid ? 1 : 0.6,
              transition: 'all 0.2s ease'
            }}
          >
            MARK PAID
          </button>
        </div>

        {/* Right Action Button: SEND PAYSLIPS */}
        <div>
          <button
            onClick={handleSendPayslips}
            disabled={actionLoading || (!isValidated && !isPaid)}
            style={{
              background: '#C084FC',
              color: '#0F172A',
              fontWeight: 700,
              fontSize: '0.85rem',
              letterSpacing: '0.04em',
              padding: '0.55rem 1.6rem',
              borderRadius: '8px',
              border: 'none',
              cursor: (isValidated || isPaid) && !actionLoading ? 'pointer' : 'not-allowed',
              opacity: (isValidated || isPaid) ? 1 : 0.6,
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 10px rgba(192, 132, 252, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Mail size={15} />
            <span>SEND PAYSLIPS</span>
          </button>
        </div>
      </div>

      {/* Payrun Metadata Form-Style Display Matching Screenshot */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2rem', maxWidth: '520px' }}>
        {/* Row 1: Name */}
        <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.82rem', color: '#94A3B8' }}>Name</span>
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            borderRadius: '8px',
            padding: '0.5rem 0.85rem',
            color: '#fff',
            fontSize: '0.88rem',
            fontWeight: 600
          }}>
            {payrun.name}
          </div>
        </div>

        {/* Row 2: Salary Structure */}
        <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.82rem', color: '#94A3B8' }}>Salary Structure</span>
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            borderRadius: '8px',
            padding: '0.5rem 0.85rem',
            color: '#E2E8F0',
            fontSize: '0.88rem'
          }}>
            {payrun.salaryStructureName || 'Regular Salary'}
          </div>
        </div>

        {/* Row 3: Period */}
        <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.82rem', color: '#94A3B8' }}>Period</span>
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            borderRadius: '8px',
            padding: '0.5rem 0.85rem',
            color: '#E2E8F0',
            fontSize: '0.88rem'
          }}>
            {formatDateRange(payrun.periodStart, payrun.periodEnd)}
          </div>
        </div>

        {/* Row 4: Status */}
        <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.82rem', color: '#94A3B8' }}>Status</span>
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            borderRadius: '8px',
            padding: '0.5rem 0.85rem',
            color: payrun.status === 'Paid' ? '#34D399' : (payrun.status === 'Validated' ? '#60A5FA' : '#FBBF24'),
            fontSize: '0.88rem',
            fontWeight: 600
          }}>
            {payrun.status}
          </div>
        </div>
      </div>

      {/* Payslips in this Payrun Table Matching Screenshot */}
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '1rem', letterSpacing: '-0.01em' }}>
          Payslips in this Payrun
        </h3>

        {payslips.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={36} style={{ opacity: 0.3, margin: '0 auto 0.75rem auto' }} />
            <div>No Payslips generated yet. Click "COMPUTE" above to process this batch.</div>
          </div>
        ) : (
          <div className="data-table-container" style={{ borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <table className="data-table" style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: '#94A3B8', fontWeight: 600 }}>Employee</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: '#94A3B8', fontWeight: 600 }}>Warning</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: '#94A3B8', fontWeight: 600 }}>Worked</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: '#94A3B8', fontWeight: 600 }}>Basic</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: '#94A3B8', fontWeight: 600 }}>Gross</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: '#94A3B8', fontWeight: 600 }}>Net</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: '#94A3B8', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: '#94A3B8', fontWeight: 600, textAlign: 'center' }}>PDF</th>
                </tr>
              </thead>
              <tbody>
                {payslips.map((slip) => {
                  const basicAmount = slip.basic || (slip.lines?.find((l) => l.code === 'BASIC')?.amount) || (slip.baseWage * 0.5);
                  const warningText = getEmployeeWarning(slip.employeeId);
                  const isDone = ['Validated', 'Paid', 'Computed'].includes(slip.status);

                  const handleOpenPayslip = (targetSlip) => {
                    setSelectedSlip(targetSlip);
                    if (onOpenPayslip) onOpenPayslip(targetSlip);
                  };

                  return (
                    <tr
                      key={slip._id}
                      onClick={() => handleOpenPayslip(slip)}
                      style={{
                        cursor: 'pointer',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      {/* Employee Name */}
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#fff', fontSize: '0.88rem' }}>
                        {slip.employeeName}
                      </td>

                      {/* Warning Text (Orange if warning exists) */}
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.84rem' }}>
                        {warningText !== '—' ? (
                          <span style={{ color: '#F59E0B', fontWeight: 600 }}>{warningText}</span>
                        ) : (
                          <span style={{ color: '#64748B' }}>—</span>
                        )}
                      </td>

                      {/* Worked Days */}
                      <td style={{ padding: '0.85rem 1rem', color: '#CBD5E1', fontSize: '0.88rem' }}>
                        {slip.workedDays !== undefined ? slip.workedDays : slip.totalWorkingDays || 22}
                      </td>

                      {/* Basic Pay */}
                      <td style={{ padding: '0.85rem 1rem', color: '#E2E8F0', fontSize: '0.88rem' }}>
                        {formatCurrencyShort(basicAmount)}
                      </td>

                      {/* Gross Earnings */}
                      <td style={{ padding: '0.85rem 1rem', color: '#E2E8F0', fontSize: '0.88rem' }}>
                        {formatCurrencyShort(slip.gross)}
                      </td>

                      {/* Net Salary */}
                      <td style={{ padding: '0.85rem 1rem', color: '#E2E8F0', fontSize: '0.88rem', fontWeight: 600 }}>
                        {formatCurrencyShort(slip.net)}
                      </td>

                      {/* Status (Done / Draft) */}
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.84rem' }}>
                        <span style={{
                          color: isDone ? '#34D399' : '#94A3B8',
                          fontWeight: 600
                        }}>
                          {isDone ? 'Done' : 'Draft'}
                        </span>
                      </td>

                      {/* PDF Action Link / Button */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenPayslip(slip);
                          }}
                          title="Open and Download PDF Payslip Voucher"
                          style={{
                            color: '#38BDF8',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            letterSpacing: '0.03em'
                          }}
                        >
                          PDF
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Useful Note Footer Matching Mockup */}
      <div style={{ marginTop: '2.5rem', paddingTop: '1.25rem', borderTop: '1px dashed rgba(255, 255, 255, 0.08)' }}>
        <p style={{ margin: 0, fontSize: '0.82rem', color: '#94A3B8', fontStyle: 'italic' }}>
          Useful note: warnings such as missing account data or duplicate payslips should be visible before payroll is finalized.
        </p>
      </div>
    </div>
  );
};
