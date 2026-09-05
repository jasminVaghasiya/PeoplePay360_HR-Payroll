import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, User, Filter, Eye } from 'lucide-react';

export const LeaveCalendarView = ({ onRequestClick, employees = [], types = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('Month'); // 'Month' | 'Week' | 'Day'
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = () => {
    setLoading(true);
    let url = `/timeoff/calendar?`;
    if (selectedEmployee) url += `employeeId=${selectedEmployee}&`;
    if (selectedType) url += `timeOffTypeId=${selectedType}&`;

    api.get(url)
      .then((res) => {
        if (res.data.success) {
          setEvents(res.data.events);
        }
      })
      .catch((err) => console.error('Calendar error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedEmployee, selectedType]);

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'Month') d.setMonth(d.getMonth() - 1);
    else if (viewMode === 'Week') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'Month') d.setMonth(d.getMonth() + 1);
    else if (viewMode === 'Week') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => setCurrentDate(new Date());

  // Generate Month Matrix
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Blank days for start
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    // Month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius-md) var(--radius-md) 0 0', overflow: 'hidden' }}>
          {weekDays.map((wd, i) => (
            <div key={i} style={{ padding: '0.6rem 0.5rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)', background: 'rgba(15, 21, 38, 0.9)' }}>
              {wd}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', borderTop: 'none', borderRadius: '0 0 var(--radius-md) var(--radius-md)' }}>
          {days.map((day, idx) => {
            if (!day) {
              return <div key={idx} style={{ minHeight: '100px', background: 'rgba(10, 14, 26, 0.4)' }} />;
            }

            const dayStr = day.toISOString().split('T')[0];
            const isToday = new Date().toDateString() === day.toDateString();

            // Find matching events for this day
            const dayEvents = events.filter((ev) => {
              const s = new Date(ev.start).toISOString().split('T')[0];
              const e = new Date(ev.end).toISOString().split('T')[0];
              return dayStr >= s && dayStr <= e;
            });

            return (
              <div
                key={idx}
                style={{
                  minHeight: '110px',
                  padding: '0.4rem',
                  background: isToday ? 'rgba(124, 58, 237, 0.08)' : 'rgba(15, 21, 38, 0.7)',
                  border: isToday ? '1px solid rgba(124, 58, 237, 0.4)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.3rem',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '0.82rem',
                    fontWeight: isToday ? 700 : 500,
                    color: isToday ? '#C084FC' : 'var(--text-muted)',
                    background: isToday ? 'rgba(124, 58, 237, 0.3)' : 'transparent',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%'
                  }}>
                    {day.getDate()}
                  </span>
                  {dayEvents.length > 0 && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                      {dayEvents.length} on leave
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto', maxHeight: '75px' }}>
                  {dayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => onRequestClick(ev.id)}
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.2rem 0.4rem',
                        borderRadius: '4px',
                        background: ev.status === 'Approved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        borderLeft: `3px solid ${ev.color || '#7C3AED'}`,
                        color: '#F8FAFC',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                      title={`${ev.employee}: ${ev.type} (${ev.duration} ${ev.unit})`}
                    >
                      <strong>{ev.employee}</strong> ({ev.type})
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Generate Week View
  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      weekDays.push(d);
    }

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
        {weekDays.map((d, i) => {
          const dStr = d.toISOString().split('T')[0];
          const isToday = new Date().toDateString() === d.toDateString();
          const dayEvents = events.filter((ev) => {
            const s = new Date(ev.start).toISOString().split('T')[0];
            const e = new Date(ev.end).toISOString().split('T')[0];
            return dStr >= s && dStr <= e;
          });

          return (
            <div
              key={i}
              className="glass-panel"
              style={{
                padding: '0.75rem',
                minHeight: '280px',
                border: isToday ? '1px solid rgba(124, 58, 237, 0.5)' : '1px solid var(--border-color)',
                background: isToday ? 'rgba(124, 58, 237, 0.08)' : 'rgba(15, 21, 38, 0.7)'
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  {d.toLocaleDateString(undefined, { weekday: 'short' })}
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: isToday ? '#C084FC' : '#fff' }}>
                  {d.getDate()}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => onRequestClick(ev.id)}
                    style={{
                      padding: '0.4rem 0.5rem',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.04)',
                      borderLeft: `4px solid ${ev.color || '#7C3AED'}`,
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#fff' }}>{ev.employee}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{ev.type}</div>
                    <div style={{ fontSize: '0.7rem', color: '#C084FC', marginTop: '0.1rem' }}>
                      {ev.duration} {ev.unit} • {ev.status}
                    </div>
                  </div>
                ))}
                {dayEvents.length === 0 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', display: 'block', marginTop: '1rem' }}>
                    No leaves
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Generate Day View
  const renderDayView = () => {
    const dStr = currentDate.toISOString().split('T')[0];
    const dayEvents = events.filter((ev) => {
      const s = new Date(ev.start).toISOString().split('T')[0];
      const e = new Date(ev.end).toISOString().split('T')[0];
      return dStr >= s && dStr <= e;
    });

    return (
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem' }}>
          Leaves on {currentDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </h3>

        {dayEvents.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No employees on leave on this date.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {dayEvents.map((ev) => (
              <div
                key={ev.id}
                onClick={() => onRequestClick(ev.id)}
                className="glass-panel glass-panel-interactive"
                style={{ padding: '1rem', borderLeft: `4px solid ${ev.color || '#7C3AED'}`, cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <strong style={{ color: '#fff', fontSize: '1rem' }}>{ev.employee}</strong>
                  <span className={`status-badge ${ev.status === 'Approved' ? 'active' : 'pending'}`}>
                    {ev.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#A78BFA' }}>{ev.type}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                  Duration: {ev.duration} {ev.unit} ({new Date(ev.start).toLocaleDateString()} - {new Date(ev.end).toLocaleDateString()})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      {/* Calendar Control Toolbar */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Date Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button onClick={handlePrev} className="icon-btn" style={{ padding: '0.4rem 0.6rem' }} title="Previous">
              <ChevronLeft size={18} />
            </button>
            <button onClick={handleToday} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}>
              Today
            </button>
            <button onClick={handleNext} className="icon-btn" style={{ padding: '0.4rem 0.6rem' }} title="Next">
              <ChevronRight size={18} />
            </button>
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginLeft: '0.5rem' }}>
            {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </h2>
        </div>

        {/* View Mode Toggle & Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Employee Filter */}
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
          >
            <option value="">All Employees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>

          {/* Leave Type Filter */}
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">All Leave Types</option>
            {types.map((t) => (
              <option key={t._id} value={t._id}>{t.name} ({t.code})</option>
            ))}
          </select>

          {/* View Mode Buttons */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius-md)', padding: '2px' }}>
            {['Month', 'Week', 'Day'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  background: viewMode === mode ? 'var(--primary-accent)' : 'transparent',
                  color: '#fff',
                  border: 'none',
                  padding: '0.35rem 0.8rem',
                  fontSize: '0.8rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontWeight: viewMode === mode ? 600 : 400
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Grid View */}
      {viewMode === 'Month' && renderMonthView()}
      {viewMode === 'Week' && renderWeekView()}
      {viewMode === 'Day' && renderDayView()}
    </div>
  );
};
