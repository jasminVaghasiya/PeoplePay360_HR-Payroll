import React from 'react';
import { Calendar, ShieldCheck, Clock, Award, CheckCircle2 } from 'lucide-react';

export const LeaveBalanceCards = ({ balances = [] }) => {
  if (balances.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Calendar size={42} style={{ opacity: 0.3, margin: '0 auto 0.75rem auto' }} />
        <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff' }}>No Active Leave Balances</div>
        <p style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>Entitlements will appear here once allocated by HR.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
      {balances.map((b) => {
        const isUnlimited = !b.requiresAllocation;
        const remainingPercentage = isUnlimited ? 100 : (b.allocated > 0 ? Math.min(100, Math.round((b.remaining / b.allocated) * 100)) : 0);
        const usedPercentage = isUnlimited ? 0 : (b.allocated > 0 ? Math.min(100, Math.round((b.used / b.allocated) * 100)) : 0);
        const accentColor = b.remaining > 0 ? '#10B981' : (isUnlimited ? '#8B5CF6' : '#EF4444');

        return (
          <div
            key={b.timeOffTypeId}
            className="timeoff-kpi-card glass-panel-interactive"
            style={{
              padding: '1.4rem',
              '--card-accent': accentColor,
              minHeight: '220px'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#C084FC',
                  background: 'rgba(124, 58, 237, 0.15)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {b.code}
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginTop: '0.35rem' }}>
                  {b.timeOffTypeName}
                </h3>
              </div>
              <span className={`status-dot-badge ${isUnlimited || b.remaining > 0 ? 'approved' : 'refused'}`} style={{ fontSize: '0.72rem' }}>
                <span className="status-dot" />
                {isUnlimited ? 'Open Policy' : `${remainingPercentage}% Available`}
              </span>
            </div>

            {/* Big Main Balance */}
            <div style={{ marginBottom: '1.2rem' }}>
              <div style={{ fontSize: '2.1rem', fontWeight: 800, color: accentColor, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {isUnlimited ? 'Unlimited' : `${b.remaining}`} <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-muted)' }}>{!isUnlimited && b.unit}</span>
              </div>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                {isUnlimited ? 'No balance constraint applied' : 'Remaining available entitlement'}
              </span>
            </div>

            {/* Visual Progress Bar */}
            {!isUnlimited && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
                  <span>Available: <strong style={{ color: '#34D399' }}>{b.remaining} {b.unit} ({remainingPercentage}%)</strong></span>
                  <span>Cap: {b.allocated} {b.unit}</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${remainingPercentage}%`,
                      background: remainingPercentage > 50 ? 'linear-gradient(90deg, #10B981, #34D399)' : remainingPercentage > 20 ? '#F59E0B' : '#EF4444',
                      boxShadow: remainingPercentage > 0 ? '0 0 10px rgba(52, 211, 153, 0.45)' : 'none'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Metrics Breakdown Grid */}
            {!isUnlimited && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '0.5rem',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '0.65rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                fontSize: '0.75rem',
                textAlign: 'center'
              }}>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Allocated</div>
                  <div style={{ fontWeight: 700, color: '#F8FAFC', fontSize: '0.95rem', marginTop: '0.1rem' }}>
                    {b.allocated}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Used</div>
                  <div style={{ fontWeight: 700, color: '#C084FC', fontSize: '0.95rem', marginTop: '0.1rem' }}>
                    {b.used}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Pending</div>
                  <div style={{ fontWeight: 700, color: '#FBBF24', fontSize: '0.95rem', marginTop: '0.1rem' }}>
                    {b.pending}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
