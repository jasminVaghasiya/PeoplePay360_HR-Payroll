import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CustomDropdown from '../../components/CustomDropdown';
import { X, UserPlus, ShieldAlert, CheckCircle2, Mail, Lock, User, Building, Briefcase, Image, Upload, Link, Clock, DollarSign, Calendar, Sparkles, Plus, Check, Edit } from 'lucide-react';

export const CreateUserModal = ({ isOpen, onClose, onUserCreated, userToEdit = null }) => {
  const { user: currentUser, createNewUser, canCreateRole } = useAuth();
  const isEditMode = Boolean(userToEdit);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState('Employee');
  const [department, setDepartment] = useState('IT');
  const [jobPosition, setJobPosition] = useState('Software Engineer');
  const [salary, setSalary] = useState(70000);
  const [employeeType, setEmployeeType] = useState('Permanent');
  const [contractStartDate, setContractStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [contractEndDate, setContractEndDate] = useState('');

  // Dynamic departments & positions from settings
  const [departmentsList, setDepartmentsList] = useState([]);
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [isCustomPos, setIsCustomPos] = useState(false);
  
  // Photo input modes: 'link' or 'browse'
  const [photoMode, setPhotoMode] = useState('link');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFileBase64, setPhotoFileBase64] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (userToEdit) {
        setName(userToEdit.name || '');
        setEmail(userToEdit.email || '');
        setPassword('');
        setRole(userToEdit.role || 'Employee');
        setDepartment(userToEdit.department || 'IT');
        setJobPosition(userToEdit.jobPosition || 'Employee');
        setSalary(userToEdit.salary || 50000);
        setEmployeeType(userToEdit.employeeType || 'Permanent');
        setContractStartDate(userToEdit.contractStartDate || '');
        setContractEndDate(userToEdit.contractEndDate || '');
        setPhotoUrl(userToEdit.photo || '');
        setPhotoFileBase64('');
      } else {
        setName('');
        setEmail('');
        setPassword('password123');
        setRole('Employee');
        setDepartment('IT');
        setJobPosition('Software Engineer');
        setSalary(70000);
        setEmployeeType('Permanent');
        setContractStartDate(new Date().toISOString().split('T')[0]);
        setContractEndDate('');
        setPhotoUrl('');
        setPhotoFileBase64('');
      }
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen, userToEdit]);

  useEffect(() => {
    if (employeeType === 'Contract') {
      setRole('Employee');
    }
  }, [employeeType]);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const res = await api.get('/settings/departments');
        if (res.data.success && res.data.data.length > 0) {
          const list = res.data.data;
          setDepartmentsList(list);
          // Set initial default if not chosen and not in edit mode
          if (!userToEdit) {
            const firstDept = list[0];
            if (firstDept) {
              setDepartment(firstDept.name);
              if (firstDept.positions && firstDept.positions.length > 0) {
                setJobPosition(firstDept.positions[0].title);
                if (firstDept.positions[0].defaultSalary) {
                  setSalary(firstDept.positions[0].defaultSalary);
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load departments from API, using cached departments:', err.message);
        const cached = localStorage.getItem('peoplepay360_departments');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.length > 0) {
              setDepartmentsList(parsed);
              const firstDept = parsed[0];
              if (firstDept && !department) {
                setDepartment(firstDept.name);
                if (firstDept.positions?.length > 0) {
                  setJobPosition(firstDept.positions[0].title);
                  if (firstDept.positions[0].defaultSalary) setSalary(firstDept.positions[0].defaultSalary);
                }
              }
            }
          } catch (e) {}
        }
      }
    };
    if (isOpen) {
      loadDepartments();
    }
  }, [isOpen]);

  const handleDepartmentChange = (deptName) => {
    if (deptName === '__CUSTOM__') {
      setIsCustomDept(true);
      setDepartment('');
      setIsCustomPos(true);
      setJobPosition('');
      return;
    }
    setIsCustomDept(false);
    setDepartment(deptName);
    const matched = departmentsList.find((d) => d.name === deptName);
    if (matched && matched.positions && matched.positions.length > 0) {
      setIsCustomPos(false);
      setJobPosition(matched.positions[0].title);
      if (matched.positions[0].defaultSalary) {
        setSalary(matched.positions[0].defaultSalary);
      }
    } else {
      setIsCustomPos(true);
      setJobPosition('');
    }
  };

  const handlePositionChange = (posTitle) => {
    if (posTitle === '__CUSTOM__') {
      setIsCustomPos(true);
      setJobPosition('');
      return;
    }
    setIsCustomPos(false);
    setJobPosition(posTitle);
    const matchedDept = departmentsList.find((d) => d.name === department);
    const matchedPos = matchedDept?.positions?.find((p) => p.title === posTitle);
    if (matchedPos && matchedPos.defaultSalary) {
      setSalary(matchedPos.defaultSalary);
    }
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);

    // If selected role is an HR role (HR Manager, HR Payroll User, HR Payroll Manager)
    if (newRole && (newRole.startsWith('HR') || newRole.includes('HR'))) {
      setIsCustomDept(false);
      setDepartment('HR');
      setIsCustomPos(false);
      setJobPosition(newRole);

      const hrSalaries = {
        'HR Manager': 85000,
        'HR Payroll Manager': 95000,
        'HR Payroll User': 60000
      };

      const hrDept = departmentsList.find((d) => d.name === 'HR' || d.code === 'HR');
      const matchedPos = hrDept?.positions?.find(
        (p) => p.title.toLowerCase() === newRole.toLowerCase()
      );

      if (matchedPos && matchedPos.defaultSalary) {
        setSalary(matchedPos.defaultSalary);
      } else if (hrSalaries[newRole]) {
        setSalary(hrSalaries[newRole]);
      }
    }
  };

  // Memoized rich options for Department dropdown
  const deptOptions = useMemo(() => {
    const opts = departmentsList.map((d) => ({
      value: d.name,
      label: d.name,
      code: d.code,
      color: d.color || '#3B82F6',
      positionsCount: d.positions?.length || 0
    }));

    if (department && !departmentsList.some((d) => d.name.toLowerCase() === department.toLowerCase())) {
      opts.unshift({
        value: department,
        label: department,
        code: department.substring(0, 4).toUpperCase(),
        color: '#8B5CF6',
        positionsCount: 0
      });
    }

    opts.push({
      value: '__CUSTOM__',
      label: '+ Custom Department...',
      isCustomAction: true
    });
    return opts;
  }, [departmentsList, department]);

  // Memoized rich options for Job Position dropdown
  const positionOptions = useMemo(() => {
    const currentDept = departmentsList.find(
      (d) => d.name.toLowerCase() === department.toLowerCase()
    );
    const posList = currentDept?.positions || [];
    const opts = posList.map((p) => ({
      value: p.title,
      label: p.title,
      level: p.level || 'Mid-Level',
      defaultSalary: p.defaultSalary || 50000,
      code: p.code
    }));

    if (jobPosition && !posList.some((p) => p.title.toLowerCase() === jobPosition.toLowerCase())) {
      opts.unshift({
        value: jobPosition,
        label: jobPosition,
        level: role.startsWith('HR') ? 'Selected Role' : 'Custom',
        defaultSalary: salary || 50000
      });
    }

    opts.push({
      value: '__CUSTOM__',
      label: '+ Custom Position...',
      isCustomAction: true
    });
    return opts;
  }, [departmentsList, department, jobPosition, role, salary]);

  if (!isOpen) return null;

  const ALL_ROLES = [
    { value: 'Employee', label: 'Employee (Self-Service portal)' },
    { value: 'HR Manager', label: 'HR Manager (Full HR, Attendance & Time Off CRUD)' },
    { value: 'HR Payroll User', label: 'HR Payroll User (HR + Payruns/Payslips Read-Write)' },
    { value: 'HR Payroll Manager', label: 'HR Payroll Manager (Full HR & Payroll Operations)' }
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
      salary: Number(salary) || 0,
      wage: Number(salary) || 0,
      employeeType,
      contractStartDate: employeeType === 'Contract' ? contractStartDate : undefined,
      contractEndDate: employeeType === 'Contract' ? contractEndDate : undefined,
      photo: finalPhoto || undefined
    };

    if (isEditMode) {
      try {
        const userId = userToEdit.id || userToEdit._id;
        if (!password || !password.trim()) {
          delete payload.password;
        }
        const res = await api.put(`/auth/users/${userId}`, payload);
        setIsSubmitting(false);

        if (res.data?.success) {
          setSuccessMsg(`Employee '${name}' updated successfully!`);
          setTimeout(() => {
            if (typeof onUserCreated === 'function') onUserCreated();
            onClose();
            setSuccessMsg('');
          }, 1200);
        } else {
          setError(res.data?.message || 'Failed to update employee details');
        }
      } catch (err) {
        setIsSubmitting(false);
        setError(err.response?.data?.message || err.message || 'Failed to update employee');
      }
      return;
    }

    const res = await createNewUser(payload);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg(`User '${name}' (${role}) with salary ₹${Number(salary).toLocaleString()}/mo created successfully!`);
      setTimeout(() => {
        onUserCreated();
        onClose();
        setName('');
        setEmail('');
        setSalary(65000);
        setEmployeeType('Permanent');
        setPhotoUrl('');
        setPhotoFileBase64('');
        setSuccessMsg('');
      }, 1400);
    } else {
      setError(res.message);
    }
  };

  const canChangeRole = employeeType !== 'Contract' && allowedRoles.length > 0 && (!userToEdit || userToEdit.role !== 'Admin');

  return (
    <div className="modal-overlay">
      <div className="modal-content fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: isEditMode
                ? 'linear-gradient(135deg, #2563EB, #7C3AED)'
                : 'linear-gradient(135deg, #714b67, #7C3AED)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isEditMode ? <Edit size={20} color="#fff" /> : <UserPlus size={20} color="#fff" />}
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                {isEditMode ? 'Edit Employee Profile' : 'Create New User'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {isEditMode ? (
                  <>Editing employee <strong style={{ color: '#C084FC' }}>{userToEdit?.name}</strong> ({userToEdit?.email})</>
                ) : (
                  <>Authority: Logged in as <strong style={{ color: '#C084FC' }}>{currentUser?.name}</strong> ({currentUser?.role})</>
                )}
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

          {canChangeRole ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Assign Role</label>
                <CustomDropdown
                  options={allowedRoles.map((r) => ({ value: r.value, label: r.value }))}
                  value={role}
                  onChange={(val) => handleRoleChange(val)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {isEditMode ? 'Change Password (Optional)' : 'Initial Password'}
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#64748B" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder={isEditMode ? 'Leave blank to keep existing password' : 'Enter initial password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!isEditMode}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">
                {isEditMode ? 'Change Password (Optional)' : 'Initial Password'}
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#64748B" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder={isEditMode ? 'Leave blank to keep existing password' : 'Enter initial password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!isEditMode}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Department Selection */}
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Department</label>
                {departmentsList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomDept(!isCustomDept);
                      if (!isCustomDept) setDepartment('');
                      else if (departmentsList[0]) handleDepartmentChange(departmentsList[0].name);
                    }}
                    style={{ background: 'none', border: 'none', color: '#A78BFA', fontSize: '0.72rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {isCustomDept ? 'Choose from list' : '+ Custom'}
                  </button>
                )}
              </div>
              <div>
                {!isCustomDept && departmentsList.length > 0 ? (
                  <CustomDropdown
                    options={deptOptions}
                    value={department}
                    onChange={(val) => handleDepartmentChange(val)}
                    icon={<Building size={16} />}
                    placeholder="Select Department..."
                    renderOption={(opt, isSelected) => {
                      if (opt.isCustomAction) {
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#C084FC', fontWeight: 600, padding: '0.3rem 0' }}>
                            <Plus size={15} />
                            <span>{opt.label}</span>
                          </div>
                        );
                      }
                      return (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          gap: '1rem',
                          padding: '0.35rem 0',
                          whiteSpace: 'nowrap'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, whiteSpace: 'nowrap' }}>
                            <span style={{
                              fontWeight: 600,
                              color: isSelected ? '#FFFFFF' : '#F1F5F9',
                              fontSize: '0.88rem',
                              whiteSpace: 'nowrap',
                              letterSpacing: '-0.01em'
                            }}>
                              {opt.label}
                            </span>
                            {opt.code && (
                              <span style={{
                                fontSize: '0.68rem',
                                padding: '0.12rem 0.45rem',
                                borderRadius: '5px',
                                background: 'rgba(124, 58, 237, 0.18)',
                                color: '#C084FC',
                                fontWeight: 700,
                                border: '1px solid rgba(168, 85, 247, 0.35)',
                                whiteSpace: 'nowrap'
                              }}>
                                {opt.code}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0, whiteSpace: 'nowrap' }}>
                            <span style={{
                              fontSize: '0.74rem',
                              color: '#94A3B8',
                              background: 'rgba(255, 255, 255, 0.05)',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '5px',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              whiteSpace: 'nowrap'
                            }}>
                              {opt.positionsCount} {opt.positionsCount === 1 ? 'pos' : 'positions'}
                            </span>
                            {isSelected && <Check size={16} color="#34D399" style={{ flexShrink: 0 }} />}
                          </div>
                        </div>
                      );
                    }}
                    renderTrigger={(selected) => (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem' }}>
                          {selected ? selected.label : department || 'Select Department...'}
                        </span>
                        {selected?.code && (
                          <span style={{
                            fontSize: '0.68rem',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            background: 'rgba(124, 58, 237, 0.2)',
                            color: '#C084FC',
                            fontWeight: 700
                          }}>
                            {selected.code}
                          </span>
                        )}
                      </div>
                    )}
                  />
                ) : (
                  <div style={{ position: 'relative' }}>
                    <Building size={16} color="#64748B" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '2.5rem' }}
                      placeholder="e.g. IT, Selling, HR"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Job Position Selection */}
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Job Position</label>
                {departmentsList.length > 0 && !isCustomDept && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomPos(!isCustomPos);
                      if (!isCustomPos) setJobPosition('');
                      else {
                        const matched = departmentsList.find((d) => d.name === department);
                        if (matched && matched.positions?.length > 0) {
                          handlePositionChange(matched.positions[0].title);
                        }
                      }
                    }}
                    style={{ background: 'none', border: 'none', color: '#A78BFA', fontSize: '0.72rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {isCustomPos ? 'Choose from list' : '+ Custom'}
                  </button>
                )}
              </div>
              <div>
                {!isCustomDept && !isCustomPos && departmentsList.length > 0 ? (
                  <CustomDropdown
                    align="right"
                    options={positionOptions}
                    value={jobPosition}
                    onChange={(val) => handlePositionChange(val)}
                    icon={<Briefcase size={16} />}
                    placeholder="Select Job Position..."
                    renderOption={(opt, isSelected) => {
                      if (opt.isCustomAction) {
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#C084FC', fontWeight: 600, padding: '0.3rem 0' }}>
                            <Plus size={15} />
                            <span>{opt.label}</span>
                          </div>
                        );
                      }

                      const levelColors = {
                        'Junior': '#10B981',
                        'Mid-Level': '#3B82F6',
                        'Senior': '#8B5CF6',
                        'Lead': '#F59E0B',
                        'Manager': '#EC4899',
                        'Executive': '#EF4444',
                        'Selected Role': '#C084FC'
                      };
                      const lvlColor = levelColors[opt.level] || '#3B82F6';

                      return (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          gap: '1rem',
                          padding: '0.35rem 0',
                          whiteSpace: 'nowrap'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, whiteSpace: 'nowrap' }}>
                            <span style={{
                              fontWeight: 600,
                              color: isSelected ? '#FFFFFF' : '#F1F5F9',
                              fontSize: '0.88rem',
                              whiteSpace: 'nowrap',
                              letterSpacing: '-0.01em'
                            }}>
                              {opt.label}
                            </span>
                            {opt.level && (
                              <span style={{
                                fontSize: '0.68rem',
                                padding: '0.12rem 0.5rem',
                                borderRadius: '5px',
                                background: `${lvlColor}18`,
                                color: lvlColor,
                                border: `1px solid ${lvlColor}35`,
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                letterSpacing: '0.01em'
                              }}>
                                {opt.level}
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0, whiteSpace: 'nowrap' }}>
                            {opt.defaultSalary && (
                              <span style={{
                                color: '#34D399',
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                background: 'rgba(16, 185, 129, 0.12)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                padding: '0.15rem 0.55rem',
                                borderRadius: '6px',
                                whiteSpace: 'nowrap',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.15rem'
                              }}>
                                ₹{Number(opt.defaultSalary).toLocaleString()}<span style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 500 }}>/mo</span>
                              </span>
                            )}
                            {isSelected && <Check size={16} color="#34D399" style={{ flexShrink: 0 }} />}
                          </div>
                        </div>
                      );
                    }}
                    renderTrigger={(selected) => (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem' }}>
                          {selected ? selected.label : jobPosition || 'Select Position...'}
                        </span>
                        {selected?.level && (
                          <span style={{
                            fontSize: '0.7rem',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            background: 'rgba(124, 58, 237, 0.2)',
                            color: '#C084FC',
                            fontWeight: 600
                          }}>
                            {selected.level}
                          </span>
                        )}
                      </div>
                    )}
                  />
                ) : (
                  <div style={{ position: 'relative' }}>
                    <Briefcase size={16} color="#64748B" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '2.5rem' }}
                      placeholder="e.g. Software Engineer, Sales Executive"
                      value={jobPosition}
                      onChange={(e) => setJobPosition(e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Compensation & Contract Details */}
          <div style={{
            background: 'rgba(124, 58, 237, 0.08)',
            border: '1px solid rgba(124, 58, 237, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <Sparkles size={16} color="#A78BFA" />
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#DDD6FE', margin: 0 }}>
                Compensation & Contract Setup
              </h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Monthly Base Salary (₹)</span>
                  <span style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 600 }}>
                    ₹{Number(salary || 0).toLocaleString()} / mo
                  </span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '0.8rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#A78BFA',
                    fontWeight: 700,
                    fontSize: '0.95rem'
                  }}>
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="e.g. 65000"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Employment Type</label>
                <CustomDropdown
                  align="right"
                  options={[
                    { value: 'Permanent', label: 'Permanent (Standard Staff)' },
                    { value: 'Contract', label: 'Contract (Fixed Term Agreement)' }
                  ]}
                  value={employeeType}
                  onChange={(val) => setEmployeeType(val)}
                />
              </div>
            </div>

            {/* Contract Dates if Contract Employee */}
            {employeeType === 'Contract' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.85rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Contract Start Date</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={16} color="#64748B" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="date"
                      className="form-input"
                      style={{ paddingLeft: '2.5rem' }}
                      value={contractStartDate}
                      onChange={(e) => setContractStartDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Contract End Date (Optional)</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={16} color="#64748B" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="date"
                      className="form-input"
                      style={{ paddingLeft: '2.5rem' }}
                      value={contractEndDate}
                      onChange={(e) => setContractEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Live Salary Estimation Breakdown */}
            {Number(salary) > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.6rem',
                marginTop: '0.85rem',
                paddingTop: '0.75rem',
                borderTop: '1px dashed rgba(167, 139, 250, 0.25)',
                fontSize: '0.78rem'
              }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ color: 'var(--text-dim)' }}>Est. Basic (50%)</div>
                  <div style={{ fontWeight: 700, color: '#DDD6FE', marginTop: '0.1rem' }}>
                    ₹{Math.round(Number(salary) * 0.5).toLocaleString()}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ color: 'var(--text-dim)' }}>Est. HRA (40%)</div>
                  <div style={{ fontWeight: 700, color: '#DDD6FE', marginTop: '0.1rem' }}>
                    ₹{Math.round(Number(salary) * 0.4).toLocaleString()}
                  </div>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div style={{ color: '#6EE7B7' }}>Est. Net Take-Home</div>
                  <div style={{ fontWeight: 700, color: '#34D399', marginTop: '0.1rem' }}>
                    ₹{Math.round(Number(salary) * 0.88).toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>
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
              {isEditMode ? <Check size={18} /> : <UserPlus size={18} />}
              <span>{isSubmitting ? (isEditMode ? 'Saving Changes...' : 'Creating...') : (isEditMode ? 'Save Employee Changes' : 'Create User & Account')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
