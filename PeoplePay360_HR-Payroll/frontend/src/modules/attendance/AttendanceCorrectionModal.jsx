import React, { useState } from 'react';
import { X, Send, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export const AttendanceCorrectionModal = ({
  isOpen,
  onClose,
  record,
  onSubmitRequest,
  onApprove,
  onReject,
  isHr = false
}) => {
  const [correctedCheckIn, setCorrectedCheckIn] = useState('');
  const [correctedCheckOut, setCorrectedCheckOut] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !record) return null;

  const cInStr = record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';
  const cOutStr = record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!reason || reason.trim().length < 5) {
      setError('Please enter a clear explanation/reason (minimum 5 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const checkInISO = correctedCheckIn ? new Date(`${record.date}T${correctedCheckIn}:00`).toISOString() : record.checkIn;
      const checkOutISO = correctedCheckOut ? new Date(`${record.date}T${correctedCheckOut}:00`).toISOString() : record.checkOut;

      const res = await onSubmitRequest(record._id || record.id, {
        correctedCheckIn: checkInISO,
        correctedCheckOut: checkOutISO,
        reason
      });

      if (!res?.success) {
        setError(res?.message || 'Failed to submit correction request.');
      } else {
        onClose();
      }
    } catch (err) {
      setError('Invalid date or timestamp entered.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveAction = async () => {
    setSubmitting(true);
    try {
      const res = await onApprove(record._id || record.id, { notes: reason || 'Approved by HR' });
      if (res?.success) onClose();
      else setError(res?.message || 'Failed to approve correction.');
    } catch (e) {
      setError('Error approving correction.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectAction = async () => {
    setSubmitting(true);
    try {
      const res = await onReject(record._id || record.id, { reason: reason || 'Refused by HR' });
      if (res?.success) onClose();
      else setError(res?.message || 'Failed to reject correction.');
    } catch (e) {
      setError('Error rejecting correction.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay fade-in" style={{ zIndex: 1000 }}>
      <div className="modal-content glass-panel" style={{ maxWidth: '580px', width: '90%', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: '1rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertCircle color="#F59E0B" size={22} />
            {isHr && record.correctionStatus === 'Requested'
              ? 'Review Attendance Correction'
              : 'Request Attendance Correction'}
          </h2>
          <button onClick={onClose} className="btn-icon" style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#FCA5A5', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.88rem' }}>
            {error}
          </div>
        )}

        {/* Current Record Info */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.88rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-dim)' }}>Employee:</span>
            <strong style={{ color: '#fff' }}>{record.employeeName}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-dim)' }}>Date:</span>
            <strong style={{ color: '#A78BFA' }}>{record.date}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-dim)' }}>Current Check-In / Out:</span>
            <span style={{ color: '#fff' }}>
              {cInStr} &rarr; {cOutStr}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-dim)' }}>Current Status:</span>
            <span className="role-badge admin" style={{ fontSize: '0.78rem' }}>
              {record.status}
            </span>
          </div>
        </div>

        {/* HR Reviewing Pending Request */}
        {isHr && record.correctionStatus === 'Requested' ? (
          <div>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 600, color: '#FBBF24', marginBottom: '0.4rem' }}>
                Correction Request Details:
              </div>
              <div style={{ color: '#E5E7EB', marginBottom: '0.3rem' }}>
                <strong>Requested Check-In:</strong>{' '}
                {record.correctedCheckIn ? new Date(record.correctedCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unchanged'}
              </div>
              <div style={{ color: '#E5E7EB', marginBottom: '0.5rem' }}>
                <strong>Requested Check-Out:</strong>{' '}
                {record.correctedCheckOut ? new Date(record.correctedCheckOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unchanged'}
              </div>
              <div style={{ color: '#9CA3AF', fontStyle: 'italic' }}>
                &quot;{record.correctionReason}&quot;
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                HR Review Remarks
              </label>
              <textarea
                rows="2"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Optional decision remarks for audit trail..."
                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#111726', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button
                type="button"
                onClick={handleRejectAction}
                className="btn-danger-outline"
                disabled={submitting}
                style={{ padding: '0.6rem 1.2rem' }}
              >
                <XCircle size={18} />
                <span>Refuse Request</span>
              </button>
              <button
                type="button"
                onClick={handleApproveAction}
                className="btn-primary"
                disabled={submitting}
                style={{ padding: '0.6rem 1.2rem', background: 'linear-gradient(135deg, #10B981, #059669)' }}
              >
                <CheckCircle2 size={18} />
                <span>Approve Correction</span>
              </button>
            </div>
          </div>
        ) : (
          /* Employee / User requesting correction */
          <form onSubmit={handleRequestSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Correct Check-In Time
                </label>
                <input
                  type="time"
                  value={correctedCheckIn}
                  onChange={(e) => setCorrectedCheckIn(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#111726', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Correct Check-Out Time
                </label>
                <input
                  type="time"
                  value={correctedCheckOut}
                  onChange={(e) => setCorrectedCheckOut(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#111726', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Reason for Correction (Required)
              </label>
              <textarea
                rows="3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this correction is needed e.g. Forgot to check out while leaving for client meeting..."
                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#111726', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', resize: 'vertical' }}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                <Send size={18} />
                <span>{submitting ? 'Submitting...' : 'Submit Correction Request'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
