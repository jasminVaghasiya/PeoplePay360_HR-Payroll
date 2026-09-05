import React from 'react';
import { X, Clock, Calendar, Shield, History, AlertTriangle, UserCheck } from 'lucide-react';

export const AttendanceDetailModal = ({ isOpen, onClose, record }) => {
  if (!isOpen || !record) return null;

  const cInStr = record.checkIn ? new Date(record.checkIn).toLocaleString() : '--';
  const cOutStr = record.checkOut ? new Date(record.checkOut).toLocaleString() : '--';

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Present':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', border: 'rgba(16, 185, 129, 0.4)' };
      case 'Late':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#FBBF24', border: 'rgba(245, 158, 11, 0.4)' };
      case 'Overtime':
        return { bg: 'rgba(168, 85, 247, 0.15)', text: '#C084FC', border: 'rgba(168, 85, 247, 0.4)' };
      case 'Missing Check-Out':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#FCA5A5', border: 'rgba(239, 68, 68, 0.4)' };
      case 'Corrected':
        return { bg: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA', border: 'rgba(59, 130, 246, 0.4)' };
      default:
        return { bg: 'rgba(156, 163, 175, 0.15)', text: '#9CA3AF', border: 'rgba(156, 163, 175, 0.4)' };
    }
  };

  const badgeStyle = getStatusBadgeStyle(record.status);

  return (
    <div className="modal-overlay fade-in" style={{ zIndex: 1000 }}>
      <div className="modal-content glass-panel" style={{ maxWidth: '680px', width: '90%', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Clock color="#7C3AED" size={24} />
              Attendance Record Details
            </h2>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              ID: {record._id || record.id}
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Status Highlight Banner */}
        <div
          style={{
            background: badgeStyle.bg,
            border: `1px solid ${badgeStyle.border}`,
            padding: '1rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Attendance Status
            </span>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: badgeStyle.text }}>
              {record.status}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Worked Hours</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
              {record.workedHours ? `${record.workedHours} hrs` : '0.0 hrs'}
            </div>
          </div>
        </div>

        {/* Information Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '10px', padding: '1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: '#A78BFA', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <UserCheck size={16} /> Employee Info
            </h4>
            <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, marginBottom: '0.2rem' }}>{record.employeeName}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>{record.employeeEmail}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              <strong>Dept:</strong> {record.department || 'General'} | <strong>Role:</strong> {record.jobPosition || 'Employee'}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '10px', padding: '1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: '#A78BFA', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={16} /> Metrics & Calculation
            </h4>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>
              <strong>Scheduled:</strong> {record.scheduledHours || 8} hrs | <strong>Break:</strong> {record.breakHours || 1} hr
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>
              <strong>Overtime:</strong>{' '}
              <span style={{ color: record.overtimeHours > 0 ? '#C084FC' : '#fff', fontWeight: 600 }}>
                {record.overtimeHours || 0} hrs
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
              <strong>Late Minutes:</strong>{' '}
              <span style={{ color: record.lateMinutes > 0 ? '#FBBF24' : '#fff' }}>
                {record.lateMinutes || 0} mins
              </span>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff', marginBottom: '0.6rem' }}>Timestamp Details</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.83rem' }}>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Check-In:</span>
              <div style={{ color: '#fff', fontWeight: 500, marginTop: '0.2rem' }}>{cInStr}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Check-Out:</span>
              <div style={{ color: '#fff', fontWeight: 500, marginTop: '0.2rem' }}>{cOutStr}</div>
            </div>
          </div>
          {record.notes && (
            <div style={{ marginTop: '0.8rem', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.6rem' }}>
              <strong>Notes:</strong> {record.notes}
            </div>
          )}
        </div>

        {/* Audit Trail Log */}
        {record.auditTrail && record.auditTrail.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '10px', padding: '1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: '#A78BFA', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <History size={16} /> Audit Trail & Correction Log
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {record.auditTrail.map((log, idx) => (
                <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontWeight: 600, marginBottom: '0.2rem' }}>
                    <span>{log.action}</span>
                    <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>{new Date(log.changedDate).toLocaleString()}</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>By: {log.changedBy}</div>
                  {log.reason && <div style={{ color: '#FBBF24', fontStyle: 'italic', marginTop: '0.2rem' }}>Reason: &quot;{log.reason}&quot;</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
