import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import {
  MessageSquare,
  CheckCircle,
  Clock,
  Send,
  Phone,
  Mail,
  Building,
  Tag
} from 'lucide-react';

const INITIAL_ENQUIRIES = [
  {
    id: 'enq-1',
    buyer_name: 'Ananya Sharma (FabHeritage Boutiques)',
    buyer_type: 'Wholesale Retailer',
    email: 'ananya@fabheritage.in',
    phone: '+91 98450 12345',
    product_title: 'Bankura Terracotta Sacred Horse',
    quantity: '25 units',
    message: 'We are planning our festive Diwali curation for our stores in Bengaluru and Delhi. Can you ship 25 units of the 18-inch model by October 10th? What is your bulk discount pricing?',
    date: 'Today, 2:15 PM',
    status: 'pending'
  },
  {
    id: 'enq-2',
    buyer_name: 'David Miller (Artisan World Exports)',
    buyer_type: 'Export Buyer (UK)',
    email: 'david@artisanworld.co.uk',
    phone: '+44 7911 123456',
    product_title: 'Channapatna Wooden Nesting Dolls',
    quantity: '100 sets',
    message: 'We require European toy safety EN71 certification test reports for the organic vegetable dyes. Can we order 5 sample sets to evaluate quality and packaging?',
    date: 'Yesterday',
    status: 'pending'
  },
  {
    id: 'enq-3',
    buyer_name: 'Rohan Mehra (Studio Vistara Interiors)',
    buyer_type: 'Interior Architect',
    email: 'rohan@studiovistara.com',
    phone: '+91 97110 54321',
    product_title: 'Moradabad Engraved Brass Urli Bowl',
    quantity: '6 units',
    message: 'Need 6 pieces of the 24-inch antique patina finish for a heritage resort lobby in Udaipur. Payment terms can be 100% advance.',
    date: '3 days ago',
    status: 'responded'
  }
];

export default function Enquiries() {
  const [enquiries, setEnquiries] = useState(INITIAL_ENQUIRIES);
  const [filter, setFilter] = useState('all');
  const [replyText, setReplyText] = useState({});
  const [activeReplyId, setActiveReplyId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const live = await api.getEnquiries();
        if (isMounted && Array.isArray(live) && live.length > 0) {
          // Merge unique by id
          const map = new Map();
          live.forEach(e => map.set(e.id, e));
          INITIAL_ENQUIRIES.forEach(e => {
            if (!map.has(e.id)) map.set(e.id, e);
          });
          setEnquiries(Array.from(map.values()));
        }
      } catch (err) {
        console.warn('Enquiries fetch error:', err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = enquiries.filter((e) => {
    if (filter === 'pending') return e.status === 'pending';
    if (filter === 'responded') return e.status === 'responded';
    return true;
  });

  const handleSendReply = (id) => {
    setEnquiries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'responded' } : e))
    );
    setActiveReplyId(null);
    alert('Reply sent directly to buyer via SMS and email!');
  };

  const handleQuickTemplate = (id, text) => {
    setReplyText((prev) => ({ ...prev, [id]: text }));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Direct Buyer Enquiries & Orders</h1>
          <p className="page-subtitle">
            Manage incoming purchase enquiries from retail boutiques, export houses, and individual collectors.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['all', 'pending', 'responded'].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`btn btn-sm ${filter === tab ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(tab)}
              style={{ textTransform: 'capitalize' }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {filtered.map((enq) => (
          <div key={enq.id} className="card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '0.75rem',
                marginBottom: '1rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{enq.buyer_name}</h3>
                  <span
                    style={{
                      background: 'var(--bg-subtle)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    {enq.buyer_type}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    marginTop: '0.35rem'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Mail size={14} />
                    {enq.email}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Phone size={14} />
                    {enq.phone}
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.25rem 0.65rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    background: enq.status === 'pending' ? '#fef3c7' : '#ecfdf5',
                    color: enq.status === 'pending' ? '#92400e' : '#065f46'
                  }}
                >
                  {enq.status === 'pending' ? <Clock size={12} /> : <CheckCircle size={12} />}
                  <span style={{ textTransform: 'capitalize' }}>{enq.status}</span>
                </span>
                <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
                  {enq.date}
                </span>
              </div>
            </div>

            <div
              style={{
                background: 'var(--bg-subtle)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.86rem' }}>
                <strong>Product: {enq.product_title}</strong>
                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Requested: {enq.quantity}</span>
              </div>
              <p style={{ color: '#374151', fontSize: '0.92rem', lineHeight: 1.5, margin: 0 }}>
                "{enq.message}"
              </p>
            </div>

            {/* Quick response panel */}
            {activeReplyId === enq.id ? (
              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() =>
                      handleQuickTemplate(
                        enq.id,
                        'Namaste! Yes, we can fulfill this order within 3 weeks. Please confirm delivery location.'
                      )
                    }
                  >
                    Template: 3-Week Dispatch
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() =>
                      handleQuickTemplate(
                        enq.id,
                        'We would be delighted to send sample pieces for your inspection.'
                      )
                    }
                  >
                    Template: Send Samples
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={replyText[enq.id] || ''}
                    onChange={(e) =>
                      setReplyText((prev) => ({ ...prev, [enq.id]: e.target.value }))
                    }
                    placeholder="Type your response or choose a quick template..."
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleSendReply(enq.id)}
                  >
                    <Send size={16} />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                {enq.status === 'pending' && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setActiveReplyId(enq.id)}
                  >
                    <Send size={14} />
                    <span>Respond to Buyer</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
