import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserAvatarHoverPreview } from '../../components/UserAvatarHoverPreview';
import api from '../../services/api';
import { Users, Search } from 'lucide-react';

export const EmployeeDirectory = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState('');

  useEffect(() => {
    const fetchEmps = async () => {
      try {
        const res = await api.get('/employees', { params: { search, employeeType: employeeTypeFilter } });
        if (res.data.employees) {
          setEmployees(res.data.employees);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchEmps();
  }, [search, employeeTypeFilter]);

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users color="#7C3AED" size={28} />
            Employee Master Directory
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Hover on employee photo for 1.5 seconds to preview full-screen photo
          </p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '280px', maxWidth: '400px' }}>
          <Search size={18} color="#64748B" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search employee name, position..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className="form-select" style={{ width: '180px' }} value={employeeTypeFilter} onChange={(e) => setEmployeeTypeFilter(e.target.value)}>
          <option value="">All Employee Types</option>
          <option value="Permanent">Permanent</option>
          <option value="Contract">Contract</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading employee master data...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {employees.map((emp) => (
            <div key={emp.id} className="glass-panel glass-panel-interactive" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <UserAvatarHoverPreview
                  name={emp.name}
                  role={emp.role}
                  photoUrl={emp.photo}
                  size={52}
                />
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>{emp.name}</h3>
                  <div style={{ fontSize: '0.85rem', color: '#A78BFA', fontWeight: 500 }}>{emp.jobPosition}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{emp.email}</div>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', padding: '0.8rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Employee Type:</span>
                  <span style={{ color: emp.employeeType === 'Contract' ? '#FBBF24' : '#34D399', fontWeight: 700 }}>
                    {emp.employeeType || 'Permanent'}
                  </span>
                </div>
                {emp.employeeType === 'Contract' && (emp.contractStartDate || emp.contractDuration) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Contract Period:</span>
                    <span style={{ color: '#FBBF24', fontWeight: 600, fontSize: '0.8rem' }}>
                      {emp.contractStartDate && emp.contractEndDate ? `${emp.contractStartDate} to ${emp.contractEndDate}` : emp.contractDuration}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Department:</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{emp.department}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Manager:</span>
                  <span style={{ color: 'var(--text-muted)' }}>{emp.manager}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Active Contract:</span>
                  <span style={{ color: '#34D399', fontWeight: 600 }}>{emp.activeContract}</span>
                </div>
              </div>

              {/* Odoo Smart Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div style={{ background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.2)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Status</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#C084FC' }}>{emp.attendanceHealth}</div>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Leave Balance</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#34D399' }}>{emp.leaveBalanceDays} Days</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
