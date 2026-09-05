import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { UserAvatarHoverPreview } from '../../components/UserAvatarHoverPreview';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Building, 
  Briefcase, 
  Calendar, 
  DollarSign, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Download,
  Edit2,
  Trash2,
  ChevronRight,
  ShieldCheck,
  Info,
  MoreVertical
} from 'lucide-react';

export const EmployeeContractDetailsModal = ({ isOpen, onClose, contractData, onRenewPlan, onEditContract }) => {
  const { user } = useAuth();
  const isHRAdmin = user && ['Admin', 'HR Payroll Manager', 'HR Manager', 'HR Payroll User'].includes(user.role);

  const [employeeContracts, setEmployeeContracts] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (!contractData) return;

    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const res = await api.get('/contracts');
        if (res.data && res.data.contracts) {
          const userContracts = res.data.contracts.filter(
            (c) =>
              (contractData.employeeEmail && c.employeeEmail && c.employeeEmail.toLowerCase().trim() === contractData.employeeEmail.toLowerCase().trim()) ||
              (contractData.employeeName && c.employeeName && c.employeeName.toLowerCase().trim() === contractData.employeeName.toLowerCase().trim()) ||
              (contractData.employeeId && String(c.employeeId) === String(contractData.employeeId)) ||
              (c.contractRef && c.contractRef === contractData.contractRef)
          );
          setEmployeeContracts(userContracts.length > 0 ? userContracts : [contractData]);
        } else {
          setEmployeeContracts([contractData]);
        }
      } catch (err) {
        console.error('[Fetch Contract History Error]', err);
        setEmployeeContracts([contractData]);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [contractData]);

  if (!isOpen || !contractData) return null;

  // Format date helper: "2026-01-01" -> "Jan 01, 2026"
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Indefinite';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getInitials = (name) => {
    if (!name) return 'EMP';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RUNNING':
        return (
          <span style={{
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#34D399',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            padding: '0.35rem 0.85rem',
            borderRadius: '20px',
            fontSize: '0.82rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            boxShadow: '0 0 12px rgba(16, 185, 129, 0.2)'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34D399', boxShadow: '0 0 8px #34D399' }} />
            Running (Active)
          </span>
        );
      case 'DRAFT':
        return (
          <span style={{
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#FBBF24',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            padding: '0.35rem 0.85rem',
            borderRadius: '20px',
            fontSize: '0.82rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FBBF24' }} />
            Draft (Pending Review)
          </span>
        );
      case 'EXPIRED':
        return (
          <span style={{
            background: 'rgba(148, 163, 184, 0.15)',
            color: '#94A3B8',
            border: '1px solid rgba(148, 163, 184, 0.3)',
            padding: '0.35rem 0.85rem',
            borderRadius: '20px',
            fontSize: '0.82rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94A3B8' }} />
            Expired Record
          </span>
        );
      default:
        return (
          <span style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.82rem' }}>
            {status}
          </span>
        );
    }
  };

  const handleDownload = () => {
    alert(`Downloading contract summary for '${contractData.contractRef}' (${contractData.employeeName})...`);
  };

  const totalRecords = employeeContracts.length;
  const renewalCount = Math.max(0, totalRecords - 1);

  // Chronological order map (oldest contract = index 0 -> Initial Contract)
  const chronologicalContracts = [...employeeContracts].sort((a, b) => {
    const dateA = new Date(a.startDate || a.createdAt || 0).getTime();
    const dateB = new Date(b.startDate || b.createdAt || 0).getTime();
    if (dateA !== dateB) return dateA - dateB;
    return (a.contractRef || '').localeCompare(b.contractRef || '');
  });

  const getChronoIndex = (c) => {
    const id = c.id || c._id;
    const foundIdx = chronologicalContracts.findIndex((item) => (item.id || item._id) === id);
    return foundIdx >= 0 ? foundIdx : 0;
  };

  const getRenewalWordLabel = (chronoIndex) => {
    if (chronoIndex === 0) return 'Initial Contract';
    const words = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];
    const ordinals = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
    if (chronoIndex >= 1 && chronoIndex <= words.length) {
      return `${ordinals[chronoIndex - 1]} Renewal (${words[chronoIndex - 1]})`;
    }
    return `${chronoIndex}th Renewal`;
  };

  return (
    <div className="fade-in" style={{ padding: '0.5rem 0', maxWidth: '1350px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* 1. TOP BREADCRUMB & PAGE HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#94A3B8', marginBottom: '0.4rem' }}>
            <span style={{ cursor: 'pointer' }} onClick={onClose}>Contracts</span>
            <ChevronRight size={14} color="#64748B" />
            <span>Contract Details</span>
            <ChevronRight size={14} color="#64748B" />
            <span style={{ color: '#10B981', fontWeight: 600 }}>{contractData.contractRef}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={onClose}
              className="btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.9rem',
                fontSize: '0.85rem',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px'
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Contracts</span>
            </button>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
              Contract Details
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
          <button
            onClick={handleDownload}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem', fontSize: '0.88rem' }}
            title="Export contract summary"
          >
            <Download size={16} />
            <span>Export Summary</span>
          </button>

          {isHRAdmin ? (
            <>
              {onEditContract && (
                <button
                  onClick={() => onEditContract(contractData)}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem', fontSize: '0.88rem' }}
                >
                  <Edit2 size={16} />
                  <span>Edit Contract</span>
                </button>
              )}

              {onRenewPlan && (
                <button
                  onClick={() => onRenewPlan(contractData)}
                  className="btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    padding: '0.65rem 1.4rem',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <RefreshCw size={17} />
                  <span>Renew Contract</span>
                </button>
              )}
            </>
          ) : (
            <span style={{
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#34D399',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}>
              <ShieldCheck size={16} color="#34D399" />
              <span>Read-Only Contract View</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. EMPLOYEE + CONTRACT HEADER CARD */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '1.75rem 2rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Avatar Circle */}
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: '1.4rem',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
          }}>
            {getInitials(contractData.employeeName)}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                {contractData.employeeName}
              </h2>
              <span style={{
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#FBBF24',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.02em'
              }}>
                Contract Employee
              </span>

              {/* Renewal Count Pill Badge */}
              <span style={{
                background: renewalCount > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                color: renewalCount > 0 ? '#34D399' : '#94A3B8',
                border: renewalCount > 0 ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(148, 163, 184, 0.3)',
                padding: '0.2rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: renewalCount > 0 ? '0 0 10px rgba(16, 185, 129, 0.15)' : 'none'
              }}>
                <RefreshCw size={12} />
                {renewalCount > 0 ? `Renewed ${renewalCount} ${renewalCount === 1 ? 'Time' : 'Times'}` : 'Initial Contract (0 Renewals)'}
              </span>
            </div>

            <div style={{ fontSize: '0.88rem', color: '#94A3B8', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={15} color="#64748B" />
              <span>{contractData.employeeEmail || 'No email specified'}</span>
            </div>
          </div>
        </div>

        {/* Right side Ref & Status */}
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              CONTRACT REF
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#34D399', letterSpacing: '0.02em', marginTop: '0.1rem' }}>
              {contractData.contractRef}
            </div>
          </div>
          <div>{getStatusBadge(contractData.status)}</div>
        </div>
      </div>

      {/* 3. KEY CONTRACT SUMMARY GRID (4 Columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Department Card */}
        <div className="glass-panel-interactive" style={{
          background: 'rgba(30, 41, 59, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          padding: '1.25rem',
          borderRadius: '14px',
          transition: 'all 0.25s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building size={16} color="#818CF8" />
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              DEPARTMENT
            </span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
            {contractData.department}
          </div>
        </div>

        {/* Job Position Card */}
        <div className="glass-panel-interactive" style={{
          background: 'rgba(30, 41, 59, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          padding: '1.25rem',
          borderRadius: '14px',
          transition: 'all 0.25s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={16} color="#C084FC" />
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              JOB POSITION
            </span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
            {contractData.jobPosition}
          </div>
        </div>

        {/* Monthly Base Wage Card (Green Accent) */}
        <div className="glass-panel-interactive" style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(6, 95, 70, 0.12))',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          padding: '1.25rem',
          borderRadius: '14px',
          transition: 'all 0.25s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={16} color="#34D399" />
            </div>
            <span style={{ fontSize: '0.75rem', color: '#34D399', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              MONTHLY BASE WAGE
            </span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981' }}>
            ${Number(contractData.wage || 0).toLocaleString()}
          </div>
        </div>

        {/* Contract Duration Card (Yellow Accent) */}
        <div className="glass-panel-interactive" style={{
          background: 'rgba(30, 41, 59, 0.7)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          padding: '1.25rem',
          borderRadius: '14px',
          transition: 'all 0.25s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={16} color="#FBBF24" />
            </div>
            <span style={{ fontSize: '0.75rem', color: '#FBBF24', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              CONTRACT DURATION
            </span>
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FBBF24', marginTop: '0.2rem' }}>
            📅 {formatDate(contractData.startDate)} – {formatDate(contractData.endDate)}
          </div>
        </div>
      </div>

      {/* 4. CONTRACT STATUS & MESSAGE BANNER */}
      <div style={{
        background: contractData.status === 'RUNNING' ? 'rgba(16, 185, 129, 0.06)' : 'rgba(245, 158, 11, 0.06)',
        border: `1px solid ${contractData.status === 'RUNNING' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
        borderRadius: '14px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: contractData.status === 'RUNNING' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={22} color={contractData.status === 'RUNNING' ? '#34D399' : '#FBBF24'} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
              CURRENT CONTRACT STATUS
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '0.1rem' }}>
              {contractData.status === 'RUNNING' ? 'Running (Active Contract)' : contractData.status === 'DRAFT' ? 'Draft Contract' : 'Expired Record'}
            </div>
            <div style={{ fontSize: '0.83rem', color: '#94A3B8', marginTop: '0.2rem' }}>
              {contractData.status === 'RUNNING'
                ? 'This contract is currently active and within its effective period for payroll calculations.'
                : 'This contract is pending activation or has expired.'}
            </div>
          </div>
        </div>

        <div>{getStatusBadge(contractData.status)}</div>
      </div>

      {/* 5. CONTRACT LIFECYCLE TIMELINE */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        padding: '1.5rem 2rem',
        marginBottom: '1.75rem'
      }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>
          Contract Lifecycle & Milestone Timeline
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', position: 'relative' }}>
          {/* Milestone 1 */}
          <div style={{ borderLeft: '3px solid #10B981', paddingLeft: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 700 }}>STEP 1 • CREATED</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>Record Generated</div>
            <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.15rem' }}>📅 {formatDate(contractData.startDate)}</div>
          </div>

          {/* Milestone 2 */}
          <div style={{ borderLeft: '3px solid #10B981', paddingLeft: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 700 }}>STEP 2 • STARTED</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>Effective Date</div>
            <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.15rem' }}>📅 {formatDate(contractData.startDate)}</div>
          </div>

          {/* Milestone 3 */}
          <div style={{ borderLeft: `3px solid ${contractData.status === 'RUNNING' ? '#10B981' : '#94A3B8'}`, paddingLeft: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: contractData.status === 'RUNNING' ? '#34D399' : '#94A3B8', fontWeight: 700 }}>STEP 3 • CURRENT STATUS</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>{contractData.status}</div>
            <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.15rem' }}>Active Payroll Period</div>
          </div>

          {/* Milestone 4 */}
          <div style={{ borderLeft: '3px solid #F59E0B', paddingLeft: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#FBBF24', fontWeight: 700 }}>STEP 4 • EXPIRY</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>End Date</div>
            <div style={{ fontSize: '0.8rem', color: '#FBBF24', marginTop: '0.15rem' }}>📅 {formatDate(contractData.endDate)}</div>
          </div>
        </div>
      </div>

      {/* 6. STRUCTURED CONTRACT INFORMATION (2-Column Grid) */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        padding: '1.75rem',
        marginBottom: '2rem'
      }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={18} color="#60A5FA" />
          <span>Structured Contract Information</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* Column 1: Employment & Position */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#60A5FA', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.4rem' }}>
              Employment & Designation Details
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: '#94A3B8' }}>Contract Reference:</span>
              <span style={{ fontWeight: 700, color: '#34D399' }}>{contractData.contractRef}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: '#94A3B8' }}>Employee Classification:</span>
              <span style={{ fontWeight: 600, color: '#FBBF24' }}>{contractData.employeeType || 'Contract'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: '#94A3B8' }}>Department:</span>
              <span style={{ fontWeight: 600, color: '#fff' }}>{contractData.department}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: '#94A3B8' }}>Job Position:</span>
              <span style={{ fontWeight: 600, color: '#fff' }}>{contractData.jobPosition}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: '#94A3B8' }}>Created By HR Admin:</span>
              <span style={{ fontWeight: 500, color: '#94A3B8' }}>{contractData.createdByName || 'System HR'}</span>
            </div>
          </div>

          {/* Column 2: Compensation & Terms */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#34D399', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.4rem' }}>
              Compensation & Term Schedule
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: '#94A3B8' }}>Monthly Base Wage:</span>
              <span style={{ fontWeight: 800, color: '#10B981' }}>${Number(contractData.wage || 0).toLocaleString()}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: '#94A3B8' }}>Start Date:</span>
              <span style={{ fontWeight: 600, color: '#fff' }}>{formatDate(contractData.startDate)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: '#94A3B8' }}>End Date:</span>
              <span style={{ fontWeight: 600, color: '#FBBF24' }}>{formatDate(contractData.endDate)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: '#94A3B8' }}>Total Times Renewed:</span>
              <span style={{ fontWeight: 700, color: renewalCount > 0 ? '#34D399' : '#94A3B8' }}>
                {renewalCount > 0 ? `${renewalCount} ${renewalCount === 1 ? 'Time' : 'Times'}` : '0 Times (Initial Contract)'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: '#94A3B8' }}>Renewal Date / Time:</span>
              <span style={{ fontWeight: 600, color: '#34D399' }}>{formatDate(contractData.startDate)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: '#94A3B8' }}>Contract Status:</span>
              <span>{getStatusBadge(contractData.status)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: '#94A3B8' }}>Terms & Notes:</span>
              <span style={{ color: '#94A3B8', fontSize: '0.82rem' }}>{contractData.notes || 'Standard employment contract terms.'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 7. HISTORICAL CONTRACT RECORDS TABLE (NEW RENEWAL ENTRIES AT BOTTOM) */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        padding: '1.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Calendar size={20} color="#60A5FA" />
              <span>Contract History & Renewal Entries ({employeeContracts.length})</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: '0.25rem 0 0 0' }}>
              Contract renewed <strong>{renewalCount} {renewalCount === 1 ? 'time' : 'times'}</strong> • Each renewal generates a new historical entry
            </p>
          </div>
          <span style={{ fontSize: '0.78rem', color: '#34D399', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.3rem 0.75rem', borderRadius: '20px', fontWeight: 600 }}>
            {employeeContracts.length} Total Record{employeeContracts.length !== 1 ? 's' : ''} ({renewalCount} Renewal{renewalCount !== 1 ? 's' : ''})
          </span>
        </div>

        {loadingHistory ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>Loading contract history...</div>
        ) : (
          <div className="data-table-container">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Contract Ref</th>
                  <th>Entry Type / Renewal</th>
                  <th>Effective Dates</th>
                  <th>Renewed Date / Time</th>
                  <th>Department & Position</th>
                  <th>Monthly Wage ($)</th>
                  <th>Status</th>
                  <th>Created By</th>
                </tr>
              </thead>
              <tbody>
                {employeeContracts.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
                      No historical contract records found for this employee.
                    </td>
                  </tr>
                ) : (
                  employeeContracts.map((hist) => {
                    const chronoIdx = getChronoIndex(hist);
                    const renewalLabel = getRenewalWordLabel(chronoIdx);
                    const isRenewalEntry = chronoIdx > 0;

                    return (
                      <tr key={hist.id || hist._id} style={{ background: hist.status === 'RUNNING' ? 'rgba(16, 185, 129, 0.05)' : 'transparent' }}>
                        <td style={{ fontWeight: 700, color: hist.status === 'RUNNING' ? '#34D399' : '#fff' }}>
                          {hist.contractRef}
                        </td>
                        <td>
                          {isRenewalEntry ? (
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#34D399',
                              border: '1px solid rgba(16, 185, 129, 0.35)',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}>
                              <RefreshCw size={11} /> {renewalLabel}
                            </span>
                          ) : (
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'rgba(99, 102, 241, 0.15)',
                              color: '#818CF8',
                              border: '1px solid rgba(99, 102, 241, 0.35)',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '4px',
                              display: 'inline-block'
                            }}>
                              Initial Contract
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>
                          📅 {formatDate(hist.startDate)} to {formatDate(hist.endDate)}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: '#94A3B8', fontWeight: 600 }}>
                          {formatDate(hist.startDate)}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#fff' }}>{hist.department}</div>
                          <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{hist.jobPosition}</div>
                        </td>
                        <td style={{ color: '#34D399', fontWeight: 800, fontSize: '0.95rem' }}>
                          ${Number(hist.wage || 0).toLocaleString()}
                        </td>
                        <td>{getStatusBadge(hist.status)}</td>
                        <td style={{ fontSize: '0.82rem', color: '#94A3B8' }}>
                          {hist.createdByName || 'HR Admin'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
