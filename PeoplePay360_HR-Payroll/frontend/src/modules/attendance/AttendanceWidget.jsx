import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, Play, Square, CheckCircle, AlertTriangle } from 'lucide-react';

export const AttendanceWidget = () => {
  const { user } = useAuth();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [logs, setLogs] = useState([]); // Fully dynamic, initialized empty

  const handleToggleCheckIn = () => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (!isCheckedIn) {
      setIsCheckedIn(true);
      setCheckInTime(now);
    } else {
      setIsCheckedIn(false);
      const newEntry = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        checkIn: checkInTime,
        checkOut: now,
        workedHours: '8.0 hrs',
        status: 'Submitted'
      };
      setLogs([newEntry, ...logs]);
      setCheckInTime(null);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Clock color="#7C3AED" size={28} />
          Attendance & Working Schedule Tracking
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
          Standard schedule: <strong>40h/week (Mon-Fri 09:00 - 18:00)</strong>
        </p>
      </div>

      {/* Interactive Check-In Card */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
        <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '0.5rem' }}>
          Personal Attendance Kiosk — {user?.name}
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Status: {isCheckedIn ? <strong style={{ color: '#10B981' }}>Checked In since {checkInTime}</strong> : <strong style={{ color: '#F59E0B' }}>Checked Out</strong>}
        </p>

        <button
          onClick={handleToggleCheckIn}
          className="btn-primary"
          style={{
            padding: '1rem 2.5rem',
            fontSize: '1.1rem',
            background: isCheckedIn ? 'linear-gradient(135deg, #EF4444, #DC2626)' : 'linear-gradient(135deg, #10B981, #059669)'
          }}
        >
          {isCheckedIn ? <Square size={22} /> : <Play size={22} />}
          <span>{isCheckedIn ? 'Check Out Now' : 'Check In Now'}</span>
        </button>
      </div>

      {/* Attendance Logs Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem' }}>Attendance Entries & Log History</h3>
        {logs.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No attendance entries logged for this session yet. Click <strong>Check In Now</strong> above to log dynamic attendance entries.
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Worked Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.date}</td>
                    <td>{log.checkIn}</td>
                    <td>{log.checkOut}</td>
                    <td style={{ fontWeight: 600, color: '#C084FC' }}>{log.workedHours}</td>
                    <td>
                      <span className="status-badge active">
                        <CheckCircle size={12} />
                        {log.status}
                      </span>
                    </td>
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
