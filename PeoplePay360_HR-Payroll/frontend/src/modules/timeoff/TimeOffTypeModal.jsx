import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { X, Layers, AlertTriangle, Check, Palette } from 'lucide-react';

const PRESET_COLORS = [
  '#8B5CF6', // Royal Purple
  '#3B82F6', // Sapphire Blue
  '#10B981', // Emerald
  '#06B6D4', // Electric Cyan
  '#F59E0B', // Amber Gold
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6366F1'  // Indigo
];

export const TimeOffTypeModal = ({ isOpen, onClose, onSuccess, editType = null }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('Days');
  const [requiresAllocation, setRequiresAllocation] = useState(true);
  const [approvalRequired, setApprovalRequired] = useState(true);
  const [allowNegativeBalance, setAllowNegativeBalance] = useState(false);
  const [maxAllocation, setMaxAllocation] = useState(24);
  const [validityPeriod, setValidityPeriod] = useState('Annual');
  const [payrollTreatment, setPayrollTreatment] = useState('Paid');
  const [color, setColor] = useState('#8B5CF6');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editType) {
      setName(editType.name || '');
      setCode(editType.code || '');
      setDescription(editType.description || '');
      setUnit(editType.unit || 'Days');
      setRequiresAllocation(editType.requiresAllocation ?? true);
      setApprovalRequired(editType.approvalRequired ?? true);
      setAllowNegativeBalance(editType.allowNegativeBalance ?? false);
      setMaxAllocation(editType.maxAllocation || 24);
      setValidityPeriod(editType.validityPeriod || 'Annual');
      setPayrollTreatment(editType.payrollTreatment || 'Paid');
      setColor(editType.color || '#8B5CF6');
    } else {
      setName('');
      setCode('');
      setDescription('');
      setUnit('Days');
      setRequiresAllocation(true);
      setApprovalRequired(true);
      setAllowNegativeBalance(false);
      setMaxAllocation(24);
      setValidityPeriod('Annual');
      setPayrollTreatment('Paid');
      setColor('#8B5CF6');
    }
  }, [editType, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !code) {
      setError('Please provide Policy Name and Code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        name,
        code: code.toUpperCase(),
        description,
        unit,
        requiresAllocation,
        approvalRequired,
        allowNegativeBalance,
        maxAllocation: Number(maxAllocation),
        validityPeriod,
        payrollTreatment,
        color
      };

      let res;
      if (editType) {
        res = await api.put(`/timeoff/types/${editType._id}`, payload);
      } else {
        res = await api.post('/timeoff/types', payload);
      }

      if (res.data.success) {
        onSuccess(res.data.message || 'Time Off Policy saved.');
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save Time Off Policy');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content glass-panel" style={{ maxWidth: '620px', padding: '1.5rem 1.75rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${color}20`, border: `1px solid ${color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={19} color={color} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                {editType ? 'Edit Time Off Policy' : 'Create Time Off Type'}
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Configure leave rules, allocations, approvals, and payroll treatment
              </p>
            </div>
          </div>
          <button onClick={onClose} className="icon-btn" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem' }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.6rem 0.85rem',
            marginBottom: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#F87171',
            fontSize: '0.8rem'
          }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Policy Name & Code */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.3rem' }}>Policy / Leave Name *</label>
              <input
                type="text"
                className="form-input"
                style={{ padding: '0.55rem 0.75rem', fontSize: '0.85rem' }}
                placeholder="e.g. Paid Annual Leave"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.3rem' }}>Code *</label>
              <input
                type="text"
                className="form-input"
                style={{ padding: '0.55rem 0.75rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                placeholder="e.g. PAL"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.3rem' }}>Description</label>
            <input
              type="text"
              className="form-input"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.82rem' }}
              placeholder="Brief summary of policy coverage and purpose..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* 4-Field Policy Specs Grid */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.65rem'
          }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Measurement Unit</label>
              <select className="form-select" style={{ padding: '0.45rem 0.65rem', fontSize: '0.82rem' }} value={unit} onChange={(e) => setUnit(e.target.value)}>
                <option value="Days">Days</option>
                <option value="Hours">Hours</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Max Allocation ({unit})</label>
              <input
                type="number"
                min="1"
                className="form-input"
                style={{ padding: '0.45rem 0.65rem', fontSize: '0.82rem' }}
                value={maxAllocation}
                onChange={(e) => setMaxAllocation(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Validity Period</label>
              <select className="form-select" style={{ padding: '0.45rem 0.65rem', fontSize: '0.82rem' }} value={validityPeriod} onChange={(e) => setValidityPeriod(e.target.value)}>
                <option value="Annual">Annual (Calendar Year)</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Monthly">Monthly</option>
                <option value="Permanent">Permanent (No Expiry)</option>
                <option value="None">None (Open)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Payroll Treatment</label>
              <select className="form-select" style={{ padding: '0.45rem 0.65rem', fontSize: '0.82rem' }} value={payrollTreatment} onChange={(e) => setPayrollTreatment(e.target.value)}>
                <option value="Paid">Paid Leave</option>
                <option value="Unpaid">Unpaid / Loss of Pay (LOP)</option>
                <option value="Compensatory">Compensatory</option>
                <option value="Special">Special Statutory</option>
              </select>
            </div>
          </div>

          {/* Color Palette Selector */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.55rem 0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <Palette size={15} color={color} />
              <span>Theme Color:</span>
              <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{color}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: c,
                    border: color === c ? '2px solid #fff' : '2px solid transparent',
                    boxShadow: color === c ? `0 0 8px ${c}` : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                  }}
                >
                  {color === c && <Check size={11} color="#fff" strokeWidth={3} />}
                </button>
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ width: '22px', height: '22px', border: 'none', borderRadius: '50%', cursor: 'pointer', background: 'transparent', marginLeft: '0.2rem' }}
                title="Custom Color"
              />
            </div>
          </div>

          {/* Compact Behavior Toggles */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.45rem' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: requiresAllocation ? 'rgba(124, 58, 237, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                border: requiresAllocation ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid var(--border-color)',
                cursor: 'pointer'
              }}
            >
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>Requires Allocation Balance</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Employees must hold active approved balance credits before applying</div>
              </div>
              <input
                type="checkbox"
                checked={requiresAllocation}
                onChange={(e) => setRequiresAllocation(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#7C3AED', cursor: 'pointer' }}
              />
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: approvalRequired ? 'rgba(124, 58, 237, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                border: approvalRequired ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid var(--border-color)',
                cursor: 'pointer'
              }}
            >
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>HR Approval Required</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Requests must be approved by manager before deducting leave days</div>
              </div>
              <input
                type="checkbox"
                checked={approvalRequired}
                onChange={(e) => setApprovalRequired(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#7C3AED', cursor: 'pointer' }}
              />
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: allowNegativeBalance ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                border: allowNegativeBalance ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-color)',
                cursor: 'pointer'
              }}
            >
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>Allow Negative Balance (Overdraft)</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Permits employees to overdraft emergency leave balances beyond quota</div>
              </div>
              <input
                type="checkbox"
                checked={allowNegativeBalance}
                onChange={(e) => setAllowNegativeBalance(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#10B981', cursor: 'pointer' }}
              />
            </label>
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" disabled={loading} style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.45rem 1.3rem', fontSize: '0.82rem' }}>
              {loading ? 'Saving...' : (editType ? 'Update Policy' : 'Create Policy')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
