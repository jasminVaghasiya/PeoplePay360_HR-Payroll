import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CreateUserModal } from './CreateUserModal';
import { UserProfileDetailModal } from './UserProfileDetailModal';
import CustomDropdown from '../../components/CustomDropdown';
import {
  UserPlus,
  Search,
  Shield,
  Filter,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  User,
  Briefcase,
  FileText,
  Building,
  ShieldCheck,
  Settings,
  Edit,
  Trash2,
  Calendar,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight
} from 'lucide-react';

export const UserManagementPage = () => {
  const { user: currentUser, fetchUsers, toggleUserStatus, canCreateRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadData = async () => {
    setLoading(true);
    const data = await fetchUsers({ search, role: roleFilter, status: statusFilter, employeeType: employeeTypeFilter });
    if (data.success) {
      setUsers(data.users);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [search, roleFilter, statusFilter, employeeTypeFilter]);

  const handleToggleStatus = async (e, userId) => {
    e.stopPropagation();
    const res = await toggleUserStatus(userId);
    if (res.success) {
      loadData();
    }
  };

  const handleOpenUserDetail = (u) => {
    setSelectedUserForDetail(u);
    setIsDetailModalOpen(true);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'Admin':
        return { background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#F87171' };
      case 'HR Payroll Manager':
        return { background: 'rgba(124, 58, 237, 0.15)', border: '1px solid rgba(168, 85, 247, 0.35)', color: '#C084FC' };
      case 'HR Payroll User':
        return { background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(129, 140, 248, 0.35)', color: '#818CF8' };
      case 'HR Manager':
        return { background: 'rgba(20, 184, 166, 0.12)', border: '1px solid rgba(45, 212, 191, 0.35)', color: '#2DD4BF' };
      default:
        return { background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)', color: '#FBBF24' };
    }
  };

  const canCreateNew = canCreateRole('Employee');

  // Pagination logic
  const totalPages = Math.ceil(users.length / itemsPerPage) || 1;
  const paginatedUsers = users.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
            Manage and view all employee details
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <button
            onClick={() => handleOpenUserDetail(currentUser)}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Eye size={16} color="#A855F7" />
            <span>My Profile & Details</span>
          </button>

          {canCreateNew && (
            <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserPlus size={18} />
              <span>Add New Employee</span>
            </button>
          )}
        </div>
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
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
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
              onChange={(val) => { setRoleFilter(val); setCurrentPage(1); }}
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
              onChange={(val) => { setEmployeeTypeFilter(val); setCurrentPage(1); }}
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
              onChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
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
                fontSize: '0.85rem',
                fontWeight: viewMode === 'list' ? 600 : 400
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
                fontSize: '0.85rem',
                fontWeight: viewMode === 'kanban' ? 600 : 400
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
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div className="data-table-container">
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textTransform: 'none' }}>
                  <th style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <User size={15} color="#94A3B8" />
                      <span>Employee</span>
                    </div>
                  </th>
                  <th style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Briefcase size={15} color="#94A3B8" />
                      <span>Role</span>
                    </div>
                  </th>
                  <th style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <FileText size={15} color="#94A3B8" />
                      <span>Type / Contract</span>
                    </div>
                  </th>
                  <th style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Building size={15} color="#94A3B8" />
                      <span>Department & Position</span>
                    </div>
                  </th>
                  <th style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <ShieldCheck size={15} color="#94A3B8" />
                      <span>Status</span>
                    </div>
                  </th>
                  <th style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <User size={15} color="#94A3B8" />
                      <span>Created By</span>
                    </div>
                  </th>
                  <th style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                      <Settings size={15} color="#94A3B8" />
                      <span>Actions</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((u) => {
                  const roleStyle = getRoleBadgeStyle(u.role);
                  return (
                    <tr
                      key={u.id || u._id}
                      onClick={() => handleOpenUserDetail(u)}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                      className="table-row-hover"
                    >
                      {/* 1. Employee Column */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          {u.photo ? (
                            <img
                              src={u.photo}
                              alt={u.name}
                              style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(124, 58, 237, 0.4)' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #7C3AED, #9333EA)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: '0.92rem',
                                boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)'
                              }}
                            >
                              {getInitials(u.name)}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{u.name}</div>
                            <div style={{ fontSize: '0.82rem', color: '#94A3B8', marginTop: '0.1rem' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Role Column */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '0.35rem 0.8rem',
                            borderRadius: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            display: 'inline-block',
                            ...roleStyle
                          }}
                        >
                          {u.role}
                        </span>
                      </td>

                      {/* 3. Type / Contract Column */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          {u.employeeType === 'Contract' ? (
                            <>
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  padding: '0.2rem 0.65rem',
                                  borderRadius: '6px',
                                  display: 'inline-block',
                                  width: 'fit-content',
                                  background: 'rgba(245, 158, 11, 0.18)',
                                  border: '1px solid rgba(245, 158, 11, 0.35)',
                                  color: '#FBBF24'
                                }}
                              >
                                Contract
                              </span>
                              <span style={{ fontSize: '0.76rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}>
                                <Calendar size={13} color="#FBBF24" />
                                {u.contractStartDate && u.contractEndDate ? `${u.contractStartDate} – ${u.contractEndDate}` : (u.contractDuration || '05 Sep 2026 – 18 Sep 2026')}
                              </span>
                            </>
                          ) : (
                            <>
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  padding: '0.2rem 0.65rem',
                                  borderRadius: '6px',
                                  display: 'inline-block',
                                  width: 'fit-content',
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  border: '1px solid rgba(16, 185, 129, 0.35)',
                                  color: '#34D399'
                                }}
                              >
                                Permanent
                              </span>
                              <span style={{ fontSize: '0.76rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <Calendar size={13} color="#64748B" />
                                —
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* 4. Department & Position Column */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem' }}>{u.department || 'Engineering'}</div>
                        <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.15rem' }}>{u.jobPosition || 'Employee'}</div>
                      </td>

                      {/* 5. Status Column */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            padding: '0.3rem 0.75rem',
                            borderRadius: '14px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            background: u.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            border: u.status === 'ACTIVE' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)',
                            color: u.status === 'ACTIVE' ? '#34D399' : '#F87171'
                          }}
                        >
                          {u.status === 'ACTIVE' ? <CheckCircle size={13} /> : <XCircle size={13} />}
                          <span>{u.status === 'ACTIVE' ? 'Active' : 'Inactive'}</span>
                        </span>
                      </td>

                      {/* 6. Created By Column */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(124, 58, 237, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={13} color="#C084FC" />
                          </div>
                          <span style={{ fontSize: '0.85rem', color: '#E2E8F0', fontWeight: 500 }}>
                            {u.createdByName || 'Admin'}
                          </span>
                        </div>
                      </td>

                      {/* 7. Actions Column */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleOpenUserDetail(u)}
                            style={{
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              color: '#E2E8F0',
                              padding: '0.35rem 0.7rem',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              transition: 'all 0.15s ease'
                            }}
                            title="Edit & View Profile Details"
                          >
                            <Edit size={13} />
                            <span>Edit</span>
                          </button>

                          {(currentUser?.role === 'Admin' || currentUser?.role === 'HR Payroll Manager') && u.email !== currentUser?.email && (
                            <button
                              onClick={(e) => handleToggleStatus(e, u.id || u._id)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.85)',
                                border: 'none',
                                color: '#fff',
                                width: '30px',
                                height: '30px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              title={u.status === 'ACTIVE' ? 'Deactivate User Account' : 'Activate User Account'}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Pagination */}
          <div
            style={{
              padding: '1rem 1.5rem',
              background: 'rgba(15, 23, 42, 0.95)',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              fontSize: '0.85rem',
              color: 'var(--text-muted)'
            }}
          >
            <div>
              Showing {users.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, users.length)} of {users.length} employees
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: currentPage === 1 ? '#475569' : '#94A3B8',
                  padding: '0.35rem 0.6rem',
                  borderRadius: '6px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                <ChevronsLeft size={14} />
              </button>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: currentPage === 1 ? '#475569' : '#94A3B8',
                  padding: '0.35rem 0.6rem',
                  borderRadius: '6px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                <ChevronLeft size={14} />
              </button>

              <span
                style={{
                  background: '#7C3AED',
                  color: '#fff',
                  fontWeight: 700,
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem'
                }}
              >
                {currentPage}
              </span>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: currentPage >= totalPages ? '#475569' : '#94A3B8',
                  padding: '0.35rem 0.6rem',
                  borderRadius: '6px',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                <ChevronRight size={14} />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: currentPage >= totalPages ? '#475569' : '#94A3B8',
                  padding: '0.35rem 0.6rem',
                  borderRadius: '6px',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                <ChevronsRight size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Kanban View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {users.map((u) => (
            <div
              key={u.id || u._id}
              onClick={() => handleOpenUserDetail(u)}
              className="glass-panel glass-panel-interactive"
              style={{ padding: '1.5rem', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.25rem 0.7rem', borderRadius: '10px', ...getRoleBadgeStyle(u.role) }}>{u.role}</span>
                <span className={`status-badge ${u.status.toLowerCase()}`}>{u.status}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                {u.photo ? (
                  <img src={u.photo} alt={u.name} style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #9333EA)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                    {getInitials(u.name)}
                  </div>
                )}
                <div>
                  <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 600 }}>{u.name}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</p>
                </div>
              </div>
              <div style={{ fontSize: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.8rem', marginTop: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Type:</span>
                  <span style={{ color: u.employeeType === 'Contract' ? '#FBBF24' : '#34D399', fontWeight: 600 }}>
                    {u.employeeType || 'Permanent'}
                  </span>
                </div>
                {u.employeeType === 'Contract' && (u.contractStartDate || u.contractDuration) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Contract Period:</span>
                    <span style={{ color: '#FBBF24', fontSize: '0.78rem', fontWeight: 600 }}>
                      {u.contractStartDate && u.contractEndDate ? `${u.contractStartDate} – ${u.contractEndDate}` : u.contractDuration}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Dept:</span>
                  <span style={{ color: '#fff', fontWeight: 500 }}>{u.department}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Position:</span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{u.jobPosition}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User Creation Modal */}
      <CreateUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUserCreated={loadData}
      />

      {/* User Detail & Profile Modal Window */}
      <UserProfileDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        user={selectedUserForDetail}
        onStatusUpdated={loadData}
      />
    </div>
  );
};