import React, { useState, useEffect } from 'react';
import { X, Save, Settings, Calendar, Clock, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

export const AttendanceSettingsModal = ({ isOpen, onClose, onConfigSaved }) => {
  const [config, setConfig] = useState({
    standardCheckIn: '09:00',
    standardCheckOut: '18:00',
    scheduledHours: 8.0,
    breakHours: 1.0,
    lateGraceMinutes: 15,
    holidays: []
  });

  const [newHoliday, setNewHoliday] = useState({
    name: '',
    date: '',
    isPaid: true
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance/settings');
      if (res.data.success && res.data.config) {
        setConfig(res.data.config);
      }
    } catch (err) {
      console.error('[Attendance Settings Load Error]', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleAddHoliday = (e) => {
    e.preventDefault();
    if (!newHoliday.name || !newHoliday.date) return;

    const updatedHolidays = [...(config.holidays || []), { ...newHoliday, _id: `h_${Date.now()}` }];
    setConfig({ ...config, holidays: updatedHolidays });
    setNewHoliday({ name: '', date: '', isPaid: true });
  };

  const handleDeleteHoliday = (idx) => {
    const updated = config.holidays.filter((_, i) => i !== idx);
    setConfig({ ...config, holidays: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: '', text: '' });
    try {
      const res = await api.put('/attendance/settings', config);
      if (res.data.success) {
        setMsg({ type: 'success', text: 'Schedule & Holiday Configuration saved successfully!' });
        if (onConfigSaved) onConfigSaved();
        setTimeout(() => onClose(), 1200);
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save configuration.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay fade-in" style={{ zIndex: 1000 }}>
      <div className="modal-content glass-panel" style={{ maxWidth: '750px', width: '92%', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Settings color="#A78BFA" size={24} />
              Attendance Operations & Schedule Configuration
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Define company working hours, check-in/out thresholds, grace period, and holiday calendar for automated attendance status assignment.
            </p>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {msg.text && (
          <div style={{
            background: msg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: msg.type === 'success' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
            color: msg.type === 'success' ? '#34D399' : '#FCA5A5',
            padding: '0.8rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '0.88rem'
          }}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Section 1: Schedule Configuration */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#A78BFA', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} /> Standard Working Schedule & Rules
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Standard Check-In Time
                </label>
                <input
                  type="time"
                  value={config.standardCheckIn}
                  onChange={(e) => setConfig({ ...config, standardCheckIn: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#111726', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Standard Check-Out Time
                </label>
                <input
                  type="time"
                  value={config.standardCheckOut}
                  onChange={(e) => setConfig({ ...config, standardCheckOut: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#111726', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Late Grace Period (Minutes)
                </label>
                <input
                  type="number"
                  value={config.lateGraceMinutes}
                  onChange={(e) => setConfig({ ...config, lateGraceMinutes: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#111726', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Daily Scheduled Hours
              </label>
              <input
                type="number"
                step="0.5"
                value={config.scheduledHours}
                onChange={(e) => setConfig({ ...config, scheduledHours: Number(e.target.value) })}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#111726', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
              />
            </div>
          </div>

          {/* Section 2: Weekly Off Days (Sunday Default + Additional Days) */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#A78BFA', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} /> Weekly Off Days Configuration (Sunday Default)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Sunday is configured as the default weekly off holiday. Select additional days below to set extra recurring weekly holidays (e.g. Saturday & Sunday).
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => {
                const isSelected = (config.weeklyOffDays || ['Sunday']).includes(day);
                const isSunday = day === 'Sunday';

                const toggleDay = () => {
                  let currentOffs = config.weeklyOffDays || ['Sunday'];
                  if (isSelected) {
                    currentOffs = currentOffs.filter((d) => d !== day);
                  } else {
                    currentOffs = [...currentOffs, day];
                  }
                  setConfig({ ...config, weeklyOffDays: currentOffs });
                };

                return (
                  <button
                    type="button"
                    key={day}
                    onClick={toggleDay}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: isSelected ? '1px solid rgba(167, 139, 250, 0.6)' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: isSelected ? 'rgba(124, 58, 237, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                      color: isSelected ? '#C084FC' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isSelected && <CheckCircle2 size={14} color="#C084FC" />}
                    <span>{day}</span>
                    {isSunday && (
                      <span style={{ fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34D399', padding: '0.1rem 0.4rem', borderRadius: '6px', marginLeft: '0.2rem' }}>
                        Default
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Company Custom Holidays Calendar */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#A78BFA', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} /> Specific Date Custom Holidays
            </h3>

            {/* Add Holiday Subform */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '1rem', background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Holiday Name</label>
                <input
                  type="text"
                  placeholder="e.g. Independence Day"
                  value={newHoliday.name}
                  onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: '#111726', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
              <div style={{ width: '160px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Holiday Date</label>
                <input
                  type="date"
                  value={newHoliday.date}
                  onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: '#111726', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
              <button
                type="button"
                onClick={handleAddHoliday}
                className="btn-primary"
                style={{ padding: '0.55rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
              >
                <Plus size={16} /> Add Holiday
              </button>
            </div>

            {/* Holidays List */}
            <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
              {!config.holidays || config.holidays.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                  No custom holidays configured yet.
                </div>
              ) : (
                <table className="data-table" style={{ fontSize: '0.83rem' }}>
                  <thead>
                    <tr>
                      <th>Holiday Name</th>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {config.holidays.map((h, idx) => (
                      <tr key={h._id || idx}>
                        <td style={{ fontWeight: 600, color: '#fff' }}>{h.name}</td>
                        <td style={{ color: '#FBBF24', fontFamily: 'monospace' }}>{h.date}</td>
                        <td>
                          <span style={{ fontSize: '0.75rem', background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                            {h.isPaid ? 'Paid Holiday' : 'Unpaid Holiday'}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleDeleteHoliday(idx)}
                            style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                            title="Remove Holiday"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              <Save size={18} />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
