import React from 'react';

/**
 * Modern, accessible iOS/SaaS style status toggle switch.
 * Replaces delete/destructive icons for activating/deactivating status.
 */
export const StatusToggleSwitch = ({
  isActive = false,
  onToggle,
  disabled = false,
  size = 'sm',
  showLabel = false,
  title = '',
  style = {}
}) => {
  const isSm = size === 'sm';
  const trackWidth = isSm ? 32 : 38;
  const trackHeight = isSm ? 18 : 22;
  const knobSize = isSm ? 14 : 18;
  const knobOffset = 2;
  const knobLeft = isActive ? trackWidth - knobSize - knobOffset : knobOffset;

  const tooltipText = title || (
    disabled
      ? 'Status is protected and cannot be changed'
      : isActive
        ? 'Status: Active • Click to Deactivate'
        : 'Status: Inactive • Click to Activate'
  );

  const handleClick = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!disabled && onToggle) {
      onToggle(e);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  };

  return (
    <div
      role="switch"
      aria-checked={isActive}
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      title={tooltipText}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        userSelect: 'none',
        verticalAlign: 'middle',
        ...style
      }}
    >
      <div
        style={{
          width: `${trackWidth}px`,
          height: `${trackHeight}px`,
          borderRadius: `${trackHeight}px`,
          backgroundColor: isActive ? '#10B981' : 'rgba(255, 255, 255, 0.18)',
          border: isActive ? '1px solid #059669' : '1px solid rgba(255, 255, 255, 0.22)',
          position: 'relative',
          transition: 'background-color 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease',
          boxShadow: isActive ? '0 0 10px rgba(16, 185, 129, 0.35)' : 'none',
          flexShrink: 0
        }}
      >
        <div
          style={{
            width: `${knobSize}px`,
            height: `${knobSize}px`,
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            position: 'absolute',
            top: `${knobOffset}px`,
            left: `${knobLeft}px`,
            transition: 'left 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4)'
          }}
        />
      </div>

      {showLabel && (
        <span
          style={{
            fontSize: isSm ? '0.72rem' : '0.8rem',
            fontWeight: 600,
            color: isActive ? '#34D399' : '#94A3B8',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap'
          }}
        >
          {isActive ? 'Active' : 'Inactive'}
        </span>
      )}
    </div>
  );
};

export default StatusToggleSwitch;
