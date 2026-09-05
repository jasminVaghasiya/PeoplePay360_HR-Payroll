import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { History, Search, RefreshCw, User, FileText, Award } from 'lucide-react';

export const LeaveAuditTrailView = () => {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchHistory = () => {
    setLoading(true);
    api.get('/timeoff/history')
      .then((res) => {
        if (res.data.success) {
          setHistory(res.data.history);
        }
      })
      .catch((err) => console.error('Audit trail error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredHistory = history.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.employeeName?.toLowerCase().includes(q) ||
      item.timeOffTypeName?.toLowerCase().includes(q) ||
      item.action?.toLowerCase().includes(q) ||
      item.performedByName?.toLowerCase().includes(q) ||
      item.note?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={20} color="#8B5CF6" />
            Time Off Audit Log & Lifecycle Trail
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            Immutable chronological transaction logs of all requests, allocations, and approval decisions
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <div className="search-box" style={{ maxWidth: '240px' }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={fetchHistory} className="icon-btn" title="Refresh Log" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          {loading ? 'Loading audit records...' : 'No audit trail logs recorded yet.'}
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Entity</th>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Action</th>
                <th>Performed By</th>
                <th>Transition</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                    {new Date(item.timestamp).toLocaleString()}
                  </td>
                  <td>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      background: item.type === 'Request' ? 'rgba(124, 58, 237, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: item.type === 'Request' ? '#C084FC' : '#34D399'
                    }}>
                      {item.type}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{item.employeeName}</td>
                  <td>{item.timeOffTypeName}</td>
                  <td>
                    <strong style={{ color: '#E2E8F0', fontSize: '0.82rem' }}>{item.action}</strong>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{item.performedByName}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    {item.previousStatus ? `${item.previousStatus} → ` : ''}
                    <strong style={{ color: '#F8FAFC' }}>{item.newStatus}</strong>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '260px' }}>
                    {item.note || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
