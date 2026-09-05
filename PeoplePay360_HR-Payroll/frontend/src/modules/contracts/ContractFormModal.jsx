import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import FormErrorBanner from '../../components/FormErrorBanner';
import FormFieldError from '../../components/FormFieldError';
import CustomDropdown from '../../components/CustomDropdown';
import { X, FileText, User, Mail, Lock, Building, Briefcase, Calendar, DollarSign, Layers, CheckCircle2, AlertCircle } from 'lucide-react';

export const ContractFormModal = ({ isOpen, onClose, contractToEdit, isRenewal = false, onSaved }) => {
  const [employeeName, setEmployeeName] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [employeeType, setEmployeeType] = useState('Contract');
  const [startDate, setStartDate] = useState('2026-09-05');
  const [endDate, setEndDate] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [jobPosition, setJobPosition] = useState('Software Engineer');
  const [wage, setWage] = useState(5000);
  const [status, setStatus] = useState('RUNNING');
  const [notes, setNotes] = useState('');

  const [errorObj, setErrorObj] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setErrorObj(null);
    setFieldErrors({});

    if (contractToEdit) {
      setEmployeeName(contractToEdit.employeeName || '');
      setEmployeeEmail(contractToEdit.employeeEmail || '');
      setPassword('password123');
      setEmployeeType('Contract');
      setStartDate(isRenewal ? '2026-09-05' : (contractToEdit.startDate || '2026-01-01'));
      setEndDate(isRenewal ? '' : (contractToEdit.endDate || ''));
      setDepartment(contractToEdit.department || 'Engineering');
      setJobPosition(contractToEdit.jobPosition || 'Software Engineer');
      setWage(contractToEdit.wage || 5000);
      setStatus(isRenewal ? 'RUNNING' : (contractToEdit.status || 'DRAFT'));
      setNotes(isRenewal ? `Plan Renewed from previous contract ${contractToEdit.contractRef || ''}` : (contractToEdit.notes || ''));
    } else {
      setEmployeeName('');
      setEmployeeEmail('');
      setPassword('password123');
      setEmployeeType('Contract');
      setStartDate('2026-09-05');
      setEndDate('');
      setWage(5000);
      setStatus('RUNNING');
      setNotes('');
    }
  }, [isOpen, contractToEdit, isRenewal]);

  const { user } = useAuth();
  const isHRAdmin = user && ['Admin', 'HR Payroll Manager', 'HR Manager', 'HR Payroll User'].includes(user.role);

  if (!isOpen || !isHRAdmin) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorObj(null);
    setFieldErrors({});
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const payload = {
        isRenewal: Boolean(isRenewal),
        employeeName,
        employeeEmail,
        password,
        employeeType: 'Contract',
        startDate,
        endDate: endDate || '',
        department,
        jobPosition,
        wage: Number(wage),
        status,
        notes
      };

      if (contractToEdit && !isRenewal) {
        await api.put(`/contracts/${contractToEdit.id || contractToEdit._id}`, payload);
        setSuccessMsg(`Contract '${contractToEdit.contractRef || 'Record'}' updated successfully!`);
      } else {
        const res = await api.post('/contracts', payload);
        setSuccessMsg(`New Renewed Contract '${res.data.contract?.contractRef || 'Record'}' created & activated!`);
      }

      setTimeout(() => {
        onSaved();
        onClose();
        setSuccessMsg('');
      }, 1200);
    } catch (err) {
      const errRes = err.response?.data?.error;
      setErrorObj(errRes || { message: err.response?.data?.message || 'Failed to save contract details' });
      if (errRes?.fields) {
        setFieldErrors(errRes.fields);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content fade-in" style={{ maxWidth: '650px' }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileText size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                {isRenewal ? `Renew Contract Plan — ${contractToEdit?.employeeName}` : contractToEdit ? `Edit Contract — ${contractToEdit.contractRef}` : 'Create New Employment Contract'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {isRenewal ? 'Set new duration and terms to renew active contract plan' : 'Capture employee details, employment terms, duration, wage, and status'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {errorObj && (
          <FormErrorBanner error={errorObj} onClose={() => setErrorObj(null)} />
        )}

        {successMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#6EE7B7', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRenewal ? (
            /* Employee Profile Card for Contract Renewal */
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              padding: '1rem',
              marginBottom: '1.25rem',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.85rem'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Employee Name</div>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', marginTop: '0.15rem' }}>{employeeName}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Email Address</div>
                <div style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.15rem' }}>{employeeEmail || 'N/A'}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Department</div>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem', marginTop: '0.15rem' }}>{department}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Position</div>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem', marginTop: '0.15rem' }}>{jobPosition}</div>
              </div>
            </div>
          ) : (
            /* Standard Employee Input Fields */
            <>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Employee Full Name *</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="#64748B" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    className={`form-input ${fieldErrors.employeeName ? 'input-error' : ''}`}
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="e.g. John Doe"
                    value={employeeName}
                    onChange={(e) => {
                      setEmployeeName(e.target.value);
                      if (fieldErrors.employeeName) setFieldErrors(p => ({ ...p, employeeName: null }));
                    }}
                    required
                  />
                </div>
                <FormFieldError error={fieldErrors.employeeName} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Email Address *</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="#64748B" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="email"
                      className={`form-input ${fieldErrors.employeeEmail ? 'input-error' : ''}`}
                      style={{ paddingLeft: '2.5rem' }}
                      placeholder="john.doe@company.com"
                      value={employeeEmail}
                      onChange={(e) => {
                        setEmployeeEmail(e.target.value);
                        if (fieldErrors.employeeEmail) setFieldErrors(p => ({ ...p, employeeEmail: null }));
                      }}
                      required
                    />
                  </div>
                  <FormFieldError error={fieldErrors.employeeEmail} />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Initial Password *</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="#64748B" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      className={`form-input ${fieldErrors.password ? 'input-error' : ''}`}
                      style={{ paddingLeft: '2.5rem' }}
                      placeholder="password123"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) setFieldErrors(p => ({ ...p, password: null }));
                      }}
                      required
                    />
                  </div>
                  <FormFieldError error={fieldErrors.password} />
                </div>
              </div>

              {/* Department & Position */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Department</label>
                  <input type="text" className="form-input" value={department} onChange={(e) => setDepartment(e.target.value)} required />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Job Position</label>
                  <input type="text" className="form-input" value={jobPosition} onChange={(e) => setJobPosition(e.target.value)} required />
                </div>
              </div>
            </>
          )}

          {/* Status */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Contract Status</label>
            <CustomDropdown
              options={[
                { value: 'DRAFT', label: 'Draft' },
                { value: 'RUNNING', label: 'Running' }
              ]}
              value={status}
              onChange={(val) => setStatus(val)}
            />
          </div>

          {/* Dates Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.02)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Start Date *</label>
              <input
                type="date"
                className={`form-input ${fieldErrors.startDate ? 'input-error' : ''}`}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (fieldErrors.startDate) setFieldErrors(p => ({ ...p, startDate: null }));
                }}
                required
              />
              <FormFieldError error={fieldErrors.startDate} />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">End Date *</label>
              <input
                type="date"
                className={`form-input ${fieldErrors.endDate ? 'input-error' : ''}`}
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (fieldErrors.endDate) setFieldErrors(p => ({ ...p, endDate: null }));
                }}
                required
              />
              <FormFieldError error={fieldErrors.endDate} />
            </div>
          </div>

          {/* Wage */}
          <div className="form-group" style={{ marginBottom: '1.2rem' }}>
            <label className="form-label">Monthly Base Wage ($) {isRenewal && '(Defaulted to Old Salary)'}</label>
            <div style={{ position: 'relative' }}>
              <DollarSign size={16} color="#10B981" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="number"
                min="0"
                className={`form-input ${fieldErrors.wage ? 'input-error' : ''}`}
                style={{ paddingLeft: '2.5rem' }}
                value={wage}
                onChange={(e) => {
                  setWage(e.target.value);
                  if (fieldErrors.wage) setFieldErrors(p => ({ ...p, wage: null }));
                }}
                required
              />
            </div>
            <FormFieldError error={fieldErrors.wage} />
          </div>

          {/* Notes */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Terms & Notes</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Enter special terms, probation period, or renewal notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting} style={isRenewal ? { background: 'linear-gradient(135deg, #10B981, #059669)' } : {}}>
              {isSubmitting ? 'Saving...' : isRenewal ? 'Confirm Renewal Plan' : contractToEdit ? 'Save Changes' : 'Create Contract Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
