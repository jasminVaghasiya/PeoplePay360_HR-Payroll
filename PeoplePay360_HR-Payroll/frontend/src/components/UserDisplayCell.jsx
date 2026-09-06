import React from 'react';
import { UserAvatarHoverPreview } from './UserAvatarHoverPreview';

/**
 * Helper to compute clean 2-letter initials
 */
export const getUserInitials = (name) => {
  if (!name || typeof name !== 'string') return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Standard Role Badge Color Styles
 */
export const getRoleBadgeClass = (role) => {
  switch (role) {
    case 'Admin':
      return { bg: 'rgba(239, 68, 68, 0.15)', color: '#FCA5A5', border: 'rgba(239, 68, 68, 0.35)', label: 'Admin' };
    case 'HR Payroll Manager':
      return { bg: 'rgba(124, 58, 237, 0.15)', color: '#C084FC', border: 'rgba(139, 92, 246, 0.35)', label: 'HR Payroll Manager' };
    case 'HR Payroll User':
      return { bg: 'rgba(6, 182, 212, 0.15)', color: '#67E8F9', border: 'rgba(6, 182, 212, 0.35)', label: 'HR Payroll User' };
    case 'HR Manager':
      return { bg: 'rgba(59, 130, 246, 0.15)', color: '#93C5FD', border: 'rgba(59, 130, 246, 0.35)', label: 'HR Manager' };
    default:
      return { bg: 'rgba(148, 163, 184, 0.15)', color: '#CBD5E1', border: 'rgba(148, 163, 184, 0.35)', label: role || 'Employee' };
  }
};

/**
 * Standard Status Badge Color Styles
 */
export const getStatusBadgeStyle = (status) => {
  switch (status) {
    case 'Active':
    case 'Approved':
    case 'Running':
    case 'Present':
      return { bg: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: 'rgba(16, 185, 129, 0.35)' };
    case 'Pending':
    case 'Pending Approval':
    case 'Late':
    case 'Half Day':
      return { bg: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24', border: 'rgba(245, 158, 11, 0.35)' };
    case 'Inactive':
    case 'Refused':
    case 'Expired':
    case 'Absent':
      return { bg: 'rgba(239, 68, 68, 0.15)', color: '#F87171', border: 'rgba(239, 68, 68, 0.35)' };
    case 'Contract':
      return { bg: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24', border: 'rgba(245, 158, 11, 0.35)' };
    case 'Permanent':
      return { bg: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: 'rgba(16, 185, 129, 0.35)' };
    default:
      return { bg: 'rgba(148, 163, 184, 0.15)', color: '#94A3B8', border: 'rgba(148, 163, 184, 0.25)' };
  }
};

/**
 * Standard Pill Badge for Roles
 */
export const UserRoleBadge = ({ role, style = {} }) => {
  const conf = getRoleBadgeClass(role);
  return (
    <span
      className="role-pill-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.22rem 0.6rem',
        borderRadius: '9999px',
        fontSize: '0.72rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
        background: conf.bg,
        color: conf.color,
        border: `1px solid ${conf.border}`,
        whiteSpace: 'nowrap',
        ...style
      }}
    >
      {conf.label}
    </span>
  );
};

/**
 * Standard Pill Badge for Statuses
 */
export const UserStatusBadge = ({ status, style = {} }) => {
  const conf = getStatusBadgeStyle(status);
  return (
    <span
      className="status-pill-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.22rem 0.6rem',
        borderRadius: '9999px',
        fontSize: '0.72rem',
        fontWeight: 700,
        letterSpacing: '0.02em',
        background: conf.bg,
        color: conf.color,
        border: `1px solid ${conf.border}`,
        whiteSpace: 'nowrap',
        ...style
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: conf.color,
          display: 'inline-block'
        }}
      />
      {status}
    </span>
  );
};

/**
 * Standard User Display Component (Avatar + Name + Subtitle)
 * Creates uniform appearance across all tables, lists, and cards.
 */
export const UserDisplayCell = ({
  name,
  email,
  photo,
  subtitle,
  role,
  department,
  employeeType,
  size = 36,
  onClick,
  style = {}
}) => {
  return (
    <div
      className="user-display-cell"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.7rem',
        cursor: onClick ? 'pointer' : 'inherit',
        ...style
      }}
    >
      <UserAvatarHoverPreview
        name={name}
        photoUrl={photo}
        email={email}
        department={department || subtitle}
        role={role}
        employeeType={employeeType}
        size={size}
      />

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontWeight: 700,
            color: '#fff',
            fontSize: '0.88rem',
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '180px'
          }}
          title={name}
        >
          {name || 'Unnamed Employee'}
        </div>
        {(subtitle || email) && (
          <div
            style={{
              fontSize: '0.74rem',
              color: 'var(--text-muted)',
              marginTop: '0.08rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '180px'
            }}
            title={subtitle || email}
          >
            {subtitle || email}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDisplayCell;
