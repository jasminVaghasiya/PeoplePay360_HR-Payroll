import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Building,
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  Users,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  CheckCircle2,
  Search,
  Sparkles,
  Layers,
  DollarSign,
  TrendingUp,
  Terminal,
  X,
  Sliders
} from 'lucide-react';

const FALLBACK_DEPARTMENTS = [
  {
    _id: 'dept_it',
    name: 'IT',
    code: 'IT',
    description: 'Information Technology, Cloud Infrastructure & Software Engineering',
    color: '#3B82F6',
    headOfDepartment: 'CTO / Engineering Lead',
    positions: [
      { _id: 'pos_it_1', title: 'Software Engineer', code: 'SWE', level: 'Mid-Level', defaultSalary: 70000, description: 'Core software design and implementation' },
      { _id: 'pos_it_2', title: 'Full Stack Developer', code: 'FSD', level: 'Senior', defaultSalary: 90000, description: 'Full stack development' },
      { _id: 'pos_it_3', title: 'DevOps Engineer', code: 'DEVOPS', level: 'Senior', defaultSalary: 95000, description: 'Cloud infrastructure and CI/CD' },
      { _id: 'pos_it_4', title: 'QA Specialist', code: 'QA', level: 'Mid-Level', defaultSalary: 55000, description: 'Automated testing and QA' }
    ]
  },
  {
    _id: 'dept_selling',
    name: 'Selling',
    code: 'SALES',
    description: 'Sales, Customer Acquisition, Enterprise Partnerships & Revenue Growth',
    color: '#10B981',
    headOfDepartment: 'VP of Sales',
    positions: [
      { _id: 'pos_sale_1', title: 'Sales Executive', code: 'SE', level: 'Mid-Level', defaultSalary: 45000, description: 'Outbound sales and product demos' },
      { _id: 'pos_sale_2', title: 'Account Manager', code: 'AM', level: 'Senior', defaultSalary: 65000, description: 'Client success and account management' },
      { _id: 'pos_sale_3', title: 'Business Development Lead', code: 'BDL', level: 'Lead', defaultSalary: 85000, description: 'Strategic partnerships and enterprise deals' }
    ]
  },
  {
    _id: 'dept_hr',
    name: 'HR',
    code: 'HR',
    description: 'Human Resources, Talent Acquisition, People Operations & Payroll Administration',
    color: '#8B5CF6',
    headOfDepartment: 'Chief People Officer',
    positions: [
      { _id: 'pos_hr_1', title: 'HR Manager', code: 'HRM', level: 'Manager', defaultSalary: 85000, description: 'People operations and organizational leadership' },
      { _id: 'pos_hr_2', title: 'HR Payroll Manager', code: 'HRPM', level: 'Manager', defaultSalary: 95000, description: 'Direct payroll processing and compensation' },
      { _id: 'pos_hr_3', title: 'HR Payroll User', code: 'HRPU', level: 'Mid-Level', defaultSalary: 60000, description: 'Timesheets, wages and payroll support' },
      { _id: 'pos_hr_4', title: 'HR Specialist', code: 'HRS', level: 'Mid-Level', defaultSalary: 50000, description: 'Onboarding and culture' },
      { _id: 'pos_hr_5', title: 'Talent Acquisition Partner', code: 'TAP', level: 'Mid-Level', defaultSalary: 55000, description: 'Recruitment and hiring' },
      { _id: 'pos_hr_6', title: 'Payroll Officer', code: 'PO', level: 'Senior', defaultSalary: 65000, description: 'Statutory compliance and payruns' }
    ]
  }
];

