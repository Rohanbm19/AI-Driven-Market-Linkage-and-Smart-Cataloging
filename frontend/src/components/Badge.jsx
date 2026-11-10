import React from 'react';

export default function Badge({ type = 'craft', children }) {
  const typeClasses = {
    craft: 'badge-craft',
    verified: 'badge-verified',
    ai: 'badge-ai',
    region: 'badge-region'
  };

  return (
    <span className={`badge ${typeClasses[type] || 'badge-craft'}`}>
      {children}
    </span>
  );
}
