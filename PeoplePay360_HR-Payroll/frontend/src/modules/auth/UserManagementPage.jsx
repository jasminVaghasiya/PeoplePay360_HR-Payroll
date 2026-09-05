import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CreateUserModal } from './CreateUserModal';
import { UserAvatarHoverPreview } from '../../components/UserAvatarHoverPreview';
import { UserPlus, Search, Shield, Filter, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export const UserManagementPage = () => {
  const { user: currentUser, fetchUsers, toggleUserStatus, canCreateRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list');

  const loadData = async () => {
    setLoading(true);
    const data = await fetchUsers({ search, role: roleFilter, status: statusFilter });
    if (data.users) {
      setUsers(data.users);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [search, roleFilter, statusFilter]);

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
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="var(--text-muted)" />
            <select className="form-select" style={{ width: '180px' }} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="HR Payroll Manager">HR Payroll Manager</option>
              <option value="HR Payroll User">HR Payroll User</option>
              <option value="HR Manager">HR Manager</option>
              <option value="Employee">Employee</option>
            </select>
          </div>

          <select className="form-select" style={{ width: '150px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
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
                  <th>Department & Position</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
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
                      <div style={{ fontWeight: 500 }}>{u.department}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{u.jobPosition}</div>
                    </td>
                    <td>
                      <span className={`status-badge ${u.status.toLowerCase()}`}>
                        {u.status === 'ACTIVE' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {u.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {u.createdByName || 'System'}
                    </td>
                    <td>
                      {(currentUser?.role === 'Admin' || currentUser?.role === 'HR Payroll Manager') && u.email !== currentUser?.email ? (
                        <button
                          onClick={() => handleToggleStatus(u.id || u._id)}
                          className={u.status === 'ACTIVE' ? 'btn-danger-outline' : 'btn-secondary'}
                          style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }}
                        >
                          {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Current Session</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {users.map((u) => (
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
                  <span style={{ color: 'var(--text-dim)' }}>Dept:</span>
                  <span style={{ color: '#fff', fontWeight: 500 }}>{u.department}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Position:</span>
                  <span style={{ color: 'var(--text-muted)' }}>{u.jobPosition}</span>
                </div>
              </div>
            </div>
          ))}
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
