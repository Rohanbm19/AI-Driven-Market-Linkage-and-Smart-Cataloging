import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail, MessageSquare, Phone, UserRound, Package, Clock3,
  CheckCircle2, XCircle, Search, CalendarDays, ArrowUpRight,
  Inbox, RefreshCw, ShieldCheck
} from 'lucide-react';

import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { useLanguage } from '../i18n/index.jsx';

export default function BuyerProfile() {
  const { id, email, fullName, phone, createdAt } = useAuth();
  const { t, lang } = useLanguage();
  const text = t.buyerProfile || {};

  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const localeMap = {
    en: 'en-IN',
    hi: 'hi-IN',
    kn: 'kn-IN',
    ta: 'ta-IN',
    te: 'te-IN',
    ml: 'ml-IN'
  };
  const locale = localeMap[lang] || 'en-IN';

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
      setError(text.loadFailed);
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

  const statusLabels = {
    pending: text.pending,
    approved: text.approved,
    rejected: text.rejected
  };

  const stats = useMemo(() => ({
    total: enquiries.length,
    pending: enquiries.filter(item => getStatus(item.status) === 'pending').length,
    approved: enquiries.filter(item => getStatus(item.status) === 'approved').length,
    rejected: enquiries.filter(item => getStatus(item.status) === 'rejected').length
  }), [enquiries]);

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((item) => {
      const status = getStatus(item.status);
      const matchesFilter = activeFilter === 'all' || status === activeFilter;
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
    if (!date) return text.dateUnavailable;

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return text.dateUnavailable;

    return parsed.toLocaleString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name) => {
    return String(name || text.buyer)
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');
  };

  const filters = [
    { label: text.all, value: 'all', count: stats.total },
    { label: text.pending, value: 'pending', count: stats.pending },
    { label: text.approved, value: 'approved', count: stats.approved },
    { label: text.rejected, value: 'rejected', count: stats.rejected }
  ];

  return (
    <main className="buyer-dashboard">
      <section className="buyer-dashboard-hero">
        <div className="buyer-hero-content">
          <div className="buyer-avatar">{getInitials(fullName)}</div>

          <div className="buyer-hero-info">
            <span className="buyer-eyebrow">
              <ShieldCheck size={14} />
              {text.eyebrow}
            </span>

            <h1>{text.welcome}, {fullName || text.buyer}</h1>

            <p>{text.heroDesc}</p>

            <div className="buyer-hero-meta">
              <span>
                <Mail size={15} />
                {email || text.emailMissing}
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
            <small>{text.memberSince}</small>
            <strong>
              {createdAt
                ? new Date(createdAt).toLocaleDateString(locale, {
                    month: 'short',
                    year: 'numeric'
                  })
                : text.recentlyJoined}
            </strong>
          </div>
        </div>
      </section>

      <section className="buyer-account-section">
        <div className="buyer-section-heading">
          <div>
            <span className="buyer-section-label">{text.account}</span>
            <h2>{text.personal}</h2>
            <p>{text.accountDesc}</p>
          </div>
        </div>

        <div className="buyer-account-grid">
          <div className="buyer-account-item">
            <div className="buyer-account-icon"><UserRound size={19} /></div>
            <div>
              <small>{text.fullName}</small>
              <strong>{fullName || text.notProvided}</strong>
            </div>
          </div>

          <div className="buyer-account-item">
            <div className="buyer-account-icon"><Mail size={19} /></div>
            <div>
              <small>{text.email}</small>
              <strong>{email || text.notProvided}</strong>
            </div>
          </div>

          <div className="buyer-account-item">
            <div className="buyer-account-icon"><Phone size={19} /></div>
            <div>
              <small>{text.phone}</small>
              <strong>{phone || text.notProvided}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="buyer-stats-section">
        <div className="buyer-section-heading">
          <div>
            <span className="buyer-section-label">{text.activity}</span>
            <h2>{text.activityTitle}</h2>
            <p>{text.activityDesc}</p>
          </div>

          <button
            type="button"
            className="buyer-refresh-btn"
            onClick={loadEnquiries}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'buyer-spin' : ''} />
            {text.refresh}
          </button>
        </div>

        <div className="buyer-stats-grid">
          <div className="buyer-stat-card total">
            <div className="buyer-stat-top">
              <span>{text.total}</span>
              <Package size={20} />
            </div>
            <strong>{stats.total}</strong>
            <small>{text.allProducts}</small>
          </div>

          <div className="buyer-stat-card pending">
            <div className="buyer-stat-top">
              <span>{text.pending}</span>
              <Clock3 size={20} />
            </div>
            <strong>{stats.pending}</strong>
            <small>{text.awaiting}</small>
          </div>

          <div className="buyer-stat-card approved">
            <div className="buyer-stat-top">
              <span>{text.approved}</span>
              <CheckCircle2 size={20} />
            </div>
            <strong>{stats.approved}</strong>
            <small>{text.accepted}</small>
          </div>

          <div className="buyer-stat-card rejected">
            <div className="buyer-stat-top">
              <span>{text.rejected}</span>
              <XCircle size={20} />
            </div>
            <strong>{stats.rejected}</strong>
            <small>{text.notAccepted}</small>
          </div>
        </div>
      </section>

      <section className="buyer-history-section">
        <div className="buyer-section-heading">
          <div>
            <span className="buyer-section-label">{text.marketplace}</span>
            <h2>{text.products}</h2>
            <p>{text.historyDesc}</p>
          </div>

          <Link to="/" className="buyer-explore-link">
            {text.explore}
            <ArrowUpRight size={17} />
          </Link>
        </div>

        <div className="buyer-enquiry-toolbar">
          <div className="buyer-search-box">
            <Search size={18} />
            <input
              type="search"
              placeholder={text.search}
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

        {loading && (
          <div className="buyer-state-card">
            <RefreshCw size={28} className="buyer-spin" />
            <h3>{text.loading}</h3>
            <p>{text.wait}</p>
          </div>
        )}

        {!loading && error && (
          <div className="buyer-state-card buyer-error-state">
            <XCircle size={30} />
            <h3>{text.loadError}</h3>
            <p>{error}</p>
            <button
              type="button"
              className="buyer-primary-btn"
              onClick={loadEnquiries}
            >
              {text.retry}
            </button>
          </div>
        )}

        {!loading && !error && enquiries.length === 0 && (
          <div className="buyer-state-card">
            <div className="buyer-empty-icon"><Inbox size={34} /></div>
            <h3>{text.empty}</h3>
            <p>{text.emptyDesc}</p>
            <Link to="/" className="buyer-primary-btn">
              {text.exploreProducts}
              <ArrowUpRight size={16} />
            </Link>
          </div>
        )}

        {!loading && !error && enquiries.length > 0 &&
          filteredEnquiries.length === 0 && (
            <div className="buyer-state-card">
              <Search size={30} />
              <h3>{text.noMatch}</h3>
              <p>{text.noMatchDesc}</p>
              <button
                type="button"
                className="buyer-reset-btn"
                onClick={() => {
                  setSearch('');
                  setActiveFilter('all');
                }}
              >
                {text.clear}
              </button>
            </div>
          )}

        {!loading && !error && filteredEnquiries.length > 0 && (
          <div className="buyer-enquiry-list">
            {filteredEnquiries.map((enquiry) => {
              const status = getStatus(enquiry.status);

              return (
                <article className="buyer-enquiry-card" key={enquiry.id}>
                  <div className="buyer-enquiry-card-top">
                    <div className="buyer-product-icon"><Package size={23} /></div>

                    <div className="buyer-product-info">
                      <span>{text.productEnquiry}</span>
                      <h3>{enquiry.product_title || text.untitled}</h3>
                      <small>
                        <CalendarDays size={14} />
                        {formatDate(enquiry.created_at)}
                      </small>
                    </div>

                    <span className={`buyer-status-badge ${status}`}>
                      {status === 'approved' && <CheckCircle2 size={14} />}
                      {status === 'pending' && <Clock3 size={14} />}
                      {status === 'rejected' && <XCircle size={14} />}
                      {statusLabels[status]}
                    </span>
                  </div>

                  <div className="buyer-enquiry-details">
                    <div className="buyer-detail-block">
                      <small>{text.quantity}</small>
                      <strong>{enquiry.quantity || text.unspecified}</strong>
                    </div>

                    <div className="buyer-detail-block">
                      <small>{text.enquiryId}</small>
                      <strong>{enquiry.id}</strong>
                    </div>
                  </div>

                  <div className="buyer-message-block">
                    <span>
                      <MessageSquare size={15} />
                      {text.message}
                    </span>
                    <p>{enquiry.message || text.noMessage}</p>
                  </div>

                  {enquiry.reply && (
                    <div className="buyer-reply-block">
                      <div className="buyer-reply-heading">
                        <span>
                          <CheckCircle2 size={16} />
                          {text.response}
                        </span>
                        <small>{text.replyReceived}</small>
                      </div>
                      <p>{enquiry.reply}</p>
                    </div>
                  )}

                  {!enquiry.reply && status === 'pending' && (
                    <div className="buyer-pending-note">
                      <Clock3 size={15} />
                      {text.waiting}
                    </div>
                  )}

                  {!enquiry.reply && status === 'approved' && (
                    <div className="buyer-pending-note">
                      <CheckCircle2 size={15} />
                      {text.approvedNote}
                    </div>
                  )}

                  {!enquiry.reply && status === 'rejected' && (
                    <div className="buyer-pending-note">
                      <XCircle size={15} />
                      {text.rejectedNote}
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
