import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Building, Briefcase, UserCheck } from 'lucide-react';

export const UserAvatarHoverPreview = ({
  name,
  role,
  email,
  department,
  employeeType,
  photoUrl,
  photo,
  size = 38,
  className = '',
  onClick
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const progressIntervalRef = useRef(null);

  const actualPhoto = photoUrl || photo;
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=7C3AED&color=fff&size=256`;
  const imageSrc = actualPhoto || defaultAvatar;

  const handleMouseEnter = () => {
    setIsHovering(true);
    setProgress(0);

    const startTime = Date.now();
    const duration = 1200; // 1.2s smooth hover delay

    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(progressIntervalRef.current);
      }
    }, 25);

    timerRef.current = setTimeout(() => {
      setIsFullscreen(true);
      setProgress(0);
    }, duration);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setProgress(0);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  };

  const openFullscreenImmediately = (e) => {
    e.stopPropagation();
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setIsFullscreen(true);
    setProgress(0);
    if (typeof onClick === 'function') {
      onClick(e);
    }
  };

  const closeFullscreen = (e) => {
    if (e) e.stopPropagation();
    setIsFullscreen(false);
    handleMouseLeave();
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  const overlayContent = isFullscreen ? (
    <div
      className="fullscreen-photo-overlay"
      onClick={closeFullscreen}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        background: 'rgba(5, 7, 20, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        cursor: 'pointer',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          maxWidth: '500px',
          width: '92%',
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(15, 23, 42, 0.98))',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          borderRadius: '24px',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.85), 0 0 45px rgba(124, 58, 237, 0.35)',
          cursor: 'default'
        }}
      >
        <button
          onClick={closeFullscreen}
          style={{
            position: 'absolute',
            top: '1.2rem',
            right: '1.2rem',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#fff',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          title="Close Fullscreen"
        >
          <X size={18} />
        </button>

        {/* Large Portrait Image */}
        <div
          style={{
            width: '240px',
            height: '240px',
            margin: '0 auto 1.5rem auto',
            borderRadius: '22px',
            overflow: 'hidden',
            boxShadow: '0 15px 35px rgba(0,0,0,0.6), 0 0 0 4px rgba(124, 58, 237, 0.45)',
            background: '#090d16',
            position: 'relative'
          }}
        >
          <img
            src={imageSrc}
            alt={name || 'User Profile'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* User Identity Details */}
        <h2 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>
          {name || 'Employee'}
        </h2>

        {/* Badges */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {role && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                background: 'rgba(124, 58, 237, 0.2)',
                color: '#C084FC',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              {role}
            </span>
          )}
          {employeeType && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                background: employeeType === 'Contract' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: employeeType === 'Contract' ? '#FBBF24' : '#34D399',
                border: employeeType === 'Contract' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              {employeeType}
            </span>
          )}
        </div>

        {/* Additional Metadata Details */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '0.85rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem',
            fontSize: '0.82rem',
            textAlign: 'left',
            marginBottom: '1rem'
          }}
        >
          {email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
              <Mail size={14} color="#A855F7" />
              <span style={{ color: '#E2E8F0' }}>{email}</span>
            </div>
          )}
          {department && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
              <Building size={14} color="#06B6D4" />
              <span style={{ color: '#E2E8F0' }}>{department}</span>
            </div>
          )}
        </div>

        <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', margin: 0 }}>
          Click anywhere outside or press Esc to dismiss preview
        </p>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div
        className={`user-avatar-hover-container ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          borderRadius: '50%',
          position: 'relative',
          cursor: 'pointer',
          display: 'inline-block',
          flexShrink: 0
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={openFullscreenImmediately}
        title={`Hover 1.2s or click to view full picture of ${name || 'User'}`}
      >
        {/* Animated Progress Ring for Hover Timer */}
        {isHovering && progress > 0 && progress < 100 && (
          <svg
            style={{
              position: 'absolute',
              top: -4,
              left: -4,
              width: size + 8,
              height: size + 8,
              transform: 'rotate(-90deg)',
              pointerEvents: 'none',
              zIndex: 10
            }}
          >
            <circle
              cx={(size + 8) / 2}
              cy={(size + 8) / 2}
              r={size / 2 + 1}
              fill="none"
              stroke="rgba(124, 58, 237, 0.3)"
              strokeWidth="3"
            />
            <circle
              cx={(size + 8) / 2}
              cy={(size + 8) / 2}
              r={size / 2 + 1}
              fill="none"
              stroke="#A855F7"
              strokeWidth="3"
              strokeDasharray={2 * Math.PI * (size / 2 + 1)}
              strokeDashoffset={
                2 * Math.PI * (size / 2 + 1) * (1 - progress / 100)
              }
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.025s linear' }}
            />
          </svg>
        )}

        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            overflow: 'hidden',
            border: isHovering
              ? '2px solid #A855F7'
              : '2px solid rgba(124, 58, 237, 0.4)',
            boxShadow: isHovering ? '0 0 12px rgba(168, 85, 247, 0.6)' : '0 2px 6px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.2s ease',
            position: 'relative',
            background: 'linear-gradient(135deg, #7C3AED, #4F46E5)'
          }}
        >
          <img
            src={imageSrc}
            alt={name || 'User'}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      </div>

      {overlayContent && createPortal(overlayContent, document.body)}
    </>
  );
};

export default UserAvatarHoverPreview;
