import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Plus
} from 'lucide-react';
import api from '../../services/api';
import { SalaryRuleDetailView } from './SalaryRuleDetailView';

const DEFAULT_REGULAR_RULES = [
  { name: 'Basic Salary', code: 'BASIC', category: 'Basic', sequence: 1 },
  { name: 'House Rent Allowance', code: 'HRA', category: 'Allowance', sequence: 10 },
  { name: 'Standard Allowance', code: 'STD', category: 'Allowance', sequence: 20 },
  { name: 'Performance Bonus', code: 'BONUS', category: 'Allowance', sequence: 30 },
  { name: 'Leave Travel Allowance', code: 'LTA', category: 'Allowance', sequence: 40 },
  { name: 'Fixed Allowance', code: 'FIX', category: 'Allowance', sequence: 50 },
  { name: 'Gross Salary', code: 'GROSS', category: 'Gross', sequence: 60 },
  { name: 'LWF Fund', code: 'LWF', category: 'Deduction', sequence: 70 },
  { name: 'Provident Fund', code: 'PF', category: 'Deduction', sequence: 80 },
  { name: 'ESIC', code: 'ESIC', category: 'Deduction', sequence: 90 },
  { name: 'Professional Tax', code: 'PT', category: 'Deduction', sequence: 100 },
  { name: 'Net Salary', code: 'NET', category: 'Net', sequence: 110 }
];

const DEFAULT_CONTRACTOR_RULES = [
  { name: 'Basic Contractor Fee', code: 'BASIC_FEE', category: 'Basic', sequence: 1 },
  { name: 'Professional Retainer', code: 'RETAINER', category: 'Allowance', sequence: 10 },
  { name: 'Project Milestone Bonus', code: 'MILESTONE', category: 'Allowance', sequence: 20 },
  { name: 'Gross Billing', code: 'GROSS', category: 'Gross', sequence: 30 },
  { name: 'TDS 194J Deduction', code: 'TDS_194J', category: 'Deduction', sequence: 40 },
  { name: 'Net Payout', code: 'NET', category: 'Net', sequence: 50 }
];

