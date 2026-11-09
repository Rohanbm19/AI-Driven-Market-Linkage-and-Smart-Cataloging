import React from 'react';
import { Link } from 'react-router-dom';

export default function Logo({
  to = '/',
  size = 42,
  tagline = 'Crafts • Culture • Connect',
  showTagline = true,
  variant = 'default'
}) {
  const Wrapper = to ? Link : 'div';
  const wrapperProps = to ? { to } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={`logo logo-${variant}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.7rem', textDecoration: 'none' }}
    >
      <div
        aria-hidden="true"
        style={{
          width: size * 0.56,
          height: size * 0.56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 35%, #7c3aed 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 800,
          fontSize: Math.max(14, size * 0.28),
          boxShadow: '0 8px 18px rgba(124, 58, 237, 0.25)'
        }}
      >
        K
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
        <span style={{ fontWeight: 800, letterSpacing: '0.02em', color: '#1f2937', fontSize: Math.max(16, size * 0.36) }}>
          KalaSetu
        </span>
        {showTagline && (
          <span style={{ fontSize: Math.max(9, size * 0.12), color: '#6b7280', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {tagline}
          </span>
        )}
      </div>
    </Wrapper>
  );
}
