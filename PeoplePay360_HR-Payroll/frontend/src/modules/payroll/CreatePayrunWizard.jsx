import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  X,
  Play,
  Calendar,
  Layers,
  Users,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  DollarSign,
  ShieldCheck,
  Check,
  FileText
} from 'lucide-react';

export const CreatePayrunWizard = ({
  isOpen,
  onClose,
  onSuccess,
  structures: propStructures = [],
  initialPeriod = null
}) => {
  const [step, setStep] = useState(1);
  const [payrunName, setPayrunName] = useState('');
  const [selectedStructureId, setSelectedStructureId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [structuresList, setStructuresList] = useState(propStructures);

  // Step 2 Eligible Employees state
  const [eligibleEmployees, setEligibleEmployees] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [error, setError] = useState('');

  // Fetch structures if not passed or empty
  useEffect(() => {
    if (propStructures && propStructures.length > 0) {
      setStructuresList(propStructures);
      const def = propStructures.find((s) => s.isDefault) || propStructures[0];
      if (def && !selectedStructureId) {
        setSelectedStructureId(def._id);
      }
    } else if (isOpen) {
      api.get('/payroll/structures')
        .then((res) => {
          if (res.data.success && res.data.structures?.length > 0) {
            setStructuresList(res.data.structures);
            const def = res.data.structures.find((s) => s.isDefault) || res.data.structures[0];
            if (def) setSelectedStructureId(def._id);
          }
        })
        .catch((err) => console.error('Error loading structures:', err));
    }
  }, [isOpen, propStructures]);

  // Initialize default or custom month dates on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError('');
      if (initialPeriod?.periodStart && initialPeriod?.periodEnd) {
        setPayrunName(initialPeriod.name || initialPeriod.monthName || `${initialPeriod.shortMonth || 'Period'} ${initialPeriod.year || ''}`.trim());
        setPeriodStart(initialPeriod.periodStart);
        setPeriodEnd(initialPeriod.periodEnd);
      } else {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth(); // Current month 0-indexed

        // Start of current month
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 0);

        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];
        const monthName = start.toLocaleString('default', { month: 'long', year: 'numeric' });

        setPayrunName(monthName);
        setPeriodStart(startStr);
        setPeriodEnd(endStr);
      }
    }
  }, [isOpen, initialPeriod]);

  // Fetch eligible employees when moving to Step 2
  const handleProceedToStep2 = async (e) => {
    e.preventDefault();
    if (!payrunName || !selectedStructureId || !periodStart || !periodEnd) {
      setError('Please complete all Step 1 configuration fields.');
      return;
    }
    if (new Date(periodStart) > new Date(periodEnd)) {
      setError('Period Start Date cannot be after Period End Date.');
      return;
    }

    setError('');
    setLoadingEmployees(true);
    try {
      const res = await api.get(
        `/payroll/eligible-employees?salaryStructureId=${selectedStructureId}&periodStart=${periodStart}&periodEnd=${periodEnd}`
      );
      if (res.data.success) {
        setEligibleEmployees(res.data.employees || []);
        // By default select all employees who have an active contract for this period
        const validIds = (res.data.employees || []).filter((e) => e.eligible).map((e) => e.id);
        setSelectedEmployeeIds(validIds);
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check employee contract eligibility');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleToggleSelectAll = () => {
    const validIds = eligibleEmployees.filter((e) => e.eligible).map((e) => e.id);
    if (selectedEmployeeIds.length === validIds.length) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(validIds);
    }
  };

  const handleToggleEmployee = (id) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Final Submit: Create Payrun & Initial Computed Payslips
  const handleCreatePayrun = async () => {
    if (selectedEmployeeIds.length === 0) {
      setError('You must select at least 1 eligible employee to generate a Payrun.');
      return;
    }

    setLoadingCreate(true);
    setError('');

    try {
      const payload = {
        name: payrunName,
        salaryStructureId: selectedStructureId,
        periodStart,
        periodEnd,
        selectedEmployeeIds,
        notes
      };

      const res = await api.post('/payroll/payruns', payload);
      if (res.data.success) {
        onSuccess(res.data.payrun, res.data.message);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to create Payrun batch');
    } finally {
      setLoadingCreate(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content glass-panel" style={{ maxWidth: step === 1 ? '580px' : '760px', padding: '1.75rem 2rem' }}>
        {/* Wizard Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.9rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(124, 58, 237, 0.2)', border: '1px solid rgba(139, 92, 246, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Play size={20} color="#C084FC" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                  Create Payrun Wizard
                </h2>
                <span style={{ fontSize: '0.72rem', background: 'rgba(124, 58, 237, 0.18)', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#C084FC', padding: '0.15rem 0.55rem', borderRadius: '12px', fontWeight: 700 }}>
                  Step {step} of 2
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                {step === 1 ? 'Configure batch parameters, salary structure, and payroll period' : 'Select eligible employees and verify contract compliance'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="icon-btn" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Wizard Stepper Indicator */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{
            padding: '0.6rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            background: step === 1 ? 'rgba(124, 58, 237, 0.15)' : 'rgba(255, 255, 255, 0.02)',
            border: step === 1 ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: step === 1 ? '#7C3AED' : 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              1
            </span>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: step === 1 ? '#fff' : 'var(--text-muted)' }}>Payrun Setup</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Structure & Dates</div>
            </div>
          </div>

          <div style={{
            padding: '0.6rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            background: step === 2 ? 'rgba(124, 58, 237, 0.15)' : 'rgba(255, 255, 255, 0.02)',
            border: step === 2 ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: step === 2 ? '#7C3AED' : 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              2
            </span>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: step === 2 ? '#fff' : 'var(--text-muted)' }}>Employee Selection</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Contract Verification</div>
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.65rem 0.9rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#F87171',
            fontSize: '0.82rem'
          }}>
            <AlertTriangle size={17} />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: SETUP */}
        {step === 1 && (
          <form onSubmit={handleProceedToStep2} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                Payrun Batch Name *
              </label>
              <input
                type="text"
                className="form-input"
                style={{ padding: '0.55rem 0.8rem', fontSize: '0.88rem' }}
                placeholder="e.g. February 2026"
                value={payrunName}
                onChange={(e) => setPayrunName(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                Salary Structure *
              </label>
              <select
                className="form-select"
                style={{ padding: '0.55rem 0.8rem', fontSize: '0.88rem' }}
                value={selectedStructureId}
                onChange={(e) => setSelectedStructureId(e.target.value)}
                required
              >
                {structuresList.length === 0 && (
                  <option value="">Loading structures...</option>
                )}
                {structuresList.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.code}) {s.isDefault ? '• (Default)' : ''}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                Determines which sequence-driven salary rules (Basic, HRA, PF, Tax, LOP) will execute.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                  Payroll Period Start *
                </label>
                <input
                  type="date"
                  className="form-input"
                  style={{ padding: '0.55rem 0.8rem', fontSize: '0.85rem' }}
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                  Payroll Period End *
                </label>
                <input
                  type="date"
                  className="form-input"
                  style={{ padding: '0.55rem 0.8rem', fontSize: '0.85rem' }}
                  value={periodEnd}
                  min={periodStart}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                Internal Notes / Description
              </label>
              <input
                type="text"
                className="form-input"
                style={{ padding: '0.5rem 0.8rem', fontSize: '0.82rem' }}
                placeholder="Optional batch comments or special payout cycle notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.9rem', marginTop: '0.3rem' }}>
              <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem' }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loadingEmployees} style={{ padding: '0.5rem 1.3rem', fontSize: '0.85rem' }}>
                {loadingEmployees ? 'Verifying Contracts...' : 'Continue to Employees'}
                <ChevronRight size={16} />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: EMPLOYEE SELECTION & CONTRACT VERIFICATION */}
        {step === 2 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <Users size={16} color="#A78BFA" />
                <span>
                  Selected: <strong style={{ color: '#fff' }}>{selectedEmployeeIds.length}</strong> of{' '}
                  <strong style={{ color: '#fff' }}>{eligibleEmployees.filter((e) => e.eligible).length}</strong> eligible staff
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="btn-secondary"
                style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
              >
                {selectedEmployeeIds.length === eligibleEmployees.filter((e) => e.eligible).length ? 'Deselect All' : 'Select All Eligible'}
              </button>
            </div>

            {/* Eligible Employees Table */}
            <div className="data-table-container" style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <table className="data-table" style={{ fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px', padding: '0.6rem' }}>Select</th>
                    <th style={{ padding: '0.6rem' }}>Employee</th>
                    <th style={{ padding: '0.6rem' }}>Applicable Contract</th>
                    <th style={{ padding: '0.6rem' }}>Base Wage</th>
                    <th style={{ padding: '0.6rem' }}>Compliance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {eligibleEmployees.map((emp) => {
                    const isSelected = selectedEmployeeIds.includes(emp.id);
                    return (
                      <tr
                        key={emp.id}
                        onClick={() => emp.eligible && handleToggleEmployee(emp.id)}
                        style={{
                          cursor: emp.eligible ? 'pointer' : 'not-allowed',
                          opacity: emp.eligible ? 1 : 0.5,
                          background: isSelected ? 'rgba(124, 58, 237, 0.08)' : 'transparent'
                        }}
                      >
                        <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={!emp.eligible}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (emp.eligible) handleToggleEmployee(emp.id);
                            }}
                            style={{ width: '16px', height: '16px', accentColor: '#7C3AED', cursor: emp.eligible ? 'pointer' : 'not-allowed' }}
                          />
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          <div style={{ fontWeight: 600, color: '#fff' }}>{emp.name}</div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{emp.department} • {emp.jobPosition}</span>
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          <span style={{ fontSize: '0.78rem', color: emp.eligible ? '#A78BFA' : '#F87171' }}>
                            {emp.contractName}
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          <strong style={{ color: '#34D399' }}>
                            ₹{emp.contractWage.toLocaleString()}
                          </strong>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}> /mo</span>
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          {emp.warnings && emp.warnings.length > 0 ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: '#FBBF24', background: 'rgba(245, 158, 11, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                              <AlertTriangle size={12} />
                              {emp.warnings[0]}
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: '#34D399', background: 'rgba(16, 185, 129, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                              <CheckCircle2 size={12} />
                              Verified
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.9rem', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-secondary"
                style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <ArrowLeft size={15} /> Back
              </button>
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreatePayrun}
                  className="btn-primary"
                  disabled={loadingCreate || selectedEmployeeIds.length === 0}
                  style={{ padding: '0.45rem 1.4rem', fontSize: '0.82rem' }}
                >
                  {loadingCreate ? 'Generating Payslips...' : `Create Payrun (${selectedEmployeeIds.length} Staff)`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
