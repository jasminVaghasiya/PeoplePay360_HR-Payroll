import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { X, Calendar, AlertTriangle, CheckCircle2, Clock, FileText, Info } from 'lucide-react';

export const RequestModal = ({ isOpen, onClose, onSuccess, employees = [], types = [] }) => {
  const { user } = useAuth();
  const isHR = ['Admin', 'HR Payroll Manager', 'HR Manager'].includes(user?.role);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState(user?._id || user?.id || '');
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [unit, setUnit] = useState('Days');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [duration, setDuration] = useState(0);
  const [reason, setReason] = useState('');
  const [attachment, setAttachment] = useState('');
  const [selectedBalance, setSelectedBalance] = useState(null);
  const [overlapWarning, setOverlapWarning] = useState('');
  const [validationError, setValidationError] = useState('');
  const [loading, setLoading] = useState(false);

  // Set initial selected type when types arrive
  useEffect(() => {
    if (types.length > 0 && !selectedTypeId) {
      const defaultActive = types.find((t) => t.status === 'Active') || types[0];
      setSelectedTypeId(defaultActive._id);
      setUnit(defaultActive.unit || 'Days');
    }
  }, [types, selectedTypeId]);

  // Update unit & fetch balance when selected type or employee changes
  useEffect(() => {
    const currentType = types.find((t) => t._id === selectedTypeId);
    if (currentType) {
      setUnit(currentType.unit || 'Days');
    }

    const empId = isHR ? (selectedEmployeeId || user?._id || user?.id) : (user?._id || user?.id);
    if (empId && selectedTypeId) {
      api.get(`/timeoff/balances?employeeId=${empId}`)
        .then((res) => {
          if (res.data.success) {
            const bal = res.data.balances.find((b) => b.timeOffTypeId === selectedTypeId);
            setSelectedBalance(bal || null);
          }
        })
        .catch(() => setSelectedBalance(null));
    }
  }, [selectedTypeId, selectedEmployeeId, types, isHR, user]);

  // Automatic calculation of duration and live overlap/balance validation
  useEffect(() => {
    if (!startDate || !endDate) {
      setDuration(0);
      setValidationError('');
      setOverlapWarning('');
      return;
    }

    const currentType = types.find((t) => t._id === selectedTypeId);
    const selectedUnit = currentType?.unit || unit;

    api.post('/timeoff/calculate-duration', {
      startDate,
      endDate,
      unit: selectedUnit,
      startTime,
      endTime
    })
      .then((res) => {
        if (res.data.success) {
          const calcDuration = res.data.duration;
          setDuration(calcDuration);

          // Check balance validation
          if (selectedBalance && selectedBalance.requiresAllocation && !selectedBalance.allowNegativeBalance) {
            if (calcDuration > selectedBalance.remaining) {
              setValidationError(`Insufficient leave balance. Available: ${selectedBalance.remaining} ${selectedBalance.unit}, Requested: ${calcDuration} ${selectedBalance.unit}.`);
            } else {
              setValidationError('');
            }
          } else {
            setValidationError('');
          }
        }
      })
      .catch((err) => {
        setValidationError(err.response?.data?.message || 'Error calculating duration');
      });

    // Check for overlapping leaves
    const empId = isHR ? (selectedEmployeeId || user?._id || user?.id) : (user?._id || user?.id);
    if (empId && startDate && endDate) {
      api.get(`/timeoff/requests?employeeId=${empId}&startDate=${startDate}&endDate=${endDate}`)
        .then((res) => {
          if (res.data.success && res.data.requests.length > 0) {
            const conflict = res.data.requests.find((r) => ['Pending', 'Approved'].includes(r.status));
            if (conflict) {
              setOverlapWarning(`Notice: Request overlaps with existing ${conflict.timeOffTypeName} (${new Date(conflict.startDate).toLocaleDateString()} - ${new Date(conflict.endDate).toLocaleDateString()}, Status: ${conflict.status}).`);
            } else {
              setOverlapWarning('');
            }
          } else {
            setOverlapWarning('');
          }
        })
        .catch(() => setOverlapWarning(''));
    }
  }, [startDate, endDate, startTime, endTime, selectedTypeId, selectedEmployeeId, unit, types, selectedBalance, isHR, user]);

  const handleSubmit = async (e, isDraft = false) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setValidationError('Please select both start and end dates.');
      return;
    }

    if (duration <= 0) {
      setValidationError('Duration must be greater than 0.');
      return;
    }

    if (validationError && !isDraft) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        employeeId: isHR ? selectedEmployeeId : (user?._id || user?.id),
        timeOffTypeId: selectedTypeId,
        startDate,
        endDate,
        startTime: unit === 'Hours' ? startTime : '09:00',
        endTime: unit === 'Hours' ? endTime : '18:00',
        reason,
        attachment,
        isDraft
      };

      const res = await api.post('/timeoff/requests', payload);
      if (res.data.success) {
        onSuccess(res.data.message || 'Request created successfully.');
        onClose();
      }
    } catch (err) {
      setValidationError(err.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content glass-panel" style={{ maxWidth: '640px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Calendar size={22} color="#7C3AED" />
              Apply for Time Off / Leave
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Submit a dynamic leave request with automated duration & balance verification
            </p>
          </div>
          <button onClick={onClose} className="icon-btn" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)}>
          {/* If HR, allow selecting employee */}
          {isHR && (
            <div className="form-group" style={{ marginBottom: '1.2rem' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Target Employee *</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>HR Override Authorized</span>
              </label>
              <select
                className="form-select"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                required
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.department} — {emp.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Time Off Type Selection */}
          <div className="form-group" style={{ marginBottom: '1.2rem' }}>
            <label className="form-label">Leave Policy / Time Off Type *</label>
            <select
              className="form-select"
              value={selectedTypeId}
              onChange={(e) => setSelectedTypeId(e.target.value)}
              required
            >
              {types.filter(t => t.status === 'Active').map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.code}) — {t.unit} {t.requiresAllocation ? '• Allocation Required' : '• Open Entitlement'}
                </option>
              ))}
            </select>
          </div>

          {/* Realtime Balance Preview Card */}
          {selectedBalance && (
            <div style={{
              background: 'rgba(124, 58, 237, 0.08)',
              border: '1px solid rgba(124, 58, 237, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1.1rem',
              marginBottom: '1.2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {selectedBalance.timeOffTypeName} Balance
                </span>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginTop: '0.1rem' }}>
                  {selectedBalance.requiresAllocation ? `${selectedBalance.remaining} ${selectedBalance.unit} Available` : 'No Allocation Limit'}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {selectedBalance.requiresAllocation && (
                  <div>
                    Allocated: <strong style={{ color: '#F8FAFC' }}>{selectedBalance.allocated}</strong> | Used: <strong style={{ color: '#C084FC' }}>{selectedBalance.used}</strong> | Pending: <strong style={{ color: '#F59E0B' }}>{selectedBalance.pending}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Date Pickers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date *</label>
              <input
                type="date"
                className="form-input"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Hour range if Unit is Hours */}
          {unit === 'Hours' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Automatic Calculated Duration Display */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            marginBottom: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={16} color="#8B5CF6" />
              Calculated Duration (Excl. Weekends):
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#C084FC' }}>
              {duration} {unit}
            </span>
          </div>

          {/* Overlap Warning Banner */}
          {overlapWarning && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              marginBottom: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              color: '#FBBF24',
              fontSize: '0.85rem'
            }}>
              <AlertTriangle size={18} />
              <span>{overlapWarning}</span>
            </div>
          )}

          {/* Validation Error Banner */}
          {validationError && (
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
              <span>{validationError}</span>
            </div>
          )}

          {/* Reason */}
          <div className="form-group" style={{ marginBottom: '1.2rem' }}>
            <label className="form-label">Reason / Notes *</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Provide a clear description or purpose for this leave request..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          {/* Attachment URL (Optional) */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Supporting Document / Medical Note URL (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. https://company-drive.com/medical-certificate.pdf"
              value={attachment}
              onChange={(e) => setAttachment(e.target.value)}
            />
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.2rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              className="btn-secondary"
              style={{ borderColor: 'rgba(255,255,255,0.2)' }}
              disabled={loading}
            >
              Save as Draft
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || (validationError && duration > 0)}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
