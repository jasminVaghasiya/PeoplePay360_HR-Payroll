import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { X, Award, AlertTriangle, Users, Building, Globe } from 'lucide-react';

export const AllocationModal = ({ isOpen, onClose, onSuccess, employees = [], types = [] }) => {
  const { user } = useAuth();
  const [allocationTo, setAllocationTo] = useState('employee'); // 'employee' | 'department' | 'company'
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [allocatedAmount, setAllocatedAmount] = useState(20);
  const [startDate, setStartDate] = useState(() => `${new Date().getFullYear()}-01-01`);
  const [endDate, setEndDate] = useState(() => `${new Date().getFullYear()}-12-31`);
  const [validityPeriod, setValidityPeriod] = useState('Annual');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Extract unique departments dynamically from real employee records
  const departments = Array.from(
    new Set(employees.map((e) => e.department).filter(Boolean))
  );

  // Sync defaults
  useEffect(() => {
    if (employees.length > 0 && !selectedEmployeeId) {
      setSelectedEmployeeId(employees[0].id);
    }
    if (departments.length > 0 && !selectedDepartment) {
      setSelectedDepartment(departments[0]);
    }
    if (types.length > 0 && !selectedTypeId) {
      const def = types.find((t) => t.requiresAllocation && t.status === 'Active') || types[0];
      setSelectedTypeId(def._id);
    }
  }, [employees, types, selectedEmployeeId, selectedDepartment, selectedTypeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (allocationTo === 'employee' && !selectedEmployeeId) {
      setError('Please select a target employee.');
      return;
    }
    if (allocationTo === 'department' && !selectedDepartment) {
      setError('Please select a target department.');
      return;
    }
    if (!selectedTypeId) {
      setError('Please select a Time Off Type.');
      return;
    }

    if (allocatedAmount <= 0) {
      setError('Allocated amount must be greater than 0.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/timeoff/allocations', {
        allocationTo,
        employeeId: allocationTo === 'employee' ? selectedEmployeeId : undefined,
        department: allocationTo === 'department' ? selectedDepartment : undefined,
        timeOffTypeId: selectedTypeId,
        allocatedAmount: Number(allocatedAmount),
        startDate,
        endDate,
        validityPeriod,
        reason,
        autoApprove: true
      });

      if (res.data.success) {
        onSuccess(res.data.message || 'Leave allocation created.');
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create allocation');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentType = types.find((t) => t._id === selectedTypeId);

  // Count employees affected
  const affectedCount =
    allocationTo === 'company'
      ? employees.length
      : allocationTo === 'department'
      ? employees.filter((e) => e.department === selectedDepartment).length
      : 1;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content glass-panel" style={{ maxWidth: '640px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Award size={22} color="#10B981" />
              Assign Leave Allocation
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Credit leave balances to individuals, departments, or the entire organization
            </p>
          </div>
          <button onClick={onClose} className="icon-btn" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            marginBottom: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            color: '#F87171',
            fontSize: '0.85rem'
          }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Allocation To Target Selector */}
          <div className="form-group" style={{ marginBottom: '1.3rem' }}>
            <label className="form-label" style={{ fontWeight: 600, color: '#F8FAFC', marginBottom: '0.6rem' }}>
              Allocation To *
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.6rem',
              background: 'rgba(255,255,255,0.03)',
              padding: '0.4rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: allocationTo === 'employee' ? 'rgba(124, 58, 237, 0.25)' : 'transparent',
                  border: allocationTo === 'employee' ? '1px solid #7C3AED' : '1px solid transparent',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: allocationTo === 'employee' ? 600 : 400,
                  color: allocationTo === 'employee' ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.2s ease'
                }}
              >
                <input
                  type="radio"
                  name="allocationTo"
                  value="employee"
                  checked={allocationTo === 'employee'}
                  onChange={() => setAllocationTo('employee')}
                  style={{ accentColor: '#7C3AED' }}
                />
                <Users size={15} />
                <span>Particular Employee</span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: allocationTo === 'department' ? 'rgba(124, 58, 237, 0.25)' : 'transparent',
                  border: allocationTo === 'department' ? '1px solid #7C3AED' : '1px solid transparent',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: allocationTo === 'department' ? 600 : 400,
                  color: allocationTo === 'department' ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.2s ease'
                }}
              >
                <input
                  type="radio"
                  name="allocationTo"
                  value="department"
                  checked={allocationTo === 'department'}
                  onChange={() => setAllocationTo('department')}
                  style={{ accentColor: '#7C3AED' }}
                />
                <Building size={15} />
                <span>Department</span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: allocationTo === 'company' ? 'rgba(124, 58, 237, 0.25)' : 'transparent',
                  border: allocationTo === 'company' ? '1px solid #7C3AED' : '1px solid transparent',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: allocationTo === 'company' ? 600 : 400,
                  color: allocationTo === 'company' ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.2s ease'
                }}
              >
                <input
                  type="radio"
                  name="allocationTo"
                  value="company"
                  checked={allocationTo === 'company'}
                  onChange={() => setAllocationTo('company')}
                  style={{ accentColor: '#7C3AED' }}
                />
                <Globe size={15} />
                <span>Whole Company</span>
              </label>
            </div>
          </div>

          {/* Conditional Target Input */}
          {allocationTo === 'employee' && (
            <div className="form-group" style={{ marginBottom: '1.2rem' }}>
              <label className="form-label">Target Employee *</label>
              <select
                className="form-select"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                required
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.department} ({emp.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {allocationTo === 'department' && (
            <div className="form-group" style={{ marginBottom: '1.2rem' }}>
              <label className="form-label">Target Department *</label>
              <select
                className="form-select"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                required
              >
                {departments.map((dept) => {
                  const count = employees.filter((e) => e.department === dept).length;
                  return (
                    <option key={dept} value={dept}>
                      {dept} ({count} active {count === 1 ? 'employee' : 'employees'})
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {allocationTo === 'company' && (
            <div style={{
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1.1rem',
              marginBottom: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              color: '#38BDF8',
              fontSize: '0.85rem'
            }}>
              <Globe size={18} />
              <span>
                <strong>Company-wide allocation:</strong> This will assign {allocatedAmount} {currentType?.unit || 'Days'} to all <strong>{employees.length} active employees</strong> across the organization.
              </span>
            </div>
          )}

          {/* Time Off Type Selection */}
          <div className="form-group" style={{ marginBottom: '1.2rem' }}>
            <label className="form-label">Time Off Type *</label>
            <select
              className="form-select"
              value={selectedTypeId}
              onChange={(e) => setSelectedTypeId(e.target.value)}
              required
            >
              {types.filter(t => t.requiresAllocation).map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.code}) — {t.unit} (Max Policy: {t.maxAllocation} {t.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Amount & Validity Period */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
            <div className="form-group">
              <label className="form-label">Allocated Amount ({currentType?.unit || 'Days'}) *</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                className="form-input"
                value={allocatedAmount}
                onChange={(e) => setAllocatedAmount(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Validity Cycle</label>
              <select
                className="form-select"
                value={validityPeriod}
                onChange={(e) => {
                  const val = e.target.value;
                  setValidityPeriod(val);
                  const year = new Date().getFullYear();
                  if (val === 'Permanent') {
                    setStartDate(`${year}-01-01`);
                    setEndDate('2099-12-31');
                  } else if (val === 'Annual') {
                    setStartDate(`${year}-01-01`);
                    setEndDate(`${year}-12-31`);
                  }
                }}
              >
                <option value="Permanent">Permanent (No Expiration)</option>
                <option value="Annual">Annual (Full Year)</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Monthly">Monthly Accrual</option>
                <option value="Custom">Custom Range</option>
              </select>
            </div>
          </div>

          {/* Validity Dates (Disabled/Unavailable when Permanent) */}
          {validityPeriod === 'Permanent' ? (
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              marginBottom: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#34D399', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Permanent Entitlement
                </span>
                <div style={{ fontSize: '0.9rem', color: '#F1F5F9', marginTop: '0.1rem' }}>
                  No expiration date applied • Leave balance remains active indefinitely
                </div>
              </div>
              <span className="status-badge active" style={{ fontSize: '0.75rem' }}>
                Non-Expiring
              </span>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
              <div className="form-group">
                <label className="form-label">Valid From *</label>
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required={validityPeriod !== 'Permanent'}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Valid Until *</label>
                <input
                  type="date"
                  className="form-input"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required={validityPeriod !== 'Permanent'}
                />
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="form-group" style={{ marginBottom: '1.2rem' }}>
            <label className="form-label">Allocation Note / Reason</label>
            <input
              type="text"
              className="form-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Annual Policy Entitlement or Performance Bonus"
            />
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.2rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Processing...' : `Save & Assign (${affectedCount} ${affectedCount === 1 ? 'Employee' : 'Employees'})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
