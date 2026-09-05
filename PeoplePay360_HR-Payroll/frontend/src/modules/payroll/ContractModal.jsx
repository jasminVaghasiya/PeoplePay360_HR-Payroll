import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  X,
  FileText,
  AlertTriangle,
  Calendar,
  DollarSign,
  Building,
  User,
  ShieldCheck
} from 'lucide-react';

export const ContractModal = ({ isOpen, onClose, onSuccess, editContract = null, employees = [], structures = [] }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [contractName, setContractName] = useState('');
  const [wage, setWage] = useState(65000);
  const [wageType, setWageType] = useState('Monthly');
  const [salaryStructureId, setSalaryStructureId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('Active');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIFSC, setBankIFSC] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [taxId, setTaxId] = useState('');
  const [workingSchedule, setWorkingSchedule] = useState('Standard 40h/week (Mon-Fri 09:00 - 18:00)');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editContract) {
      setEmployeeId(editContract.employeeId?._id || editContract.employeeId || '');
      setContractName(editContract.contractName || '');
      setWage(editContract.wage || 0);
      setWageType(editContract.wageType || 'Monthly');
      setSalaryStructureId(editContract.salaryStructureId?._id || editContract.salaryStructureId || '');
      setStartDate(editContract.startDate ? new Date(editContract.startDate).toISOString().split('T')[0] : '');
      setEndDate(editContract.endDate ? new Date(editContract.endDate).toISOString().split('T')[0] : '');
      setStatus(editContract.status || 'Active');
      setBankName(editContract.bankName || '');
      setBankAccountNumber(editContract.bankAccountNumber || '');
      setBankIFSC(editContract.bankIFSC || '');
      setPanNumber(editContract.panNumber || '');
      setTaxId(editContract.taxId || '');
      setWorkingSchedule(editContract.workingSchedule || 'Standard 40h/week (Mon-Fri 09:00 - 18:00)');
    } else {
      setEmployeeId(employees[0]?.id || employees[0]?._id || '');
      setContractName(`CON-2026-${Math.floor(100 + Math.random() * 900)}`);
      setWage(50000);
      setWageType('Monthly');
      setSalaryStructureId(structures[0]?._id || '');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setStatus('Active');
      setBankName('');
      setBankAccountNumber('');
      setBankIFSC('');
      setPanNumber('');
      setTaxId(`TX-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  }, [editContract, isOpen, employees, structures]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId || !contractName || !wage || !startDate) {
      setError('Please provide all mandatory contract fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        employeeId,
        contractName,
        wage: Number(wage),
        wageType,
        salaryStructureId: salaryStructureId || null,
        startDate,
        endDate: endDate || null,
        status,
        bankName,
        bankAccountNumber,
        bankIFSC,
        panNumber,
        taxId,
        workingSchedule
      };

      let res;
      if (editContract) {
        res = await api.put(`/payroll/contracts/${editContract._id}`, payload);
      } else {
        res = await api.post('/payroll/contracts', payload);
      }

      if (res.data.success) {
        onSuccess(res.data.message || 'Contract saved successfully.');
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save contract');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content glass-panel" style={{ maxWidth: '640px', padding: '1.5rem 1.75rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.18)', border: '1px solid rgba(6, 182, 212, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={18} color="#22D3EE" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                {editContract ? 'Edit Employee Contract' : 'Create New Employee Contract'}
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Configure base wage, salary structure assignment, validity dates & bank information
              </p>
            </div>
          </div>
          <button onClick={onClose} className="icon-btn" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.6rem 0.85rem',
            marginBottom: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#F87171',
            fontSize: '0.8rem'
          }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Section 1: Employee & Reference */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.25rem' }}>Target Employee *</label>
              <select
                className="form-select"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                disabled={!!editContract}
                required
              >
                {employees.map((emp) => (
                  <option key={emp.id || emp._id} value={emp.id || emp._id}>
                    {emp.name} ({emp.department} — {emp.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.25rem' }}>Contract Ref *</label>
              <input
                type="text"
                className="form-input"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', textTransform: 'uppercase' }}
                placeholder="e.g. CON-2026-SJ01"
                value={contractName}
                onChange={(e) => setContractName(e.target.value.toUpperCase())}
                required
              />
            </div>
          </div>

          {/* Section 2: Wage & Salary Structure Grid */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.65rem'
          }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Base Wage (₹) *</label>
              <input
                type="number"
                min="0"
                className="form-input"
                style={{ padding: '0.45rem 0.65rem', fontSize: '0.82rem' }}
                value={wage}
                onChange={(e) => setWage(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Wage Frequency</label>
              <select className="form-select" style={{ padding: '0.45rem 0.65rem', fontSize: '0.82rem' }} value={wageType} onChange={(e) => setWageType(e.target.value)}>
                <option value="Monthly">Monthly Salary</option>
                <option value="Hourly">Hourly Rate</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Assigned Salary Structure</label>
              <select className="form-select" style={{ padding: '0.45rem 0.65rem', fontSize: '0.82rem' }} value={salaryStructureId} onChange={(e) => setSalaryStructureId(e.target.value)}>
                {structures.map((s) => (
                  <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 3: Period Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.25rem' }}>Start Date *</label>
              <input
                type="date"
                className="form-input"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.82rem' }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.25rem' }}>End Date (Leave blank for Ongoing)</label>
              <input
                type="date"
                className="form-input"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.82rem' }}
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Section 4: Bank Details for Payroll */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.65rem'
          }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Bank Name</label>
              <input
                type="text"
                className="form-input"
                style={{ padding: '0.45rem 0.65rem', fontSize: '0.82rem' }}
                placeholder="e.g. HDFC Bank Ltd"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Account Number</label>
              <input
                type="text"
                className="form-input"
                style={{ padding: '0.45rem 0.65rem', fontSize: '0.82rem' }}
                placeholder="e.g. 501002345678"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>IFSC Code</label>
              <input
                type="text"
                className="form-input"
                style={{ padding: '0.45rem 0.65rem', fontSize: '0.82rem', textTransform: 'uppercase' }}
                placeholder="e.g. HDFC0001234"
                value={bankIFSC}
                onChange={(e) => setBankIFSC(e.target.value.toUpperCase())}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>PAN / Tax ID</label>
              <input
                type="text"
                className="form-input"
                style={{ padding: '0.45rem 0.65rem', fontSize: '0.82rem', textTransform: 'uppercase' }}
                placeholder="e.g. ABCDE1234F"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" disabled={loading} style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.45rem 1.3rem', fontSize: '0.82rem' }}>
              {loading ? 'Saving...' : (editContract ? 'Update Contract' : 'Save Contract')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
