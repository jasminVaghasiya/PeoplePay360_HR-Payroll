import React, { useState } from 'react';
import { useAuth, Can } from '../../context/AuthContext';
import { DollarSign, ShieldAlert, Play, AlertCircle } from 'lucide-react';

export const PayrollPlaceholder = () => {
  const { user, ability } = useAuth();
  const [payruns] = useState([
    {
      id: 'PR-2026-08',
      name: 'August 2026 Monthly Payroll Batch',
      structure: 'Regular Salary Structure',
      period: '2026-08-01 to 2026-08-31',
      employeeCount: 5,
      totalNetPaid: '$39,500',
      status: 'PAID'
    },
    {
      id: 'PR-2026-09',
      name: 'September 2026 Standard Payrun',
      structure: 'Regular Salary Structure',
      period: '2026-09-01 to 2026-09-30',
      employeeCount: 5,
      totalNetPaid: '$44,000',
      status: 'COMPUTED'
    }
  ]);

  const canReadPayroll = ability ? ability.can('read', 'payrun') : false;
  const canCreatePayrun = ability ? ability.can('create', 'payrun') : false;
  const isReadOnlyRules = ability ? !ability.can('update', 'salary_structure') : false;

  if (!canReadPayroll) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <div className="glass-panel" style={{ padding: '3rem' }}>
          <ShieldAlert size={48} color="#EF4444" style={{ marginBottom: '1rem' }} />
          <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Access Restricted for Role: {user?.role}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.6' }}>
            CASL Guard Enforcement: HR Managers and Employees are prevented from accessing payroll processing, payruns, or salary structures.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <DollarSign color="#7C3AED" size={28} />
            Payroll Operations & Payrun Batches
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Payrun Batch Processing, Salary Computation Rules & Payslip Generation
          </p>
        </div>

        <Can I="create" a="payrun">
          <button className="btn-primary">
            <Play size={18} />
            <span>Launch Payrun Wizard</span>
          </button>
        </Can>
      </div>

      {isReadOnlyRules && (
        <div style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '0.8rem 1.2rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', color: '#93C5FD', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.88rem' }}>
          <AlertCircle size={20} />
          <span>CASL Policy Notice: As an <strong>HR Payroll User</strong>, you have Create/Read/Update access to Payruns/Payslips and Read-Only access to Salary Structures.</span>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1rem' }}>Active & Historical Payrun Batches</h3>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Batch Ref</th>
                <th>Payrun Name</th>
                <th>Salary Structure</th>
                <th>Period</th>
                <th>Staff Count</th>
                <th>Total Net Salary</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payruns.map((pr) => (
                <tr key={pr.id}>
                  <td style={{ fontWeight: 700, color: '#A78BFA' }}>{pr.id}</td>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{pr.name}</td>
                  <td>{pr.structure}</td>
                  <td style={{ fontSize: '0.85rem' }}>{pr.period}</td>
                  <td>{pr.employeeCount} Employees</td>
                  <td style={{ fontWeight: 700, color: '#34D399' }}>{pr.totalNetPaid}</td>
                  <td>
                    <span className={`status-badge ${pr.status === 'PAID' ? 'active' : 'pending'}`}>
                      {pr.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
