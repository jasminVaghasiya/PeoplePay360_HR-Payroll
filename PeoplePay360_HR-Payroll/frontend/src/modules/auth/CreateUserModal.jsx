import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, UserPlus, ShieldAlert, CheckCircle2, Mail, Lock, User, Building, Briefcase, Image, Upload, Link, Clock } from 'lucide-react';

export const CreateUserModal = ({ isOpen, onClose, onUserCreated }) => {
  const { user: currentUser, createNewUser, canCreateRole } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState('Employee');
  const [department, setDepartment] = useState('Engineering');
  const [jobPosition, setJobPosition] = useState('Software Engineer');
  const [employeeType, setEmployeeType] = useState('Permanent');
  const [contractStartDate, setContractStartDate] = useState('');
  const [contractEndDate, setContractEndDate] = useState('');
  
  // Photo input modes: 'link' or 'browse'
  const [photoMode, setPhotoMode] = useState('link');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFileBase64, setPhotoFileBase64] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const ALL_ROLES = [
    { value: 'Employee', label: 'Employee (Self-Service portal)' },
    { value: 'HR Manager', label: 'HR Manager (Full HR, Attendance & Time Off CRUD)' },
    { value: 'HR Payroll User', label: 'HR Payroll User (HR + Payruns/Payslips Read-Write)' },
    { value: 'HR Payroll Manager', label: 'HR Payroll Manager (Full HR & Payroll Operations)' },
    { value: 'Admin', label: 'Admin (Full System & User Management Access)' }
  ];

  const allowedRoles = ALL_ROLES.filter((r) => canCreateRole(r.value));

  // Handle local file browse
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoFileBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const finalPhoto = photoMode === 'browse' ? photoFileBase64 : photoUrl;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsSubmitting(true);

    const payload = {
      name,
      email,
      password,
      role,
      department,
      jobPosition,
      employeeType,
      contractStartDate: employeeType === 'Contract' ? contractStartDate : '',
      contractEndDate: employeeType === 'Contract' ? contractEndDate : '',
      contractDuration: employeeType === 'Contract' && contractStartDate && contractEndDate ? `${contractStartDate} to ${contractEndDate}` : '',
      photo: finalPhoto || undefined
    };

    const res = await createNewUser(payload);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg(`User '${name}' (${role}) created successfully!`);
      setTimeout(() => {
        onUserCreated();
        onClose();
        setName('');
        setEmail('');
        setEmployeeType('Permanent');
        setContractStartDate('');
        setContractEndDate('');
        setPhotoUrl('');
        setPhotoFileBase64('');
        setSuccessMsg('');
      }, 1400);
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #714b67, #7C3AED)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserPlus size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Create New User</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Authority: Logged in as <strong style={{ color: '#C084FC' }}>{currentUser?.name}</strong> ({currentUser?.role})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={22} />
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#FCA5A5',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#6EE7B7',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#64748B" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address (Login ID)</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#64748B" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="john.doe@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Assign Role</label>
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {allowedRoles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.value}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Initial Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#64748B" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Department</label>
              <div style={{ position: 'relative' }}>
                <Building size={16} color="#64748B" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Engineering"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Job Position</label>
              <div style={{ position: 'relative' }}>
                <Briefcase size={16} color="#64748B" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Software Engineer"
                  value={jobPosition}
                  onChange={(e) => setJobPosition(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Employee Type</label>
            <select
              className="form-select"
              value={employeeType}
              onChange={(e) => setEmployeeType(e.target.value)}
            >
              <option value="Permanent">Permanent</option>
              <option value="Contract">Contract</option>
            </select>
          </div>

          {employeeType === 'Contract' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', background: 'rgba(245, 158, 11, 0.08)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ color: '#FBBF24', fontWeight: 600 }}>Contract Start Date *</label>
                <input
                  type="date"
                  className="form-input"
                  style={{ border: '1px solid rgba(245, 158, 11, 0.5)' }}
                  value={contractStartDate}
                  onChange={(e) => setContractStartDate(e.target.value)}
                  required={employeeType === 'Contract'}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ color: '#FBBF24', fontWeight: 600 }}>Contract End Date *</label>
                <input
                  type="date"
                  className="form-input"
                  style={{ border: '1px solid rgba(245, 158, 11, 0.5)' }}
                  value={contractEndDate}
                  onChange={(e) => setContractEndDate(e.target.value)}
                  required={employeeType === 'Contract'}
                />
              </div>
            </div>
          )}

          {/* User Photo Options: Browse File or Image URL Link */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label className="form-label">User Photo Source</label>
              <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem', borderRadius: 'var(--radius-sm)' }}>
                <button
                  type="button"
                  onClick={() => setPhotoMode('browse')}
                  style={{
                    background: photoMode === 'browse' ? 'rgba(124, 58, 237, 0.4)' : 'transparent',
                    border: 'none',
                    color: '#fff',
                    padding: '0.25rem 0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <Upload size={12} />
                  <span>Browse File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoMode('link')}
                  style={{
                    background: photoMode === 'link' ? 'rgba(124, 58, 237, 0.4)' : 'transparent',
                    border: 'none',
                    color: '#fff',
                    padding: '0.25rem 0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <Link size={12} />
                  <span>Image URL</span>
                </button>
              </div>
            </div>

            {photoMode === 'browse' ? (
              <div style={{ position: 'relative' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="form-input"
                  style={{ padding: '0.5rem 1rem' }}
                />
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <Image size={16} color="#64748B" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="https://images.unsplash.com/photo-..."
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                />
              </div>
            )}

            {/* Thumbnail Preview */}
            {finalPhoto && (
              <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img
                  src={finalPhoto}
                  alt="Preview"
                  style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #7C3AED' }}
                />
                <span style={{ fontSize: '0.78rem', color: '#34D399' }}>Photo preview loaded</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              <UserPlus size={18} />
              <span>{isSubmitting ? 'Creating...' : 'Create User & Account'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
