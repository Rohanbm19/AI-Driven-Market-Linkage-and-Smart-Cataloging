import React from 'react';

export default function SellerDashboard() {
  const stats = [
    { label: 'Live listings', value: '24' },
    { label: 'Inquiries', value: '18' },
    { label: 'Avg. order value', value: '₹3.4k' },
    { label: 'Profile rating', value: '4.9/5' }
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Seller Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {stats.map((stat) => (
          <div key={stat.label} className="card" style={{ padding: '1.25rem' }}>
            <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>{stat.label}</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <h2 style={{ marginTop: 0 }}>Studio overview</h2>
        <p style={{ margin: 0, color: '#4b5563', lineHeight: 1.7 }}>
          Your artisan storefront is ready for new buyers. Add new product listings, enhance image assets,
          and respond to customer enquiries to continue growing your direct-to-market sales.
        </p>
      </div>
    </div>
  );
}
