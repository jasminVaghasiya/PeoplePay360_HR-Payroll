import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CreateUserModal } from './CreateUserModal';
import { UserAvatarHoverPreview } from '../../components/UserAvatarHoverPreview';
import CustomDropdown from '../../components/CustomDropdown';
import { StatusToggleSwitch } from '../../components/StatusToggleSwitch';
import { UserPlus, Search, Shield, Filter, CheckCircle, XCircle, RefreshCw, MoreVertical, Trash2, AlertTriangle, Edit } from 'lucide-react';

export const UserManagementPage = () => {
  const { user: currentUser, fetchUsers, toggleUserStatus, deleteUser, canCreateRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [activeDropdownUserId, setActiveDropdownUserId] = useState(null);

  useEffect(() => {
    const handleGlobalClick = () => setActiveDropdownUserId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchUsers({ search, role: roleFilter, status: statusFilter });
    if (data.success && Array.isArray(data.users)) {
      setUsers(data.users);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    if (users.length === 0) {
      loadData();
    }
  }, [employeeTypeFilter]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false;
      if (statusFilter && u.status !== statusFilter) return false;
      if (employeeTypeFilter) {
        const isContractUser = (u.employeeType || '').toLowerCase() === 'contract' &&
          Boolean(u.contractStartDate || u.contractEndDate || u.contractDuration);
        const resolvedType = isContractUser ? 'contract' : 'permanent';
        if (employeeTypeFilter.toLowerCase() !== resolvedType) return false;
      }
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesName = u.name?.toLowerCase().includes(q);
        const matchesEmail = u.email?.toLowerCase().includes(q);
        const matchesDept = u.department?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesDept) return false;
      }
      return true;
    });
  }, [users, roleFilter, statusFilter, employeeTypeFilter, search]);

  const handleToggleStatus = async (userId) => {
    const res = await toggleUserStatus(userId);
    if (res.success) {
      loadData();
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'Admin': return 'admin';
      case 'HR Payroll Manager': return 'hr-payroll-manager';
      case 'HR Payroll User': return 'hr-payroll-user';
      case 'HR Manager': return 'hr-manager';
      default: return 'employee';
    }
  };

  const canCreateNew = canCreateRole('Employee');

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Top Header & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Shield color="#7C3AED" size={28} />
            User Management & Role Directory
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Hover on user photo for 1.5 seconds to preview full-screen high-res profile photo
          </p>
        </div>

        {canCreateNew && (
          <button onClick={() => setIsModalOpen(true)} className="btn-primary">
            <UserPlus size={18} />
            <span>Create New User</span>
          </button>
        )}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', position: 'relative', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
            <Search size={18} color="#64748B" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search by name, email, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '180px' }}>
            <Filter size={16} color="var(--text-muted)" />
            <CustomDropdown
              options={[
                { value: '', label: 'All Roles' },
                { value: 'Admin', label: 'Admin' },
                { value: 'HR Payroll Manager', label: 'HR Payroll Manager' },
                { value: 'HR Payroll User', label: 'HR Payroll User' },
                { value: 'HR Manager', label: 'HR Manager' },
                { value: 'Employee', label: 'Employee' }
              ]}
              value={roleFilter}
              onChange={(val) => setRoleFilter(val)}
              placeholder="All Roles"
            />
          </div>

          <div style={{ minWidth: '160px' }}>
            <CustomDropdown
              options={[
                { value: '', label: 'All Employee Types' },
                { value: 'Permanent', label: 'Permanent' },
                { value: 'Contract', label: 'Contract' }
              ]}
              value={employeeTypeFilter}
              onChange={(val) => setEmployeeTypeFilter(val)}
              placeholder="All Employee Types"
            />
          </div>

          <div style={{ minWidth: '150px' }}>
            <CustomDropdown
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' }
              ]}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              placeholder="All Statuses"
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={loadData} className="btn-secondary" style={{ padding: '0.6rem 0.9rem' }} title="Refresh Users">
            <RefreshCw size={16} />
          </button>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', padding: '0.2rem', display: 'flex' }}>
            <button
              onClick={() => setViewMode('list')}
              style={{
                background: viewMode === 'list' ? 'rgba(124, 58, 237, 0.4)' : 'transparent',
                border: 'none',
                color: '#fff',
                padding: '0.4rem 0.8rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              style={{
                background: viewMode === 'kanban' ? 'rgba(124, 58, 237, 0.4)' : 'transparent',
                border: 'none',
                color: '#fff',
                padding: '0.4rem 0.8rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              Kanban View
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading users directory...</div>
      ) : viewMode === 'list' ? (
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>User Details</th>
                  <th>Role</th>
                  <th>Type / Contract</th>
                  <th>Department & Position</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isContract = (u.employeeType || '').toLowerCase() === 'contract' &&
                    Boolean(u.contractStartDate || u.contractEndDate || u.contractDuration);
                  return (
                    <tr key={u.id || u._id}>
                      <td>
                        <UserAvatarHoverPreview
                          name={u.name}
                          role={u.role}
                          photoUrl={u.photo}
                          size={40}
                        />
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{u.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                      </td>
                      <td>
                        <span className={`role-badge ${getRoleBadgeClass(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            display: 'inline-block',
                            width: 'fit-content',
                            background: isContract ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: isContract ? '#FBBF24' : '#34D399'
                          }}>
                            {isContract ? 'Contract' : 'Permanent'}
                          </span>
                          {isContract && (u.contractStartDate || u.contractDuration) && (
                            <span style={{ fontSize: '0.7rem', color: '#FBBF24', whiteSpace: 'nowrap' }}>
                              📅 {u.contractStartDate && u.contractEndDate ? `${u.contractStartDate} to ${u.contractEndDate}` : (u.contractDuration || 'Fixed-Term')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{u.department}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{u.jobPosition}</div>
                      </td>
                      {/* Status Column */}
                      <td>
                        <span className={`status-badge ${u.status.toLowerCase()}`}>
                          {u.status === 'ACTIVE' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                          {u.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {u.createdByName || 'System'}
                      </td>
                      <td style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                        {(currentUser?.role === 'Admin' || currentUser?.role === 'HR Payroll Manager') && u.email !== currentUser?.email && u.role !== 'Admin' ? (
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdownUserId(activeDropdownUserId === (u.id || u._id) ? null : (u.id || u._id));
                              }}
                              style={{
                                background: activeDropdownUserId === (u.id || u._id) ? 'rgba(124, 58, 237, 0.3)' : 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(255, 255, 255, 0.14)',
                                color: '#E2E8F0',
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                              title="More Options"
                            >
                              <MoreVertical size={14} />
                            </button>

                            {activeDropdownUserId === (u.id || u._id) && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  position: 'absolute',
                                  right: 0,
                                  top: 'calc(100% + 4px)',
                                  background: '#1A162B',
                                  border: '1px solid rgba(255, 255, 255, 0.15)',
                                  borderRadius: '10px',
                                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.65)',
                                  padding: '0.35rem',
                                  minWidth: '190px',
                                  zIndex: 100,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.2rem',
                                  textAlign: 'left'
                                }}
                              >
                                <button
                                  onClick={() => {
                                    setActiveDropdownUserId(null);
                                    handleToggleStatus(u.id || u._id);
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.45rem 0.7rem',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: 'transparent',
                                    color: u.status === 'ACTIVE' ? '#FBBF24' : '#34D399',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    width: '100%'
                                  }}
                                >
                                  <span>{u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}</span>
                                  <StatusToggleSwitch isActive={u.status === 'ACTIVE'} onToggle={() => { setActiveDropdownUserId(null); handleToggleStatus(u.id || u._id); }} size="sm" />
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                            {u.role === 'Admin' ? 'Protected' : 'Current User'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Filter size={32} color="#64748B" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#CBD5E1' }}>No employees match the selected filter</div>
                      <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Try selecting "All Employee Types" or clearing your search term.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban View */
        filteredUsers.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Filter size={32} color="#64748B" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#CBD5E1' }}>No employees match the selected filter</div>
            <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Try selecting "All Employee Types" or clearing your search term.</div>
          </div>
        ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {filteredUsers.map((u) => {
            const isContract = (u.employeeType || '').toLowerCase() === 'contract' &&
              Boolean(u.contractStartDate || u.contractEndDate || u.contractDuration);
            return (
            <div key={u.id || u._id} className="glass-panel glass-panel-interactive" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span className={`role-badge ${getRoleBadgeClass(u.role)}`}>{u.role}</span>
                <span className={`status-badge ${u.status.toLowerCase()}`}>{u.status}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                <UserAvatarHoverPreview
                  name={u.name}
                  role={u.role}
                  photoUrl={u.photo}
                  size={46}
                />
                <div>
                  <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 600 }}>{u.name}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</p>
                </div>
              </div>
              <div style={{ fontSize: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.8rem', marginTop: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Type:</span>
                  <span style={{ color: isContract ? '#FBBF24' : '#34D399', fontWeight: 600 }}>
                    {isContract ? 'Contract' : 'Permanent'}
                  </span>
                </div>
                {isContract && (u.contractStartDate || u.contractDuration) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Contract Period:</span>
                    <span style={{ color: '#FBBF24', fontSize: '0.78rem', fontWeight: 600 }}>
                      {u.contractStartDate && u.contractEndDate ? `${u.contractStartDate} to ${u.contractEndDate}` : u.contractDuration}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Dept:</span>
                  <span style={{ color: '#fff', fontWeight: 500 }}>{u.department}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Position:</span>
                  <span style={{ color: 'var(--text-muted)' }}>{u.jobPosition}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Modal Trigger */}
      <CreateUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUserCreated={loadData}
      />
    </div>
  );
};
