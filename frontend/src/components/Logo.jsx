import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Premium Indian Heritage Logo for KalaSetu
 * Symbol: Lotus & artisan bridge pattern with terracotta, maroon & gold accents.
 */
export function KalaSetuEmblem({ size = 40, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="terracottaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E26548" />
          <stop offset="50%" stopColor="#C84E32" />
          <stop offset="100%" stopColor="#9C2D16" />
        </linearGradient>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5D076" />
          <stop offset="50%" stopColor="#D69A45" />
          <stop offset="100%" stopColor="#B37722" />
        </linearGradient>
        <linearGradient id="maroonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5E2320" />
          <stop offset="100%" stopColor="#351110" />
        </linearGradient>
      </defs>

      {/* Outer Heritage Circular Base */}
      <circle cx="50" cy="50" r="47" fill="url(#maroonGrad)" stroke="url(#goldGrad)" strokeWidth="1.8" />
      <circle cx="50" cy="50" r="43" stroke="rgba(214, 154, 69, 0.35)" strokeWidth="0.8" strokeDasharray="3 2" />

      {/* Connecting Bridge (Setu) Base Arc */}
      <path
        d="M20 72 C35 58, 65 58, 80 72"
        stroke="url(#goldGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M26 77 C38 66, 62 66, 74 77"
        stroke="url(#terracottaGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Central Heritage Lotus Bloom */}
      {/* Center Petal */}
      <path
        d="M50 20 C43 32, 44 48, 50 62 C56 48, 57 32, 50 20 Z"
        fill="url(#terracottaGrad)"
      />
      <path
        d="M50 20 L50 62"
        stroke="url(#goldGrad)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Left Inner Petal */}
      <path
        d="M50 34 C40 33, 31 43, 33 56 C39 58, 46 54, 50 49 Z"
        fill="url(#goldGrad)"
        opacity="0.95"
      />

      {/* Right Inner Petal */}
      <path
        d="M50 34 C60 33, 69 43, 67 56 C61 58, 54 54, 50 49 Z"
        fill="url(#goldGrad)"
        opacity="0.95"
      />

      {/* Left Outer Wing / Craft Wave */}
      <path
        d="M48 42 C34 40, 22 48, 22 59 C28 62, 38 60, 46 54 Z"
        fill="url(#terracottaGrad)"
        opacity="0.85"
      />

      {/* Right Outer Wing / Craft Wave */}
      <path
        d="M52 42 C66 40, 78 48, 78 59 C72 62, 62 60, 54 54 Z"
        fill="url(#terracottaGrad)"
        opacity="0.85"
      />

      {/* Sacred Center Bindu (Jewel of Craftsmanship) */}
      <circle cx="50" cy="40" r="3" fill="#FFF8F0" stroke="url(#goldGrad)" strokeWidth="1" />
      <circle cx="50" cy="20" r="1.8" fill="url(#goldGrad)" />
      <circle cx="33" cy="56" r="1.2" fill="url(#goldGrad)" />
      <circle cx="67" cy="56" r="1.2" fill="url(#goldGrad)" />
    </svg>
  );
}

export default function Logo({
  variant = 'full',
  size = 42,
  tagline = 'Crafts • Culture • Connect',
  showTagline = true,
  to = '/'
}) {
  const content = (
    <div className={`kalasetu-brand ${variant === 'compact' ? 'is-compact' : ''}`}>
      <KalaSetuEmblem size={size} />
      <div className="kalasetu-brand-text">
        <div className="kalasetu-brand-title">
          <span className="brand-kala">Kala</span>
          <span className="brand-setu">Setu</span>
          <span className="brand-bindu">✦</span>
        </div>
        {showTagline && variant !== 'compact' && (
          <span className="kalasetu-brand-tagline">
            {tagline}
          </span>
        )}
      </div>
    </div>
  );

  if (!to) return content;

  return (
    <Link to={to} className="kalasetu-brand-link" aria-label="KalaSetu - Crafts • Culture • Connect">
      {content}
    </Link>
  );
}