export const SalaryStructureDetailView = ({ structure, onBack, onSaveSuccess, isPayrollManager = true }) => {
  const [name, setName] = useState(structure?.name || 'Regular Salary');
  const [active, setActive] = useState(structure?.active !== false ? 'True' : 'False');
  const [rules, setRules] = useState([]);
  const [selectedRule, setSelectedRule] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (structure) {
      setName(structure.name || '');
      setActive(structure.active !== false ? 'True' : 'False');

      if (structure.name?.toLowerCase().includes('contract')) {
        setRules(DEFAULT_CONTRACTOR_RULES);
      } else {
        setRules(DEFAULT_REGULAR_RULES);
      }
    } else {
      setName('New Salary Structure');
      setActive('True');
      setRules(DEFAULT_REGULAR_RULES);
    }
  }, [structure]);

  if (selectedRule) {
    return (
      <SalaryRuleDetailView
        rule={selectedRule}
        structureName={name}
        onBack={() => setSelectedRule(null)}
        isPayrollManager={isPayrollManager}
      />
    );
  }

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Structure Name is required.');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    try {
      const payload = {
        name,
        code: structure?.code || (name.toUpperCase().replace(/\\s+/g, '_') + '_2026'),
        description: structure?.description || `${name} structure with sequence-driven rules`,
        active: active === 'True'
      };

      let res;
      if (structure?._id) {
        res = await api.put(`/payroll/structures/${structure._id}`, payload);
      } else {
        res = await api.post('/payroll/structures', payload);
      }

      if (res.data.success) {
        showToast(res.data.message || 'Salary Structure updated successfully.');
        if (onSaveSuccess) onSaveSuccess();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to save salary structure');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
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

      {/* Main Glass Panel Card Container */}
      <div className="glass-panel" style={{ padding: '2.25rem 2.5rem', background: '#0F172A', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        
        {/* Top Header & Breadcrumb Matching Screenshot */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <button
                onClick={onBack}
                title="Back to Salary Structures List"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  padding: '0.2rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <ArrowLeft size={22} />
              </button>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
                Salary Structure / {name || 'Regular Salary'}
              </h1>
            </div>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '0.35rem', marginLeft: '2rem', marginBottom: 0 }}>
              Form view with its salary rules
            </p>
          </div>

          {isPayrollManager && (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: '#38BDF8',
                color: '#0F172A',
                fontWeight: 800,
                fontSize: '0.85rem',
                letterSpacing: '0.04em',
                padding: '0.55rem 1.6rem',
                borderRadius: '8px',
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 2px 8px rgba(56, 189, 248, 0.25)'
              }}
            >
              <Save size={16} />
              <span>{saving ? 'SAVING...' : 'SAVE'}</span>
            </button>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            marginBottom: '1.5rem',
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

        {/* Upper Form Section: Structure Name and Active Fields */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2.5rem',
          marginBottom: '2.5rem',
          maxWidth: '900px'
        }}>
          {/* Structure Name Input */}
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#94A3B8' }}>Structure Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isPayrollManager}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '0.6rem 0.95rem',
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: 600,
                outline: 'none',
                width: '100%'
              }}
            />
          </div>

          {/* Active Select / Input */}
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#94A3B8' }}>Active</span>
            <select
              value={active}
              onChange={(e) => setActive(e.target.value)}
              disabled={!isPayrollManager}
              style={{
                background: '#0F172A',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '0.6rem 0.95rem',
                color: active === 'True' ? '#34D399' : '#F87171',
                fontSize: '0.9rem',
                fontWeight: 600,
                outline: 'none',
                width: '100%',
                cursor: 'pointer'
              }}
            >
              <option value="True">True</option>
              <option value="False">False</option>
            </select>
          </div>
        </div>

        {/* Middle Section Title: Salary Rules */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38BDF8', letterSpacing: '-0.01em', margin: 0 }}>
            Salary Rules
          </h2>
        </div>

        {/* Salary Rules Spreadsheet Grid Table */}
        <div className="data-table-container" style={{ borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.12)', overflow: 'hidden', marginBottom: '2.5rem' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.95)' }}>
                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'left', fontSize: '0.84rem', color: '#CBD5E1', fontWeight: 600, border: '1px solid rgba(255, 255, 255, 0.12)' }}>Rule Name</th>
                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'left', fontSize: '0.84rem', color: '#CBD5E1', fontWeight: 600, border: '1px solid rgba(255, 255, 255, 0.12)' }}>Code</th>
                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'left', fontSize: '0.84rem', color: '#CBD5E1', fontWeight: 600, border: '1px solid rgba(255, 255, 255, 0.12)' }}>Category</th>
                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'left', fontSize: '0.84rem', color: '#CBD5E1', fontWeight: 600, border: '1px solid rgba(255, 255, 255, 0.12)' }}>Sequence</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r, idx) => (
                <tr
                  key={idx}
                  onClick={() => setSelectedRule(r)}
                  style={{
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ padding: '0.9rem 1.25rem', fontWeight: 600, color: '#fff', fontSize: '0.88rem', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                    {r.name}
                  </td>
                  <td style={{ padding: '0.9rem 1.25rem', color: '#CBD5E1', fontSize: '0.88rem', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                    {r.code}
                  </td>
                  <td style={{ padding: '0.9rem 1.25rem', color: '#CBD5E1', fontSize: '0.88rem', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                    {r.category}
                  </td>
                  <td style={{ padding: '0.9rem 1.25rem', color: '#CBD5E1', fontSize: '0.88rem', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                    {r.sequence}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Explanatory Notes matching Mockup */}
        <div style={{ paddingTop: '1.25rem', borderTop: '1px dashed rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#94A3B8', fontStyle: 'italic' }}>
            Useful note: rule order matters. Keep sequence visible so participants understand the calculation flow.
          </p>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>
            Rules created here is just for reference
          </p>
        </div>

      </div>
    </div>
  );
};
