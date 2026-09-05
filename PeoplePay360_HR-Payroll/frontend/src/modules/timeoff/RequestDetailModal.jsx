import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  X,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building,
  FileText,
  AlertCircle,
  ExternalLink,
  History
} from 'lucide-react';

export const RequestDetailModal = ({ isOpen, onClose, request, onActionSuccess }) => {
  const { user } = useAuth();
  const [showRefusalPrompt, setShowRefusalPrompt] = useState(false);
  const [refusalReason, setRefusalReason] = useState('');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '—' : d.toLocaleString();
  };

  if (!isOpen || !request) return null;

  const canApprove = ['Admin', 'HR Payroll Manager', 'HR Manager'].includes(user?.role);
  const isOwner = (request.employee?._id || request.employee) === (user?._id || user?.id);
  const canCancel = request.status !== 'Cancelled' && (isOwner || canApprove);

  const handleApprove = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.patch(`/timeoff/requests/${request._id}/approve`);
      if (res.data.success) {
        onActionSuccess(res.data.message || 'Request approved successfully.');
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve request');
    } finally {
      setLoading(false);
    }
  };

  const handleRefuse = async () => {
    if (!refusalReason.trim()) {
      setError('Please provide a reason for refusing this request.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.patch(`/timeoff/requests/${request._id}/refuse`, { refusalReason });
      if (res.data.success) {
        onActionSuccess(res.data.message || 'Request refused.');
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to refuse request');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.patch(`/timeoff/requests/${request._id}/cancel`, { cancellationReason });
      if (res.data.success) {
        onActionSuccess(res.data.message || 'Request cancelled.');
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return <span className="status-badge active">Approved</span>;
      case 'Pending':
        return <span className="status-badge pending">Pending HR Approval</span>;
      case 'Refused':
        return <span className="status-badge inactive">Refused</span>;
      case 'Cancelled':
        return <span className="status-badge" style={{ background: 'rgba(100, 116, 139, 0.2)', color: '#94A3B8' }}>Cancelled</span>;
      default:
        return <span className="status-badge draft">{status}</span>;
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content glass-panel" style={{ maxWidth: '700px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>
                Leave Request Details
              </h2>
              {getStatusBadge(request.status)}
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Ref #{request._id?.slice(-8).toUpperCase()} • Submitted on {formatDate(request.requestedDate || request.createdAt)}
            </span>
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
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: Employee Information */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
            1. Employee Information
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Employee Name</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.1rem' }}>
                <User size={16} color="#8B5CF6" />
                {request.employeeName}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Department</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.1rem' }}>
                <Building size={16} color="#06B6D4" />
                {request.department || 'General'}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Leave & Duration Details */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
            2. Leave & Schedule Information
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.9rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Leave Type</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#A78BFA', marginTop: '0.1rem' }}>
                {request.timeOffTypeName}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Date Interval</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', marginTop: '0.1rem' }}>
                {formatDate(request.startDate)} → {formatDate(request.endDate)}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Calculated Duration</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34D399', marginTop: '0.1rem' }}>
                {request.duration} {request.unit}
              </div>
            </div>
          </div>
          <div style={{ marginTop: '0.9rem', background: 'rgba(255,255,255,0.02)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Reason / Description</span>
            <p style={{ fontSize: '0.9rem', color: '#F1F5F9', marginTop: '0.2rem', whiteSpace: 'pre-wrap' }}>
              {request.reason || 'No reason provided.'}
            </p>
          </div>
          {request.attachment && (
            <div style={{ marginTop: '0.6rem', fontSize: '0.85rem' }}>
              <a href={request.attachment} target="_blank" rel="noopener noreferrer" style={{ color: '#8B5CF6', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <ExternalLink size={14} /> View Attached Document / Certificate
              </a>
            </div>
          )}
        </div>

        {/* Section 3: Approval / Refusal Info */}
        {(request.approvedByName || request.rejectionReason || request.cancellationReason) && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              3. Processing Status & Outcome
            </h4>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              {request.approvedByName && (
                <div style={{ marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Approved By</span>
                  <div style={{ color: '#10B981', fontWeight: 600, fontSize: '0.9rem' }}>
                    {request.approvedByName} on {formatDateTime(request.approvalDate)}
                  </div>
                </div>
              )}
              {request.rejectionReason && (
                <div style={{ marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Refusal Reason</span>
                  <div style={{ color: '#EF4444', fontWeight: 600, fontSize: '0.9rem' }}>
                    {request.rejectionReason}
                  </div>
                </div>
              )}
              {request.cancellationReason && (
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Cancellation Reason</span>
                  <div style={{ color: '#94A3B8', fontSize: '0.9rem' }}>
                    {request.cancellationReason}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 4: Audit History Log */}
        {request.auditTrail && request.auditTrail.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <History size={16} /> Audit Trail & Lifecycle
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto' }}>
              {request.auditTrail.map((log, idx) => (
                <div key={idx} style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', marginBottom: '0.15rem' }}>
                    <strong style={{ color: '#C084FC' }}>{log.action}</strong>
                    <span>{formatDateTime(log.timestamp)}</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>
                    By: <strong style={{ color: '#F8FAFC' }}>{log.performedByName}</strong> {log.note ? `— ${log.note}` : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Refusal Reason Input Form */}
        {showRefusalPrompt && (
          <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.2rem' }}>
            <label className="form-label" style={{ color: '#FCA5A5' }}>Specify Refusal Reason *</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="e.g. Critical project deliverable on selected dates. Please reschedule."
              value={refusalReason}
              onChange={(e) => setRefusalReason(e.target.value)}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button onClick={() => setShowRefusalPrompt(false)} className="btn-secondary" disabled={loading}>
                Cancel
              </button>
              <button onClick={handleRefuse} className="btn-danger" disabled={loading}>
                Confirm Refusal
              </button>
            </div>
          </div>
        )}

        {/* Cancellation Reason Input Form */}
        {showCancelPrompt && (
          <div style={{ background: 'rgba(100, 116, 139, 0.1)', border: '1px solid rgba(100, 116, 139, 0.25)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.2rem' }}>
            <label className="form-label">Cancellation Reason / Remarks</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Plans changed / travel cancelled"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button onClick={() => setShowCancelPrompt(false)} className="btn-secondary" disabled={loading}>
                Dismiss
              </button>
              <button onClick={handleCancel} className="btn-secondary" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} disabled={loading}>
                Confirm Cancellation
              </button>
            </div>
          </div>
        )}

        {/* Action Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.2rem' }}>
          <div>
            {canCancel && !showCancelPrompt && (
              <button
                type="button"
                onClick={() => setShowCancelPrompt(true)}
                className="btn-danger-outline"
                disabled={loading}
              >
                Cancel Leave Request
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
              Close
            </button>

            {canApprove && request.status === 'Pending' && !showRefusalPrompt && (
              <>
                <button
                  type="button"
                  onClick={() => setShowRefusalPrompt(true)}
                  className="btn-danger"
                  disabled={loading}
                >
                  <XCircle size={16} /> Refuse
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="btn-primary"
                  disabled={loading}
                >
                  <CheckCircle2 size={16} /> Approve Leave
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
