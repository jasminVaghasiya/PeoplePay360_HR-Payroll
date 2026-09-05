import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  X,
  Layers,
  AlertTriangle,
  Check,
  Plus,
  ArrowUpDown,
  FileText
} from 'lucide-react';

export const SalaryStructureModal = ({ isOpen, onClose, onSuccess, editStructure = null, allRules = [] }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [selectedRuleIds, setSelectedRuleIds] = useState([]);
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editStructure) {
      setName(editStructure.name || '');
      setCode(editStructure.code || '');
      setDescription(editStructure.description || '');
      const existingIds = (editStructure.ruleIds || []).map((r) => r._id || r);
      setSelectedRuleIds(existingIds);
      setIsDefault(!!editStructure.isDefault);
    } else {
      setName('');
      setCode('');
      setDescription('');
      setSelectedRuleIds(allRules.map((r) => r._id));
      setIsDefault(false);
    }
  }, [editStructure, isOpen, allRules]);

  const handleToggleRule = (id) => {
    setSelectedRuleIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !code) {
      setError('Structure Name and Code are required.');
      return;
    }
    if (selectedRuleIds.length === 0) {
      setError('Please select at least 1 salary rule for this structure.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        name,
        code: code.toUpperCase(),
        description,
        ruleIds: selectedRuleIds,
        isDefault
      };

      let res;
      if (editStructure) {
        res = await api.put(`/payroll/structures/${editStructure._id}`, payload);
      } else {
        res = await api.post('/payroll/structures', payload);
      }

      if (res.data.success) {
        onSuccess(res.data.message || 'Salary Structure saved.');
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save salary structure');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content glass-panel" style={{ maxWidth: '640px', padding: '1.5rem 1.75rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(124, 58, 237, 0.2)', border: '1px solid rgba(139, 92, 246, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={18} color="#C084FC" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                {editStructure ? 'Edit Salary Structure' : 'Create Salary Structure'}
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Configure salary calculation framework and sequence-driven salary rules
              </p>
            </div>
          </div>
          <button onClick={onClose} className="icon-btn" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.25rem' }}>Structure Name *</label>
              <input
                type="text"
                className="form-input"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                placeholder="e.g. Standard Employee Salary Structure"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.25rem' }}>Code *</label>
              <input
                type="text"
                className="form-input"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', textTransform: 'uppercase' }}
                placeholder="e.g. STD_SAL_2026"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.25rem' }}>Description</label>
            <input
              type="text"
              className="form-input"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.82rem' }}
              placeholder="Brief summary of salary structure coverage..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Rules Selector */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: 0 }}>
                Included Salary Rules ({selectedRuleIds.length} Selected)
              </label>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                Rules execute in ascending sequence order
              </span>
            </div>

            <div style={{
              maxHeight: '220px',
              overflowY: 'auto',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '0.4rem'
            }}>
              {allRules.sort((a, b) => a.sequence - b.sequence).map((rule) => {
                const isSelected = selectedRuleIds.includes(rule._id);
                return (
                  <label
                    key={rule._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.45rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      marginBottom: '0.2rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleRule(rule._id)}
                        style={{ accentColor: '#7C3AED' }}
                      />
                      <div>
                        <span style={{ fontWeight: 600, color: '#fff' }}>{rule.name}</span>{' '}
                        <code style={{ fontSize: '0.7rem', color: '#A78BFA' }}>({rule.code})</code>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Seq: {rule.sequence}</span>
                      <span className={`status-badge ${rule.category === 'Deduction' ? 'inactive' : 'active'}`} style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                        {rule.category}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" disabled={loading} style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.45rem 1.3rem', fontSize: '0.82rem' }}>
              {loading ? 'Saving...' : (editStructure ? 'Update Structure' : 'Create Structure')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
