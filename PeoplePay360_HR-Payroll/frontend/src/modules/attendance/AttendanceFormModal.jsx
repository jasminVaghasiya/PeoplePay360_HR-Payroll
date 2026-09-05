import React, { useState, useEffect } from 'react';
import { X, Save, Clock, Calendar, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AttendanceFormModal = ({ isOpen, onClose, onSave, initialData = null, employees = [] }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    employeeEmail: '',
    department: 'General',
    jobPosition: 'Staff',
    date: new Date().toISOString().split('T')[0],
    checkInTime: '09:00',
    checkOutTime: '18:00',
    scheduledHours: 8.0,
    breakHours: 1.0,
    notes: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      const cInDate = initialData.checkIn ? new Date(initialData.checkIn) : null;
      const cOutDate = initialData.checkOut ? new Date(initialData.checkOut) : null;

      setFormData({
        employeeId: initialData.employeeId || '',
        employeeName: initialData.employeeName || '',
        employeeEmail: initialData.employeeEmail || '',
        department: initialData.department || 'General',
        jobPosition: initialData.jobPosition || 'Staff',
        date: initialData.date || new Date().toISOString().split('T')[0],
        checkInTime: cInDate ? cInDate.toTimeString().slice(0, 5) : '09:00',
        checkOutTime: cOutDate ? cOutDate.toTimeString().slice(0, 5) : '18:00',
        scheduledHours: initialData.scheduledHours || 8.0,
        breakHours: initialData.breakHours || 1.0,
        notes: initialData.notes || ''
      });
    } else if (employees.length > 0) {
      const firstEmp = employees[0];
      setFormData((prev) => ({
        ...prev,
        employeeId: firstEmp.id || firstEmp._id,
        employeeName: firstEmp.name,
        employeeEmail: firstEmp.email,
        department: firstEmp.department || 'General',
        jobPosition: firstEmp.jobPosition || 'Employee'
      }));
    }
  }, [initialData, employees]);

  if (!isOpen) return null;

  const handleEmployeeChange = (e) => {
    const empId = e.target.value;
    const selectedEmp = employees.find((emp) => (emp.id || emp._id) === empId);
    if (selectedEmp) {
      setFormData((prev) => ({
        ...prev,
        employeeId: empId,
        employeeName: selectedEmp.name,
        employeeEmail: selectedEmp.email,
        department: selectedEmp.department || 'General',
        jobPosition: selectedEmp.jobPosition || 'Employee'
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.date || !formData.checkInTime) {
      setError('Date and Check-In time are required.');
      return;
    }

    setSubmitting(true);
    try {
      const checkInISO = new Date(`${formData.date}T${formData.checkInTime}:00`).toISOString();
      const checkOutISO = formData.checkOutTime
        ? new Date(`${formData.date}T${formData.checkOutTime}:00`).toISOString()
        : null;

      const payload = {
        employeeId: formData.employeeId,
        employeeName: formData.employeeName,
        employeeEmail: formData.employeeEmail,
        department: formData.department,
        jobPosition: formData.jobPosition,
        date: formData.date,
        checkIn: checkInISO,
        checkOut: checkOutISO,
        scheduledHours: Number(formData.scheduledHours || 8.0),
        breakHours: Number(formData.breakHours || 1.0),
        notes: formData.notes
      };

      const result = await onSave(payload, initialData?._id || initialData?.id);
      if (!result?.success) {
        setError(result?.message || 'Failed to save attendance record');
      } else {
        onClose();
      }
    } catch (err) {
      setError('Invalid date or time entry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay fade-in" style={{ zIndex: 1000 }}>
      <div className="modal-content glass-panel" style={{ maxWidth: '640px', width: '90%', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: '1rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Clock color="#A78BFA" size={24} />
            {initialData ? 'Edit Attendance Record' : 'Manual Attendance Entry'}
          </h2>
          <button onClick={onClose} className="btn-icon" style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#FCA5A5', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.88rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* 2-Column Field Grid matching Specification Form View */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.2rem' }}>
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* 1. Employee */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Employee
                </label>
                {initialData ? (
                  <input
                    type="text"
                    value={formData.employeeName}
                    disabled
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  />
                ) : (
                  <select
                    value={formData.employeeId}
                    onChange={handleEmployeeChange}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#111726', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
                  >
                    {employees.map((emp) => (
                      <option key={emp.id || emp._id} value={emp.id || emp._id}>
                        {emp.name} ({emp.department || 'General'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* 2. Check In */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Check In
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.5rem' }}>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#111726', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
                    required
                  />
                  <input
                    type="time"
                    value={formData.checkInTime}
                    onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#111726', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
                    required
                  />
                </div>
              </div>

              {/* 3. Check Out */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Check Out
                </label>
                <input
                  type="time"
                  value={formData.checkOutTime}
                  onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#111726', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
                />
              </div>

              {/* 4. Worked Hours */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Worked Hours
                </label>
                <input
                  type="text"
                  value={initialData?.workedHours ? `${initialData.workedHours} hrs` : 'Calculated automatically'}
                  disabled
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#C084FC', fontWeight: 600 }}
                />
              </div>
            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* 5. Department */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  disabled
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                />
              </div>

              {/* 6. Edited By (Auto-Filled) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Edited By (Auto-Filled)
                </label>
                <input
                  type="text"
                  value={user?.name || initialData?.updatedBy || 'HR Admin'}
                  disabled
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.3)', color: '#C084FC', fontWeight: 600 }}
                />
              </div>

              {/* 7. Status (Auto-Assigned) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Status (Auto-Assigned)
                </label>
                <div style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34D399', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={16} />
                  <span>{initialData?.status || 'Auto-assigned by Schedule Config'}</span>
                </div>
              </div>

              {/* 8. Overtime */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Overtime
                </label>
                <input
                  type="text"
                  value={initialData?.overtimeHours ? `${initialData.overtimeHours} hrs` : '0.00 hrs'}
                  disabled
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FBBF24', fontWeight: 600 }}
                />
              </div>
            </div>
          </div>

          {/* 9. Notes */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Notes
            </label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes & details..."
              style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#111726', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              <Save size={18} />
              <span>{submitting ? 'Saving...' : initialData ? 'Update Record' : 'Create Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