export const SettingsView = () => {
  const { ability, user } = useAuth();
  const [departments, setDepartments] = useState(() => {
    try {
      const cached = localStorage.getItem('peoplepay360_departments');
      return cached ? JSON.parse(cached) : FALLBACK_DEPARTMENTS;
    } catch (e) {
      return FALLBACK_DEPARTMENTS;
    }
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDepts, setExpandedDepts] = useState({
    dept_it: true,
    dept_selling: true,
    dept_hr: true
  });
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Modal states
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptFormData, setDeptFormData] = useState({
    name: '',
    code: '',
    description: '',
    headOfDepartment: '',
    color: '#3B82F6'
  });

  const [posModalOpen, setPosModalOpen] = useState(false);
  const [targetDeptId, setTargetDeptId] = useState(null);
  const [editingPos, setEditingPos] = useState(null);
  const [posFormData, setPosFormData] = useState({
    title: '',
    code: '',
    level: 'Mid-Level',
    defaultSalary: 50000,
    description: ''
  });

  const canManage = ability ? ability.can('manage', 'setting') || ability.can('manage', 'all') || ability.can('read', 'setting') : true;

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings/departments');
      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setDepartments(res.data.data);
        localStorage.setItem('peoplepay360_departments', JSON.stringify(res.data.data));
        const initExpanded = {};
        res.data.data.forEach((d) => {
          initExpanded[d._id] = true;
        });
        setExpandedDepts(initExpanded);
        return;
      }
    } catch (err) {
      console.warn('Backend API not responding yet, using local store:', err.message);
    } finally {
      setLoading(false);
    }

    // Fallback to local storage or defaults
    const cached = localStorage.getItem('peoplepay360_departments');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.length > 0) {
          setDepartments(parsed);
          return;
        }
      } catch (e) {}
    }
    setDepartments(FALLBACK_DEPARTMENTS);
    localStorage.setItem('peoplepay360_departments', JSON.stringify(FALLBACK_DEPARTMENTS));
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: '', message: '' });
    }, 4000);
  };

  const toggleExpand = (deptId) => {
    setExpandedDepts((prev) => ({ ...prev, [deptId]: !prev[deptId] }));
  };

  // Department CRUD Handlers
  const handleOpenDeptModal = (dept = null) => {
    if (dept) {
      setEditingDept(dept);
      setDeptFormData({
        name: dept.name,
        code: dept.code,
        description: dept.description || '',
        headOfDepartment: dept.headOfDepartment || '',
        color: dept.color || '#3B82F6'
      });
    } else {
      setEditingDept(null);
      setDeptFormData({
        name: '',
        code: '',
        description: '',
        headOfDepartment: '',
        color: '#7C3AED'
      });
    }
    setDeptModalOpen(true);
  };

  const handleSaveDepartment = async (e) => {
    e.preventDefault();
    if (!deptFormData.name.trim()) {
      showFeedback('error', 'Department name is required');
      return;
    }

    try {
      if (editingDept) {
        const res = await api.put(`/settings/departments/${editingDept._id}`, deptFormData);
        if (res.data.success) {
          showFeedback('success', `Department '${deptFormData.name}' updated successfully`);
          setDeptModalOpen(false);
          fetchDepartments();
          return;
        }
      } else {
        const res = await api.post('/settings/departments', deptFormData);
        if (res.data.success) {
          showFeedback('success', `Department '${deptFormData.name}' created successfully`);
          setDeptModalOpen(false);
          fetchDepartments();
          return;
        }
      }
    } catch (err) {
      console.warn('API sync warning, applying change locally:', err.message);
    }

    // Local resilient update
    if (editingDept) {
      const updated = departments.map((d) =>
        d._id === editingDept._id ? { ...d, ...deptFormData } : d
      );
      setDepartments(updated);
      localStorage.setItem('peoplepay360_departments', JSON.stringify(updated));
      showFeedback('success', `Department '${deptFormData.name}' updated successfully`);
    } else {
      const newDept = {
        _id: 'dept_' + Date.now(),
        ...deptFormData,
        code: (deptFormData.code || deptFormData.name).toUpperCase().replace(/\s+/g, '_'),
        positions: []
      };
      const updated = [...departments, newDept];
      setDepartments(updated);
      setExpandedDepts((prev) => ({ ...prev, [newDept._id]: true }));
      localStorage.setItem('peoplepay360_departments', JSON.stringify(updated));
      showFeedback('success', `Department '${deptFormData.name}' created successfully`);
    }
    setDeptModalOpen(false);
  };

  const handleDeleteDepartment = async (dept) => {
    if (!window.confirm(`Are you sure you want to delete the '${dept.name}' department and its positions?`)) {
      return;
    }

    try {
      const res = await api.delete(`/settings/departments/${dept._id}`);
      if (res.data.success) {
        showFeedback('success', `Department '${dept.name}' deleted successfully`);
        fetchDepartments();
        return;
      }
    } catch (err) {
      console.warn('API delete warning, removing locally:', err.message);
    }

    const updated = departments.filter((d) => d._id !== dept._id);
    setDepartments(updated);
    localStorage.setItem('peoplepay360_departments', JSON.stringify(updated));
    showFeedback('success', `Department '${dept.name}' deleted successfully`);
  };

  // Position CRUD Handlers
  const handleOpenPosModal = (deptId, pos = null) => {
    setTargetDeptId(deptId);
    if (pos) {
      setEditingPos(pos);
      setPosFormData({
        title: pos.title,
        code: pos.code || '',
        level: pos.level || 'Mid-Level',
        defaultSalary: pos.defaultSalary || 50000,
        description: pos.description || ''
      });
    } else {
      setEditingPos(null);
      setPosFormData({
        title: '',
        code: '',
        level: 'Mid-Level',
        defaultSalary: 50000,
        description: ''
      });
    }
    setPosModalOpen(true);
  };

  const handleSavePosition = async (e) => {
    e.preventDefault();
    if (!posFormData.title.trim()) {
      showFeedback('error', 'Position title is required');
      return;
    }

    try {
      if (editingPos) {
        const res = await api.put(`/settings/departments/${targetDeptId}/positions/${editingPos._id}`, posFormData);
        if (res.data.success) {
          showFeedback('success', `Position '${posFormData.title}' updated successfully`);
          setPosModalOpen(false);
          fetchDepartments();
          return;
        }
      } else {
        const res = await api.post(`/settings/departments/${targetDeptId}/positions`, posFormData);
        if (res.data.success) {
          showFeedback('success', `Position '${posFormData.title}' added successfully`);
          setPosModalOpen(false);
          fetchDepartments();
          return;
        }
      }
    } catch (err) {
      console.warn('API position warning, applying locally:', err.message);
    }

    // Local resilient update
    const updated = departments.map((d) => {
      if (d._id === targetDeptId) {
        const curPositions = d.positions || [];
        if (editingPos) {
          return {
            ...d,
            positions: curPositions.map((p) =>
              p._id === editingPos._id ? { ...p, ...posFormData } : p
            )
          };
        } else {
          const newPos = {
            _id: 'pos_' + Date.now(),
            ...posFormData
          };
          return {
            ...d,
            positions: [...curPositions, newPos]
          };
        }
      }
      return d;
    });

    setDepartments(updated);
    localStorage.setItem('peoplepay360_departments', JSON.stringify(updated));
    showFeedback('success', `Position '${posFormData.title}' saved successfully`);
    setPosModalOpen(false);
  };

  const handleDeletePosition = async (deptId, pos) => {
    if (!window.confirm(`Are you sure you want to remove '${pos.title}' from this department?`)) {
      return;
    }

    try {
      const res = await api.delete(`/settings/departments/${deptId}/positions/${pos._id}`);
      if (res.data.success) {
        showFeedback('success', `Position '${pos.title}' removed successfully`);
        fetchDepartments();
        return;
      }
    } catch (err) {
      console.warn('API delete position warning, removing locally:', err.message);
    }

    const updated = departments.map((d) => {
      if (d._id === deptId) {
        return {
          ...d,
          positions: (d.positions || []).filter((p) => p._id !== pos._id)
        };
      }
      return d;
    });

    setDepartments(updated);
    localStorage.setItem('peoplepay360_departments', JSON.stringify(updated));
    showFeedback('success', `Position '${pos.title}' removed successfully`);
  };

  // Filter departments & positions
  const filteredDepartments = departments.filter((dept) => {
    const q = searchQuery.toLowerCase();
    const matchesDept = dept.name.toLowerCase().includes(q) || dept.code.toLowerCase().includes(q);
    const matchesPos = dept.positions?.some((p) => p.title.toLowerCase().includes(q) || p.level?.toLowerCase().includes(q));
    return matchesDept || matchesPos;
  });

  const totalPositions = departments.reduce((acc, d) => acc + (d.positions?.length || 0), 0);

  const PRESET_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#6366F1'];

  return (
    <div className="module-container fade-in responsive-page-container">
      {/* Top Banner & Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: '1.75rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        paddingBottom: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #714b67, #7C3AED)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)'
          }}>
            <Sliders size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Organization Settings
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
              Manage corporate hierarchy, departments (IT, Selling, HR), and nested job positions
            </p>
          </div>
        </div>

        {canManage && (
          <button
            onClick={() => handleOpenDeptModal()}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.35)'
            }}
          >
            <Plus size={18} />
            <span>Add Department</span>
          </button>
        )}
      </div>

      {/* Live Feedback Toast */}
      {feedback.message && (
        <div style={{
          background: feedback.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          border: `1px solid ${feedback.type === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
          color: feedback.type === 'error' ? '#FCA5A5' : '#6EE7B7',
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem'
        }}>
          {feedback.type === 'error' ? <ShieldAlert size={18} /> : <CheckCircle2 size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '1.75rem'
      }}>
        <div className="stat-card" style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '1.1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(59, 130, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Building size={20} color="#3B82F6" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Departments
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>
              {departments.length} Active
            </div>
          </div>
        </div>

        <div className="stat-card" style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '1.1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(139, 92, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Briefcase size={20} color="#8B5CF6" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Job Positions
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>
              {totalPositions} Configured
            </div>
          </div>
        </div>

        <div className="stat-card" style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '1.1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={20} color="#10B981" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Dynamic Sync
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#34D399' }}>
              Live in User Creation
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: '1.25rem'
      }}>
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search size={16} color="#64748B" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem', width: '100%' }}
            placeholder="Search departments or positions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Showing <strong>{filteredDepartments.length}</strong> of {departments.length} departments
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem', width: '36px', height: '36px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p>Loading organization hierarchy...</p>
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px dashed var(--border-color)',
          borderRadius: '12px',
          padding: '3rem 1.5rem',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <Building size={40} color="#64748B" style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem' }}>No departments found</h3>
          <p style={{ fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto 1.25rem' }}>
            {searchQuery ? 'No departments or positions match your search term.' : 'Get started by creating your first corporate department.'}
          </p>
          {canManage && (
            <button onClick={() => handleOpenDeptModal()} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
              <Plus size={16} style={{ marginRight: '0.4rem' }} />
              Add Department
            </button>
          )}
        </div>
      ) : (
        /* Department Cards Accordion */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredDepartments.map((dept) => {
            const isExpanded = expandedDepts[dept._id] !== false;
            const posList = dept.positions || [];
            const deptColor = dept.color || '#3B82F6';

            return (
              <div
                key={dept._id}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                  transition: 'border-color 0.2s ease'
                }}
              >
                {/* Department Header */}
                <div
                  style={{
                    padding: '1rem 1.25rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => toggleExpand(dept._id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: `${deptColor}20`,
                      border: `1px solid ${deptColor}40`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Building size={20} color={deptColor} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                          {dept.name}
                        </h3>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '4px',
                          background: `${deptColor}25`,
                          color: deptColor,
                          border: `1px solid ${deptColor}50`,
                          letterSpacing: '0.5px'
                        }}>
                          {dept.code}
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          background: 'rgba(255,255,255,0.06)',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '10px'
                        }}>
                          {posList.length} {posList.length === 1 ? 'position' : 'positions'}
                        </span>
                      </div>

                      {dept.description && (
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                          {dept.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                    {canManage && (
                      <>
                        <button
                          onClick={() => handleOpenPosModal(dept._id)}
                          className="btn btn-secondary"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.78rem',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '6px',
                            background: 'rgba(124, 58, 237, 0.15)',
                            borderColor: 'rgba(124, 58, 237, 0.4)',
                            color: '#C084FC'
                          }}
                          title="Add position to this department"
                        >
                          <Plus size={14} />
                          <span>Add Position</span>
                        </button>

                        <button
                          onClick={() => handleOpenDeptModal(dept)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.55rem', borderRadius: '6px', color: 'var(--text-muted)' }}
                          title="Edit department"
                        >
                          <Edit2 size={15} />
                        </button>

                        <button
                          onClick={() => handleDeleteDepartment(dept)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.55rem', borderRadius: '6px', color: '#F87171' }}
                          title="Delete department"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}

                    <div style={{ color: 'var(--text-muted)', marginLeft: '0.25rem', cursor: 'pointer' }} onClick={() => toggleExpand(dept._id)}>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>

                {/* Nested Positions Container */}
                {isExpanded && (
                  <div style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.1)' }}>
                    {posList.length === 0 ? (
                      <div style={{
                        padding: '1.5rem',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '8px',
                        border: '1px dashed rgba(255,255,255,0.08)'
                      }}>
                        <Briefcase size={28} color="#64748B" style={{ margin: '0 auto 0.5rem', opacity: 0.6 }} />
                        <p style={{ fontSize: '0.85rem', margin: '0 0 0.75rem' }}>
                          No job positions configured for <strong>{dept.name}</strong> yet.
                        </p>
                        {canManage && (
                          <button
                            onClick={() => handleOpenPosModal(dept._id)}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                          >
                            <Plus size={14} style={{ marginRight: '0.3rem' }} />
                            Add First Position
                          </button>
                        )}
                      </div>
                    ) : (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '0.85rem'
                      }}>
                        {posList.map((pos) => {
                          const levelColors = {
                            'Junior': '#10B981',
                            'Mid-Level': '#3B82F6',
                            'Senior': '#8B5CF6',
                            'Lead': '#F59E0B',
                            'Manager': '#EC4899',
                            'Executive': '#EF4444'
                          };
                          const lvlColor = levelColors[pos.level] || '#3B82F6';

                          return (
                            <div
                              key={pos._id}
                              style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: '8px',
                                padding: '0.9rem 1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Briefcase size={16} color={deptColor} style={{ flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#fff' }}>
                                      {pos.title}
                                    </span>
                                  </div>

                                  {canManage && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                      <button
                                        onClick={() => handleOpenPosModal(dept._id, pos)}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                                        title="Edit position"
                                      >
                                        <Edit2 size={13} />
                                      </button>
                                      <button
                                        onClick={() => handleDeletePosition(dept._id, pos)}
                                        style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', padding: '2px' }}
                                        title="Delete position"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {pos.description && (
                                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.65rem', lineHeight: 1.4 }}>
                                    {pos.description}
                                  </p>
                                )}
                              </div>

                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingTop: '0.55rem',
                                borderTop: '1px solid rgba(255,255,255,0.05)',
                                fontSize: '0.75rem'
                              }}>
                                <span style={{
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '4px',
                                  background: `${lvlColor}20`,
                                  color: lvlColor,
                                  fontWeight: 600
                                }}>
                                  {pos.level || 'Mid-Level'}
                                </span>

                                <span style={{ color: '#34D399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                  ₹{Number(pos.defaultSalary || 50000).toLocaleString()} <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>/mo</span>
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Department Modal */}
      {deptModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content fade-in" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'linear-gradient(135deg, #714b67, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building size={18} color="#fff" />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  {editingDept ? 'Edit Department' : 'Create Department'}
                </h3>
              </div>
              <button onClick={() => setDeptModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveDepartment}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Department Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. IT, Selling, HR, Finance"
                  value={deptFormData.name}
                  onChange={(e) => setDeptFormData({ ...deptFormData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Department Code (Short Identifier)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. IT, SALES, HR"
                  value={deptFormData.code}
                  onChange={(e) => setDeptFormData({ ...deptFormData, code: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Head of Department / Lead</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. VP of Sales, Head of Engineering"
                  value={deptFormData.headOfDepartment}
                  onChange={(e) => setDeptFormData({ ...deptFormData, headOfDepartment: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Responsibilities and purpose of this department"
                  value={deptFormData.description}
                  onChange={(e) => setDeptFormData({ ...deptFormData, description: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Badge Accent Color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setDeptFormData({ ...deptFormData, color: c })}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: c,
                        border: deptFormData.color === c ? '3px solid #fff' : '2px solid transparent',
                        cursor: 'pointer',
                        transform: deptFormData.color === c ? 'scale(1.15)' : 'none',
                        transition: 'transform 0.15s ease'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setDeptModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem' }}>
                  {editingDept ? 'Update Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Position Modal */}
      {posModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content fade-in" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'linear-gradient(135deg, #714b67, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Briefcase size={18} color="#fff" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    {editingPos ? 'Edit Position' : 'Add Position'}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#C084FC' }}>
                    Inside {departments.find((d) => d._id === targetDeptId)?.name || 'Department'}
                  </span>
                </div>
              </div>
              <button onClick={() => setPosModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePosition}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Position Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Full Stack Developer, Sales Exec"
                  value={posFormData.title}
                  onChange={(e) => setPosFormData({ ...posFormData, title: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Position Code</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. FSD, SE"
                    value={posFormData.code}
                    onChange={(e) => setPosFormData({ ...posFormData, code: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Seniority Level</label>
                  <select
                    className="form-input"
                    value={posFormData.level}
                    onChange={(e) => setPosFormData({ ...posFormData, level: e.target.value })}
                  >
                    <option value="Junior">Junior</option>
                    <option value="Mid-Level">Mid-Level</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead</option>
                    <option value="Manager">Manager</option>
                    <option value="Executive">Executive</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Default Monthly Base Salary (₹)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600 }}>₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    className="form-input"
                    style={{ paddingLeft: '2.2rem' }}
                    value={posFormData.defaultSalary}
                    onChange={(e) => setPosFormData({ ...posFormData, defaultSalary: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Description / Core Duties</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Key responsibilities of this position..."
                  value={posFormData.description}
                  onChange={(e) => setPosFormData({ ...posFormData, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setPosModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem' }}>
                  {editingPos ? 'Update Position' : 'Add Position'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
