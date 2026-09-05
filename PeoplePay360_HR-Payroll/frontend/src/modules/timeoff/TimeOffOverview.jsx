import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Plus, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';

export const TimeOffOverview = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]); // Fully dynamic, initialized empty
  const [showForm, setShowForm] = useState(false);
  const [leaveType, setLeaveType] = useState('Paid Annual Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const canApprove = ['Admin', 'HR Payroll Manager', 'HR Manager'].includes(user?.role);

  const handleCreateRequest = (e) => {
    e.preventDefault();
    if (!startDate || !endDate) return;

    const newReq = {
      id: Date.now(),
      employee: user?.name || 'Employee',
      type: leaveType,
      dates: `${startDate} to ${endDate}`,
      duration: '3 Days',
      status: 'PENDING'
    };

    setRequests([newReq, ...requests]);
    setShowForm(false);
    setStartDate('');
    setEndDate('');
  };

  const handleApprove = (id) => {
    setRequests(requests.map((r) => r.id === id ? { ...r, status: 'APPROVED' } : r));
  };

  const handleRefuse = (id) => {
    setRequests(requests.map((r) => r.id === id ? { ...r, status: 'REFUSED' } : r));
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Calendar color="#7C3AED" size={28} />
            Time Off & Leave Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Leave Requests, Allocations & Balance deduction integration
          </p>
        </div>

        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus size={18} />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Dynamic Request Form */}
      {showForm && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem' }}>New Leave Request — {user?.name}</h3>
          <form onSubmit={handleCreateRequest}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Leave Type</label>
                <select className="form-select" value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
                  <option value="Paid Annual Leave">Paid Annual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Compensatory Days">Compensatory Days</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">End Date</label>
                <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Submit Request</button>
            </div>
          </form>
        </div>
      )}

      {/* Leave Allocations Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.2rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Paid Annual Leave</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#34D399', margin: '0.2rem 0' }}>20 Days</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Remaining balance</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Sick Leave</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#60A5FA', margin: '0.2rem 0' }}>12 Days</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Remaining balance</div>
        </div>
      </div>

      {/* Requests List */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem' }}>Time Off Requests</h3>
        {requests.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No leave requests submitted yet. Click <strong>Apply for Leave</strong> above to submit a dynamic leave request.
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Dates</th>
                  <th>Duration</th>
                  <th>Status</th>
                  {canApprove && <th>Manager Actions</th>}
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{r.employee}</td>
                    <td>{r.type}</td>
                    <td>{r.dates}</td>
                    <td style={{ fontWeight: 600, color: '#C084FC' }}>{r.duration}</td>
                    <td>
                      <span className={`status-badge ${r.status === 'APPROVED' ? 'active' : r.status === 'REFUSED' ? 'inactive' : 'pending'}`}>
                        {r.status}
                      </span>
                    </td>
                    {canApprove && (
                      <td>
                        {r.status === 'PENDING' ? (
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button onClick={() => handleApprove(r.id)} className="btn-primary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}>
                              Approve
                            </button>
                            <button onClick={() => handleRefuse(r.id)} className="btn-danger-outline">
                              Refuse
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Processed</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
