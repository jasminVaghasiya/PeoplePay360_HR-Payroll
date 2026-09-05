import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export const UserAvatarHoverPreview = ({
  name,
  role,
  photoUrl,
  photo,
  size = 40,
  className = ''
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
    const duration = 1500; // 1.5 second delay

    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(progressIntervalRef.current);
      }
    }, 30);

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

  const closeFullscreen = () => {
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
      onMouseLeave={closeFullscreen}
      onClick={closeFullscreen}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        background: 'rgba(5, 7, 20, 0.92)',
        backdropFilter: 'blur(18px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        cursor: 'pointer',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          maxWidth: '560px',
          width: '90%',
          background: 'rgba(17, 24, 39, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '24px',
          padding: '2.5rem',
          textAlign: 'center',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.8), 0 0 40px rgba(124, 58, 237, 0.3)',
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
            border: 'none',
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
          <X size={20} />
        </button>

        <div
          style={{
            width: '280px',
            height: '280px',
            margin: '0 auto 1.5rem auto',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 15px 35px rgba(0,0,0,0.5), 0 0 0 4px rgba(124, 58, 237, 0.5)',
            background: '#090d16'
          }}
        >
          <img
            src={imageSrc}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
          {name}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <span className="role-badge admin" style={{ fontSize: '0.85rem', padding: '0.35rem 0.9rem' }}>
            {role || 'Employee'}
          </span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
          Hover out of preview window or click anywhere to close full page photo view
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
          display: 'inline-block'
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        title={`Hover 1.5s to view full picture of ${name}`}
      >
        {/* Animated Progress Ring for 1.5s timer */}
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
              style={{ transition: 'stroke-dashoffset 0.03s linear' }}
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
            transition: 'border 0.2s ease',
            position: 'relative'
          }}
        >
          <img
            src={imageSrc}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      </div>

      {overlayContent && createPortal(overlayContent, document.body)}
    </>
  );
};
