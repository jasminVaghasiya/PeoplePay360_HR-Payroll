import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CreateUserModal } from './CreateUserModal';
import { UserProfileDetailModal } from './UserProfileDetailModal';
import CustomDropdown from '../../components/CustomDropdown';
import { UserDisplayCell } from '../../components/UserDisplayCell';
import { StatusToggleSwitch } from '../../components/StatusToggleSwitch';
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
  MoreVertical,
  Trash2,
  AlertTriangle,
  Calendar,
  DollarSign,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight
} from 'lucide-react';

export const UserManagementPage = () => {
  const { user: currentUser, fetchUsers, toggleUserStatus, deleteUser, canCreateRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeDropdownUserId, setActiveDropdownUserId] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const handleGlobalClick = () => setActiveDropdownUserId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const loadData = async () => {
    setLoading(true);
    // Fetch user directory based on search, role, and status.
    // Employee type filtering is executed dynamically in useMemo for 100% reliable, zero-latency instant results.
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

  const handleOpenEditUser = (e, u) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setSelectedUserForEdit(u);
    setIsEditModalOpen(true);
  };

  const isSelfUser = (u) => {
    if (!u || !currentUser) return false;
    const currentId = currentUser.id || currentUser._id;
    const targetId = u.id || u._id;
    const matchId = currentId && targetId && String(currentId) === String(targetId);
    const matchEmail = u.email && currentUser.email && u.email.toLowerCase().trim() === currentUser.email.toLowerCase().trim();
    return Boolean(matchId || matchEmail);
  };

  const canEditUser = (u) => {
    if (!u) return false;
    // Do not give edit option to itself
    if (isSelfUser(u)) return false;
    // For admin not give option to change or update
    if (u.role === 'Admin') return false;
    // Role authority check
    return currentUser?.role === 'Admin' || currentUser?.role === 'HR Payroll Manager' || currentUser?.role === 'HR Manager';
  };

  const canDeactivateUser = (u) => {
    if (!u) return false;
    if (isSelfUser(u)) return false;
    if (u.role === 'Admin') return false;
    return currentUser?.role === 'Admin' || currentUser?.role === 'HR Payroll Manager' || currentUser?.role === 'HR Manager';
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

  // Client-side filtering ensures instant feedback and complete alignment with active filters
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

  // Pagination logic on filtered users
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="responsive-page-container">
      
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
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
      <div className="glass-panel toolbar-flex-wrap" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', position: 'relative', zIndex: 50 }}>
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
          <div className="data-table-container user-table-container" style={{ width: '100%' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textTransform: 'none' }}>
                  <th style={{ padding: '0.75rem 0.55rem', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <User size={14} color="#94A3B8" />
                      <span>Employee</span>
                    </div>
                  </th>
                  <th style={{ padding: '0.75rem 0.55rem', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Briefcase size={14} color="#94A3B8" />
                      <span>Role</span>
                    </div>
                  </th>
                  <th style={{ padding: '0.75rem 0.55rem', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <DollarSign size={14} color="#34D399" />
                      <span>Monthly Salary</span>
                    </div>
                  </th>
                  <th style={{ padding: '0.75rem 0.55rem', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <FileText size={14} color="#94A3B8" />
                      <span>Type / Contract</span>
                    </div>
                  </th>
                  <th style={{ padding: '0.75rem 0.55rem', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Building size={14} color="#94A3B8" />
                      <span>Dept & Position</span>
                    </div>
                  </th>
                  <th style={{ padding: '0.75rem 0.55rem', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <ShieldCheck size={14} color="#94A3B8" />
                      <span>Status</span>
                    </div>
                  </th>
                  <th style={{ padding: '0.75rem 0.55rem', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <User size={14} color="#94A3B8" />
                      <span>Created By</span>
                    </div>
                  </th>
                  <th style={{ padding: '0.75rem 0.55rem', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                      <Settings size={14} color="#94A3B8" />
                      <span>Actions</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((u) => {
                  const roleStyle = getRoleBadgeStyle(u.role);
                  const isContract = (u.employeeType || '').toLowerCase() === 'contract' &&
                    Boolean(u.contractStartDate || u.contractEndDate || u.contractDuration);
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
                      <td style={{ padding: '0.65rem 0.55rem' }}>
                        <UserDisplayCell
                          name={u.name}
                          email={u.email}
                          photo={u.photo}
                          role={u.role}
                          department={u.department}
                          employeeType={isContract ? 'Contract' : 'Permanent'}
                          size={36}
                        />
                      </td>

                      {/* 2. Role Column */}
                      <td style={{ padding: '0.65rem 0.55rem' }}>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '0.22rem 0.55rem',
                            borderRadius: '10px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em',
                            whiteSpace: 'nowrap',
                            display: 'inline-block',
                            ...roleStyle
                          }}
                        >
                          {u.role}
                        </span>
                      </td>

                      {/* 3. Salary Column */}
                      <td style={{ padding: '0.65rem 0.55rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}>
                          <span style={{
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            color: '#34D399',
                            background: 'rgba(16, 185, 129, 0.12)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px',
                            letterSpacing: '0.02em'
                          }}>
                            ₹{Number(u.salary || 50000).toLocaleString()}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>/mo</span>
                        </div>
                      </td>

                      {/* 4. Type / Contract Column */}
                      <td style={{ padding: '0.65rem 0.55rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          {isContract ? (
                            <>
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  padding: '0.12rem 0.45rem',
                                  borderRadius: '5px',
                                  display: 'inline-block',
                                  width: 'fit-content',
                                  background: 'rgba(245, 158, 11, 0.18)',
                                  border: '1px solid rgba(245, 158, 11, 0.35)',
                                  color: '#FBBF24'
                                }}
                              >
                                Contract
                              </span>
                              <span style={{ fontSize: '0.7rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}>
                                <Calendar size={11} color="#FBBF24" />
                                {u.contractStartDate && u.contractEndDate ? `${u.contractStartDate} – ${u.contractEndDate}` : (u.contractDuration || 'Fixed-Term')}
                              </span>
                            </>
                          ) : (
                            <>
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  padding: '0.12rem 0.45rem',
                                  borderRadius: '5px',
                                  display: 'inline-block',
                                  width: 'fit-content',
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  border: '1px solid rgba(16, 185, 129, 0.35)',
                                  color: '#34D399'
                                }}
                              >
                                Permanent
                              </span>
                              <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Calendar size={11} color="#64748B" />
                                Full-Time
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* 5. Department & Position Column */}
                      <td style={{ padding: '0.65rem 0.55rem' }}>
                        <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.84rem', whiteSpace: 'nowrap' }}>
                          {u.department || 'Engineering'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '0.05rem', whiteSpace: 'nowrap' }}>
                          {u.jobPosition || 'Employee'}
                        </div>
                      </td>

                      {/* 6. Status Column */}
                      <td style={{ padding: '0.65rem 0.55rem' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            whiteSpace: 'nowrap',
                            background: u.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            border: u.status === 'ACTIVE' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)',
                            color: u.status === 'ACTIVE' ? '#34D399' : '#F87171'
                          }}
                        >
                          {u.status === 'ACTIVE' ? <CheckCircle size={11} /> : <XCircle size={11} />}
                          <span>{u.status === 'ACTIVE' ? 'Active' : 'Inactive'}</span>
                        </span>
                      </td>

                      {/* 7. Created By Column */}
                      <td style={{ padding: '0.65rem 0.55rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(124, 58, 237, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={11} color="#C084FC" />
                          </div>
                          <span style={{ fontSize: '0.78rem', color: '#E2E8F0', fontWeight: 500 }}>
                            {u.createdByName || 'Admin'}
                          </span>
                        </div>
                      </td>

                      {/* 8. Actions Column with 3-Dots Options Menu */}
                      <td style={{ padding: '0.65rem 0.55rem', textAlign: 'right', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          {canEditUser(u) && (
                            <button
                              onClick={(e) => handleOpenEditUser(e, u)}
                              style={{
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                color: '#E2E8F0',
                                padding: '0.25rem 0.55rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                transition: 'all 0.15s ease'
                              }}
                              title="Edit Employee Profile"
                            >
                              <Edit size={12} />
                              <span>Edit</span>
                            </button>
                          )}

                          {(canEditUser(u) || canDeactivateUser(u)) ? (
                            <div style={{ position: 'relative' }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdownUserId(activeDropdownUserId === (u.id || u._id) ? null : (u.id || u._id));
                                }}
                                style={{
                                  background: activeDropdownUserId === (u.id || u._id) ? 'rgba(124, 58, 237, 0.3)' : 'rgba(255, 255, 255, 0.06)',
                                  border: activeDropdownUserId === (u.id || u._id) ? '1px solid #7C3AED' : '1px solid rgba(255, 255, 255, 0.14)',
                                  color: '#E2E8F0',
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                title="Actions & Options"
                              >
                                <MoreVertical size={14} />
                              </button>

                              {/* Dropdown Options Menu */}
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
                                    minWidth: '200px',
                                    zIndex: 100,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.2rem',
                                    textAlign: 'left'
                                  }}
                                >
                                  {canEditUser(u) && (
                                    <button
                                      onClick={(e) => {
                                        setActiveDropdownUserId(null);
                                        handleOpenEditUser(e, u);
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.6rem',
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: 'transparent',
                                        color: '#E2E8F0',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        width: '100%',
                                        transition: 'background 0.15s'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                      <Edit size={14} color="#A78BFA" />
                                      <span>Edit Profile</span>
                                    </button>
                                  )}

                                  {canDeactivateUser(u) && (
                                    <button
                                      onClick={(e) => {
                                        setActiveDropdownUserId(null);
                                        handleToggleStatus(e, u.id || u._id);
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: 'transparent',
                                        color: u.status === 'ACTIVE' ? '#FBBF24' : '#34D399',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        width: '100%',
                                        transition: 'background 0.15s'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        {u.status === 'ACTIVE' ? <XCircle size={14} color="#FBBF24" /> : <CheckCircle size={14} color="#34D399" />}
                                        <span>{u.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}</span>
                                      </div>
                                      <StatusToggleSwitch
                                        isActive={u.status === 'ACTIVE'}
                                        onToggle={(e) => {
                                          setActiveDropdownUserId(null);
                                          handleToggleStatus(e, u.id || u._id);
                                        }}
                                        size="sm"
                                      />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: '#64748B', fontStyle: 'italic', paddingRight: '0.35rem' }}>
                              {u.role === 'Admin' ? 'Protected' : 'Current User'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paginatedUsers.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Filter size={32} color="#64748B" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#CBD5E1' }}>No employees match the selected filters</div>
                      <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Try selecting "All Employee Types" or clearing your search term.</div>
                    </td>
                  </tr>
                )}
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
              Showing {filteredUsers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} employees
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
          {filteredUsers.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
              <Filter size={32} color="#64748B" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#CBD5E1' }}>No employees match the selected filters</div>
              <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Try selecting "All Employee Types" or clearing your search term.</div>
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isContract = (u.employeeType || '').toLowerCase() === 'contract' &&
                Boolean(u.contractStartDate || u.contractEndDate || u.contractDuration);
              return (
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
                  <div style={{ marginBottom: '1rem' }}>
                    <UserDisplayCell
                      name={u.name}
                      email={u.email}
                      photo={u.photo}
                      role={u.role}
                      department={u.department}
                      employeeType={isContract ? 'Contract' : 'Permanent'}
                      size={46}
                    />
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
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '0.6rem',
                      paddingTop: '0.5rem',
                      borderTop: '1px dashed rgba(255,255,255,0.08)'
                    }}>
                      <div>
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Salary: </span>
                        <span style={{ color: '#34D399', fontWeight: 700, fontSize: '0.88rem' }}>
                          ₹{Number(u.salary || 50000).toLocaleString()} <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 400 }}>/ mo</span>
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', position: 'relative' }}>
                        {canEditUser(u) && (
                          <button
                            onClick={(e) => handleOpenEditUser(e, u)}
                            style={{
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              color: '#E2E8F0',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '5px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                            title="Edit Employee Profile"
                          >
                            <Edit size={11} />
                            <span>Edit</span>
                          </button>
                        )}
                        {(canEditUser(u) || canDeactivateUser(u)) && (
                          <div style={{ position: 'relative' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdownUserId(activeDropdownUserId === `kanban_${u.id || u._id}` ? null : `kanban_${u.id || u._id}`);
                              }}
                              style={{
                                background: activeDropdownUserId === `kanban_${u.id || u._id}` ? 'rgba(124, 58, 237, 0.3)' : 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(255, 255, 255, 0.14)',
                                color: '#E2E8F0',
                                width: '26px',
                                height: '26px',
                                borderRadius: '5px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                              title="More Options"
                            >
                              <MoreVertical size={13} />
                            </button>
                            {activeDropdownUserId === `kanban_${u.id || u._id}` && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  position: 'absolute',
                                  right: 0,
                                  bottom: 'calc(100% + 4px)',
                                  background: '#1A162B',
                                  border: '1px solid rgba(255, 255, 255, 0.15)',
                                  borderRadius: '10px',
                                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.65)',
                                  padding: '0.35rem',
                                  minWidth: '185px',
                                  zIndex: 100,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.2rem',
                                  textAlign: 'left'
                                }}
                              >
                                {canEditUser(u) && (
                                  <button
                                    onClick={(e) => {
                                      setActiveDropdownUserId(null);
                                      handleOpenEditUser(e, u);
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      padding: '0.45rem 0.65rem',
                                      borderRadius: '6px',
                                      border: 'none',
                                      background: 'transparent',
                                      color: '#E2E8F0',
                                      fontSize: '0.78rem',
                                      cursor: 'pointer',
                                      width: '100%'
                                    }}
                                  >
                                    <Edit size={13} color="#A78BFA" />
                                    <span>Edit Profile</span>
                                  </button>
                                )}
                                {canDeactivateUser(u) && (
                                  <button
                                    onClick={(e) => {
                                      setActiveDropdownUserId(null);
                                      handleToggleStatus(e, u.id || u._id);
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '0.45rem 0.65rem',
                                      borderRadius: '6px',
                                      border: 'none',
                                      background: 'transparent',
                                      color: u.status === 'ACTIVE' ? '#FBBF24' : '#34D399',
                                      fontSize: '0.78rem',
                                      cursor: 'pointer',
                                      width: '100%'
                                    }}
                                  >
                                    <span>{u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}</span>
                                    <StatusToggleSwitch isActive={u.status === 'ACTIVE'} onToggle={(e) => { setActiveDropdownUserId(null); handleToggleStatus(e, u.id || u._id); }} size="sm" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* User Creation Modal */}
      <CreateUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUserCreated={loadData}
      />

      {/* User Edit Modal */}
      <CreateUserModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUserForEdit(null);
        }}
        onUserCreated={loadData}
        userToEdit={selectedUserForEdit}
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