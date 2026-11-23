
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  MessageSquare,
  Phone,
  UserRound,
  Package,
  Clock3,
  CheckCircle2,
  XCircle,
  Search,
  CalendarDays,
  MapPin,
  ArrowUpRight,
  Inbox,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';

import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';

export default function BuyerProfile() {
  const { id, email, fullName, phone, createdAt } = useAuth();

  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const loadEnquiries = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await api.getBuyerEnquiries(id);
      setEnquiries(Array.isArray(data) ? data : []);
    } catch (loadError) {
      console.error('Unable to load buyer enquiries:', loadError);
      setError('We could not load your enquiry history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnquiries();
  }, [id]);

  const getStatus = (status) => {
    const value = String(status || 'pending').toLowerCase();

    if (value === 'approved') return 'approved';
    if (value === 'rejected') return 'rejected';

    return 'pending';
  };

  const stats = useMemo(() => ({
    total: enquiries.length,
    pending: enquiries.filter(
      item => getStatus(item.status) === 'pending'
    ).length,
    approved: enquiries.filter(
      item => getStatus(item.status) === 'approved'
    ).length,
    rejected: enquiries.filter(
      item => getStatus(item.status) === 'rejected'
    ).length
  }), [enquiries]);

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((item) => {
      const status = getStatus(item.status);

      const matchesFilter =
        activeFilter === 'all' || status === activeFilter;

      const searchText = search.toLowerCase();

      const matchesSearch = [
        item.product_title,
        item.message,
        item.reply,
        item.buyer_name
      ].some(value =>
        String(value || '').toLowerCase().includes(searchText)
      );

      return matchesFilter && matchesSearch;
    });
  }, [enquiries, activeFilter, search]);

  const formatDate = (date) => {
    if (!date) return 'Date unavailable';

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return 'Date unavailable';
    }

    return parsed.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name) => {
    return String(name || 'Buyer')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');
  };

  const filters = [
    { label: 'All Enquiries', value: 'all', count: stats.total },
    { label: 'Pending', value: 'pending', count: stats.pending },
    { label: 'Approved', value: 'approved', count: stats.approved },
    { label: 'Rejected', value: 'rejected', count: stats.rejected }
  ];

  return (
    <main className="buyer-dashboard">

      {/* PROFILE HERO */}
      <section className="buyer-dashboard-hero">
        <div className="buyer-hero-content">
          <div className="buyer-avatar">
            {getInitials(fullName)}
          </div>

          <div className="buyer-hero-info">
            <span className="buyer-eyebrow">
              <ShieldCheck size={14} />
              KALASETU MEMBER
            </span>

            <h1>Welcome back, {fullName || 'Buyer'}</h1>

            <p>
              Manage your account and keep track of your artisan enquiries.
            </p>

            <div className="buyer-hero-meta">
              <span>
                <Mail size={15} />
                {email || 'Email not provided'}
              </span>

              {phone && (
                <span>
                  <Phone size={15} />
                  {phone}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="buyer-member-date">
          <CalendarDays size={17} />
          <div>
            <small>MEMBER SINCE</small>
            <strong>
              {createdAt
                ? new Date(createdAt).toLocaleDateString('en-IN', {
                    month: 'short',
                    year: 'numeric'
                  })
                : 'Recently joined'}
            </strong>
          </div>
        </div>
      </section>

      {/* ACCOUNT DETAILS */}
      <section className="buyer-account-section">
        <div className="buyer-section-heading">
          <div>
            <span className="buyer-section-label">YOUR ACCOUNT</span>
            <h2>Personal Information</h2>
            <p>Your registered KalaSetu account details.</p>
          </div>
        </div>

        <div className="buyer-account-grid">
          <div className="buyer-account-item">
            <div className="buyer-account-icon">
              <UserRound size={19} />
            </div>
            <div>
              <small>Full Name</small>
              <strong>{fullName || 'Not provided'}</strong>
            </div>
          </div>

          <div className="buyer-account-item">
            <div className="buyer-account-icon">
              <Mail size={19} />
            </div>
            <div>
              <small>Email Address</small>
              <strong>{email || 'Not provided'}</strong>
            </div>
          </div>

          <div className="buyer-account-item">
            <div className="buyer-account-icon">
              <Phone size={19} />
            </div>
            <div>
              <small>Phone Number</small>
              <strong>{phone || 'Not provided'}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* ENQUIRY STATISTICS */}
      <section className="buyer-stats-section">
        <div className="buyer-section-heading">
          <div>
            <span className="buyer-section-label">ACTIVITY OVERVIEW</span>
            <h2>Your Enquiry Activity</h2>
            <p>Track the progress of your product enquiries.</p>
          </div>

          <button
            type="button"
            className="buyer-refresh-btn"
            onClick={loadEnquiries}
            disabled={loading}
          >
            <RefreshCw
              size={16}
              className={loading ? 'buyer-spin' : ''}
            />
            Refresh
          </button>
        </div>

        <div className="buyer-stats-grid">
          <div className="buyer-stat-card total">
            <div className="buyer-stat-top">
              <span>Total Enquiries</span>
              <Package size={20} />
            </div>
            <strong>{stats.total}</strong>
            <small>All your product enquiries</small>
          </div>

          <div className="buyer-stat-card pending">
            <div className="buyer-stat-top">
              <span>Pending</span>
              <Clock3 size={20} />
            </div>
            <strong>{stats.pending}</strong>
            <small>Awaiting artisan response</small>
          </div>

          <div className="buyer-stat-card approved">
            <div className="buyer-stat-top">
              <span>Approved</span>
              <CheckCircle2 size={20} />
            </div>
            <strong>{stats.approved}</strong>
            <small>Accepted by artisans</small>
          </div>

          <div className="buyer-stat-card rejected">
            <div className="buyer-stat-top">
              <span>Rejected</span>
              <XCircle size={20} />
            </div>
            <strong>{stats.rejected}</strong>
            <small>Not accepted</small>
          </div>
        </div>
      </section>

      {/* ENQUIRY HISTORY */}
      <section className="buyer-history-section">
        <div className="buyer-section-heading">
          <div>
            <span className="buyer-section-label">YOUR MARKETPLACE ACTIVITY</span>
            <h2>Product Enquiries</h2>
            <p>View your requests and responses from artisans.</p>
          </div>

          <Link to="/" className="buyer-explore-link">
            Explore Marketplace
            <ArrowUpRight size={17} />
          </Link>
        </div>

        {/* SEARCH */}
        <div className="buyer-enquiry-toolbar">
          <div className="buyer-search-box">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search product or enquiry..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="buyer-filter-list">
            {filters.map(filter => (
              <button
                key={filter.value}
                type="button"
                className={`buyer-filter-btn ${
                  activeFilter === filter.value ? 'active' : ''
                }`}
                onClick={() => setActiveFilter(filter.value)}
              >
                {filter.label}
                <span>{filter.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="buyer-state-card">
            <RefreshCw size={28} className="buyer-spin" />
            <h3>Loading your enquiries</h3>
            <p>Please wait while we retrieve your activity.</p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="buyer-state-card buyer-error-state">
            <XCircle size={30} />
            <h3>Unable to load enquiries</h3>
            <p>{error}</p>
            <button
              type="button"
              className="buyer-primary-btn"
              onClick={loadEnquiries}
            >
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && enquiries.length === 0 && (
          <div className="buyer-state-card">
            <div className="buyer-empty-icon">
              <Inbox size={34} />
            </div>
            <h3>No enquiries yet</h3>
            <p>
              Your product enquiries will appear here once you contact an artisan.
            </p>
            <Link to="/" className="buyer-primary-btn">
              Explore Products
              <ArrowUpRight size={16} />
            </Link>
          </div>
        )}

        {/* NO FILTER RESULTS */}
        {!loading && !error && enquiries.length > 0 &&
          filteredEnquiries.length === 0 && (
            <div className="buyer-state-card">
              <Search size={30} />
              <h3>No matching enquiries</h3>
              <p>Try another search term or change your status filter.</p>
              <button
                type="button"
                className="buyer-reset-btn"
                onClick={() => {
                  setSearch('');
                  setActiveFilter('all');
                }}
              >
                Clear Filters
              </button>
            </div>
          )}

        {/* ENQUIRY CARDS */}
        {!loading && !error && filteredEnquiries.length > 0 && (
          <div className="buyer-enquiry-list">
            {filteredEnquiries.map((enquiry) => {
              const status = getStatus(enquiry.status);

              return (
                <article
                  className="buyer-enquiry-card"
                  key={enquiry.id}
                >
                  <div className="buyer-enquiry-card-top">
                    <div className="buyer-product-icon">
                      <Package size={23} />
                    </div>

                    <div className="buyer-product-info">
                      <span>PRODUCT ENQUIRY</span>
                      <h3>
                        {enquiry.product_title || 'Untitled Product'}
                      </h3>
                      <small>
                        <CalendarDays size={14} />
                        {formatDate(enquiry.created_at)}
                      </small>
                    </div>

                    <span className={`buyer-status-badge ${status}`}>
                      {status === 'approved' && <CheckCircle2 size={14} />}
                      {status === 'pending' && <Clock3 size={14} />}
                      {status === 'rejected' && <XCircle size={14} />}
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </div>

                  <div className="buyer-enquiry-details">
                    <div className="buyer-detail-block">
                      <small>Requested Quantity</small>
                      <strong>{enquiry.quantity || 'Not specified'}</strong>
                    </div>

                    <div className="buyer-detail-block">
                      <small>Enquiry ID</small>
                      <strong>{enquiry.id}</strong>
                    </div>
                  </div>

                  <div className="buyer-message-block">
                    <span>
                      <MessageSquare size={15} />
                      Your Message
                    </span>
                    <p>{enquiry.message || 'No message provided.'}</p>
                  </div>

                  {enquiry.reply && (
                    <div className="buyer-reply-block">
                      <div className="buyer-reply-heading">
                        <span>
                          <CheckCircle2 size={16} />
                          Artisan Response
                        </span>
                        <small>Reply received</small>
                      </div>
                      <p>{enquiry.reply}</p>
                    </div>
                  )}

                  {!enquiry.reply && status === 'pending' && (
                    <div className="buyer-pending-note">
                      <Clock3 size={15} />
                      Waiting for the artisan to respond to your enquiry.
                    </div>
                  )}

                  {!enquiry.reply && status === 'approved' && (
                    <div className="buyer-pending-note">
                      <CheckCircle2 size={15} />
                      Your enquiry has been approved. The artisan has not added a reply yet.
                    </div>
                  )}

                  {!enquiry.reply && status === 'rejected' && (
                    <div className="buyer-pending-note">
                      <XCircle size={15} />
                      The artisan has rejected this enquiry.
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
