
import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api.js';
import { useLanguage } from '../i18n/index.jsx';
import {
  MessageSquare,
  CheckCircle,
  Clock,
  Send,
  Phone,
  Mail,
  Package,
  RefreshCw
} from 'lucide-react';

export default function Enquiries() {
  const { t } = useLanguage();
  const text = t.enquiries || {};

  const [enquiries, setEnquiries] = useState([]);
  const [filter, setFilter] = useState('all');
  const [replyText, setReplyText] = useState({});
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendingId, setSendingId] = useState(null);

  // Load enquiries
  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError('');

      try {
        const result = await api.getEnquiries();

        if (active) {
          setEnquiries(Array.isArray(result) ? result : []);
        }
      } catch (err) {
        console.error('Enquiries fetch error:', err);

        if (active) {
          setError(text.loadError || err?.message || 'Unable to load enquiries.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  // Filter enquiries
  const filtered = useMemo(() => {
    if (filter === 'all') return enquiries;

    return enquiries.filter(
      enquiry => enquiry.status === filter
    );
  }, [enquiries, filter]);

  const pendingCount = enquiries.filter(
    enquiry => enquiry.status === 'pending'
  ).length;

  const respondedCount = enquiries.filter(
    enquiry => enquiry.status === 'responded'
  ).length;

  // Send reply
  const handleSendReply = async id => {
    const message = (replyText[id] || '').trim();

    if (!message || sendingId) return;

    setSendingId(id);

    try {
      await api.replyToEnquiry(id, message);

      setEnquiries(previous =>
        previous.map(enquiry =>
          enquiry.id === id
            ? { ...enquiry, status: 'responded' }
            : enquiry
        )
      );

      setReplyText(previous => ({
        ...previous,
        [id]: ''
      }));

      setActiveReplyId(null);

      window.alert(text.replySent || 'Reply sent successfully.');
    } catch (err) {
      window.alert(text.sendError || err?.message || 'Unable to send reply.');
    } finally {
      setSendingId(null);
    }
  };

  // Quick reply templates
  const handleQuickTemplate = (id, message) => {
    setReplyText(previous => ({
      ...previous,
      [id]: message
    }));
  };

  const getBuyerType = buyerType => {
    const buyerTypes = {
      'Wholesale Retailer': text.wholesaleRetailer,
      'Export Buyer (UK)': text.exportBuyer,
      'Interior Architect': text.interiorArchitect
    };

    return buyerTypes[buyerType] || buyerType || text.buyer || 'Buyer';
  };

  return (
    <div className="enquiries-page">

      {/* HEADER */}
      <div className="page-header enquiries-header">
        <div>
          <h1 className="page-title">
            {text.title || 'Buyer Enquiries'}
          </h1>

          <p className="page-subtitle">
            {text.desc ||
              'Manage buyer requests and communicate with potential customers.'}
          </p>
        </div>
      </div>

      {/* SUMMARY */}
      <section className="enquiries-summary">
        <div className="enquiry-summary-card">
          <div className="enquiry-summary-icon">
            <MessageSquare size={20} />
          </div>

          <div>
            <strong>{enquiries.length}</strong>
            <span>{text.totalEnquiries || 'Total Enquiries'}</span>
          </div>
        </div>

        <div className="enquiry-summary-card">
          <div className="enquiry-summary-icon pending">
            <Clock size={20} />
          </div>

          <div>
            <strong>{pendingCount}</strong>
            <span>{text.pending || 'Pending'}</span>
          </div>
        </div>

        <div className="enquiry-summary-card">
          <div className="enquiry-summary-icon responded">
            <CheckCircle size={20} />
          </div>

          <div>
            <strong>{respondedCount}</strong>
            <span>{text.responded || 'Responded'}</span>
          </div>
        </div>
      </section>

      {/* FILTERS */}
      <div className="enquiries-toolbar">
        <div>
          <h2>{text.title || 'Enquiries'}</h2>
          <p>{text.toolbarDesc || 'Review and respond to buyer requests.'}</p>
        </div>

        <div className="enquiries-filters">
          {['all', 'pending', 'responded'].map(tab => (
            <button
              key={tab}
              type="button"
              className={`enquiry-filter-btn ${
                filter === tab ? 'active' : ''
              }`}
              onClick={() => setFilter(tab)}
            >
              {text[tab] || tab}
            </button>
          ))}
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="enquiries-state">
          <RefreshCw size={22} className="animate-spin" />
          <p>{text.loading || 'Loading enquiries...'}</p>
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div className="enquiries-state error" role="alert">
          <MessageSquare size={25} />
          <p>{error}</p>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && !error && filtered.length === 0 && (
        <div className="enquiries-state">
          <MessageSquare size={32} />
          <h3>{text.noEnquiries || 'No enquiries found'}</h3>
          <p>
            {filter === 'all'
              ? (text.noEnquiriesDesc || 'Buyer enquiries will appear here when customers contact you.')
              : (text.noFilteredEnquiries || `There are no ${filter} enquiries at the moment.`)}
          </p>
        </div>
      )}

      {/* ENQUIRY LIST */}
      {!loading && !error && filtered.length > 0 && (
        <div className="enquiries-list">
          {filtered.map(enq => (
            <article className="enquiry-card" key={enq.id}>

              {/* BUYER DETAILS */}
              <div className="enquiry-card-header">
                <div className="enquiry-buyer">
                  <div className="enquiry-avatar">
                    {(enq.buyer_name || 'B')
                      .trim()
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <h3>{enq.buyer_name || text.buyer || 'Buyer'}</h3>

                    <span className="enquiry-buyer-type">
                      {getBuyerType(enq.buyer_type)}
                    </span>
                  </div>
                </div>

                <div className="enquiry-status-area">
                  <span
                    className={`enquiry-status ${
                      enq.status === 'pending'
                        ? 'pending'
                        : 'responded'
                    }`}
                  >
                    {enq.status === 'pending' ? (
                      <Clock size={13} />
                    ) : (
                      <CheckCircle size={13} />
                    )}

                    {text[enq.status] || enq.status}
                  </span>

                  <span className="enquiry-date">
                    {enq.date}
                  </span>
                </div>
              </div>

              {/* CONTACT DETAILS */}
              <div className="enquiry-contact">
                {enq.email && (
                  <a href={`mailto:${enq.email}`}>
                    <Mail size={15} />
                    {enq.email}
                  </a>
                )}

                {enq.phone && (
                  <a href={`tel:${enq.phone}`}>
                    <Phone size={15} />
                    {enq.phone}
                  </a>
                )}
              </div>

              {/* PRODUCT DETAILS */}
              <div className="enquiry-product">
                <div className="enquiry-product-heading">
                  <Package size={17} />

                  <div>
                    <span>{text.product || 'Product'}</span>
                    <strong>{enq.product_title || text.productEnquiry || 'Product enquiry'}</strong>
                  </div>
                </div>

                <div className="enquiry-quantity">
                  <span>{text.requested || 'Requested quantity'}</span>
                  <strong>{enq.quantity || text.notSpecified || 'Not specified'}</strong>
                </div>
              </div>

              {/* BUYER MESSAGE */}
              <div className="enquiry-message">
                <span>{text.buyerMessage || 'Buyer Message'}</span>
                <p>{enq.message || text.noMessage || 'No message provided.'}</p>
              </div>

              {/* REPLY SECTION */}
              {activeReplyId === enq.id ? (
                <div className="enquiry-reply">
                  <div className="enquiry-reply-heading">
                    <h4>{text.replyToBuyer || 'Reply to buyer'}</h4>

                    <button
                      type="button"
                      className="enquiry-cancel"
                      onClick={() => setActiveReplyId(null)}
                    >
                      {text.cancel || 'Cancel'}
                    </button>
                  </div>

                  <div className="enquiry-templates">
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickTemplate(
                          enq.id,
                          text.templateDispatchMessage || ''
                        )
                      }
                    >
                      {text.templateDispatch || 'Dispatch update'}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleQuickTemplate(
                          enq.id,
                          text.templateSamplesMessage || ''
                        )
                      }
                    >
                      {text.templateSamples || 'Sample request'}
                    </button>
                  </div>

                  <textarea
                    className="form-input enquiry-reply-input"
                    value={replyText[enq.id] || ''}
                    onChange={event =>
                      setReplyText(previous => ({
                        ...previous,
                        [enq.id]: event.target.value
                      }))
                    }
                    placeholder={
                      text.replyPlaceholder || 'Write your reply...'
                    }
                    rows={4}
                  />

                  <div className="enquiry-reply-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={
                        !(replyText[enq.id] || '').trim() ||
                        sendingId === enq.id
                      }
                      onClick={() => handleSendReply(enq.id)}
                    >
                      {sendingId === enq.id ? (
                        <RefreshCw
                          size={15}
                          className="animate-spin"
                        />
                      ) : (
                        <Send size={15} />
                      )}

                      {sendingId === enq.id
                        ? (text.sending || 'Sending...')
                        : text.send || 'Send Reply'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="enquiry-card-footer">
                  {enq.status === 'pending' ? (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setActiveReplyId(enq.id)}
                    >
                      <Send size={14} />
                      {text.respondToBuyer || 'Respond to Buyer'}
                    </button>
                  ) : (
                    <span className="enquiry-replied-label">
                      <CheckCircle size={15} />
                      {text.replySentLabel || 'Reply sent'}
                    </span>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}





