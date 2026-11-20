import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageSquare, Phone, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';

export default function BuyerProfile() {
  const { id, email, fullName, phone, createdAt } = useAuth();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    api.getBuyerEnquiries(id)
      .then((data) => {
        if (active) setEnquiries(data);
      })
      .catch((loadError) => {
        console.error('Unable to load buyer enquiries:', loadError);
        if (active) setError('We could not load your enquiry history. Please try again later.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <section className="buyer-profile">
      <header className="page-header">
        <div>
          <h1 className="page-title">Buyer Profile</h1>
          <p className="page-subtitle">Your KalaSetu account details and product enquiries.</p>
        </div>
      </header>

      <section className="card buyer-profile-account" aria-labelledby="buyer-account-heading">
        <h2 id="buyer-account-heading" className="buyer-profile-section-title">
          <UserRound size={20} /> Account Details
        </h2>
        <dl className="buyer-profile-details">
          <div>
            <dt>Name</dt>
            <dd>{fullName || 'Not provided'}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd><Mail size={15} />{email || 'Not provided'}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd><Phone size={15} />{phone || 'Not provided'}</dd>
          </div>
          <div>
            <dt>Member since</dt>
            <dd>{createdAt ? new Date(createdAt).toLocaleDateString() : 'Not available'}</dd>
          </div>
        </dl>
      </section>

      <section className="buyer-profile-enquiries" aria-labelledby="buyer-enquiries-heading">
        <h2 id="buyer-enquiries-heading" className="buyer-profile-section-title">
          <MessageSquare size={20} /> Past Product Enquiries
        </h2>

        {loading && <p className="seller-empty-state" role="status">Loading your enquiries...</p>}
        {error && <p className="form-error-banner" role="alert">{error}</p>}
        {!loading && !error && enquiries.length === 0 && (
          <div className="card seller-empty-state">
            <p>You have not sent any product enquiries yet.</p>
            <Link to="/" className="btn btn-secondary">Explore the Marketplace</Link>
          </div>
        )}

        {!loading && !error && enquiries.map((enquiry) => (
          <article className="card buyer-enquiry-card" key={enquiry.id}>
            <div className="buyer-enquiry-heading">
              <div>
                <h3>{enquiry.product_title}</h3>
                <p>{new Date(enquiry.created_at).toLocaleString()}</p>
              </div>
              <span>{enquiry.quantity}</span>
            </div>
            <p className="buyer-enquiry-message">{enquiry.message}</p>
          </article>
        ))}
      </section>
    </section>
  );
}
