import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { BarChart3, DollarSign, Users, Clock, Calendar, AlertTriangle, TrendingUp } from 'lucide-react';

export const DashboardView = () => {
  const { user } = useAuth();

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <BarChart3 color="#7C3AED" size={28} />
          Executive HR & Payroll Dashboard
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
          Aggregated real-time metrics across Employees, Attendance Health, Leave Requests, and Payroll Batches
        </p>
      </div>

      {/* KPI Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL NET SALARY PAID</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={20} color="#10B981" />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#fff' }}>$83,500</div>
          <div style={{ fontSize: '0.8rem', color: '#34D399', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.4rem' }}>
            <TrendingUp size={14} />
            <span>+4.2% from previous payrun</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE EMPLOYEES</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(124, 58, 237, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} color="#7C3AED" />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#fff' }}>5 Active</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            100% active contracts assigned
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>ATTENDANCE HEALTH</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} color="#3B82F6" />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#fff' }}>97.8%</div>
          <div style={{ fontSize: '0.8rem', color: '#60A5FA', marginTop: '0.4rem' }}>
            Present on scheduled shifts
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>APPROVED TIME OFF</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={20} color="#F59E0B" />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#fff' }}>10 Days</div>
          <div style={{ fontSize: '0.8rem', color: '#FBBF24', marginTop: '0.4rem' }}>
            Deducted from leave allocations
          </div>
        </div>
      </div>

      {/* Operational Alerts & Department Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} color="#F59E0B" />
            Payroll Pre-computation Validation Warnings
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.8rem', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', color: '#FCD34D' }}>
              ⚠️ Employee <strong>David Miller</strong> has 1 pending attendance correction for Sept 3.
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.8rem', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', color: '#6EE7B7' }}>
              ✓ All 5 employees have valid active contracts assigned for current payroll period.
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem' }}>Department Expenditure Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '0.3rem' }}>
                <span style={{ color: '#fff' }}>Finance & Payroll</span>
                <span style={{ color: '#C084FC', fontWeight: 600 }}>$15,200 / mo</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '40%', height: '100%', background: 'var(--primary-gradient)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '0.3rem' }}>
                <span style={{ color: '#fff' }}>Executive & IT</span>
                <span style={{ color: '#C084FC', fontWeight: 600 }}>$12,500 / mo</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '32%', height: '100%', background: 'linear-gradient(135deg, #06B6D4, #3B82F6)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '0.3rem' }}>
                <span style={{ color: '#fff' }}>Human Resources</span>
                <span style={{ color: '#C084FC', fontWeight: 600 }}>$8,500 / mo</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '22%', height: '100%', background: 'linear-gradient(135deg, #10B981, #059669)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
