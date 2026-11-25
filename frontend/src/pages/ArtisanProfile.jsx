import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, MapPin, Calendar, Star, ShoppingBag,
  Edit3, Check, AlertCircle, PlusCircle, Save, Trash2,
  Mail, Phone, MessageSquare, MapPinned, Package,
  Send, Clock, CheckCircle2, XCircle
} from 'lucide-react';

import confetti from 'canvas-confetti';
import { api, MOCK_ARTISAN } from '../services/api.js';
import ProductCard from '../components/ProductCard.jsx';
import Badge from '../components/Badge.jsx';
import VoiceTextInput from '../components/VoiceTextInput.jsx';
import { detectLanguage } from '../utils/detectLanguage.js';
import { useLanguage } from '../i18n/index.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function ArtisanProfile() {
  const { id: userId, fullName, studioName } = useAuth();
  const { t, lang } = useLanguage();
  const pf = t?.profile || {};
  const st = pf.studio || {};

  const [artisan, setArtisan] = useState({
    id: userId,
    name: studioName || fullName || '',
    badges: []
  });

  const [products, setProducts] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile editing
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [craft, setCraft] = useState('');
  const [region, setRegion] = useState('');
  const [experience, setExperience] = useState('');
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // Enquiry management
  const [enquiryError, setEnquiryError] = useState('');
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyingId, setReplyingId] = useState(null);
  const [updatingEnquiryId, setUpdatingEnquiryId] = useState(null);
  const [enquiryFilter, setEnquiryFilter] = useState('all');

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setSaveError('');
        setEnquiryError('');

        const [loadedArtisan, allProducts, artisanEnquiries] =
          await Promise.all([
            api.getArtisanProfile(userId, lang),
            api.getProducts(lang),
            api.getEnquiries()
          ]);

        if (!isMounted) return;

        const profile = loadedArtisan || {
          id: userId,
          name: studioName || fullName || '',
          craft: '',
          region: '',
          experience: '',
          bio: '',
          avatar: '',
          badges: [],
          rating: 0,
          total_sales: 0
        };

        setArtisan(profile);

        const originalProfile = profile.original_profile || profile;

        setName(originalProfile.name || '');
        setCraft(originalProfile.craft || '');
        setRegion(originalProfile.region || '');
        setExperience(originalProfile.experience || '');
        setAvatar(originalProfile.avatar || '');
        setBio(originalProfile.bio || '');

        setProducts(
          (allProducts || []).filter(
            product => product.artisan_id === userId
          )
        );

        setEnquiries(
          Array.isArray(artisanEnquiries) ? artisanEnquiries : []
        );
      } catch (error) {
        console.error('Profile loading error:', error);

        if (isMounted) {
          setSaveError(error.message || st.loadError);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (userId) {
      loadData();
    } else {
      setLoading(false);
      setSaveError(st.signIn);
    }

    return () => {
      isMounted = false;
    };
  }, [userId, studioName, fullName, lang]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    setSaving(true);
    setSaveSuccess('');
    setSaveError('');

    try {
      const payload = {
        name: name.trim(),
        craft: craft.trim(),
        region: region.trim(),
        experience: experience.trim(),
        avatar: avatar.trim() || MOCK_ARTISAN.avatar,
        bio: bio.trim()
      };

      const result = await api.updateArtisanProfile(userId, payload);

      if (result.success) {
        setArtisan(result.data);
        setIsEditing(false);

        setSaveSuccess(
          result.savedInSupabase
            ? st.savedCloud
            : st.savedLocal
        );

        confetti({
          particleCount: 60,
          spread: 55,
          origin: { y: 0.6 }
        });
      } else {
        setSaveError(st.saveError);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveError(error.message || st.saveGenericError);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (productId, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm(st.confirmDeleteCraft)) {
      return;
    }

    try {
      await api.deleteProduct(productId);

      setProducts(previous =>
        previous.filter(product => product.id !== productId)
      );
    } catch (error) {
      window.alert(st.deleteError + error.message);
    }
  };

  // Approve or reject an enquiry
  const handleEnquiryStatus = async (enquiry, newStatus) => {
    const action = newStatus === 'approved' ? 'approve' : 'reject';

    if (!window.confirm(newStatus === "approved" ? st.confirmApprove : st.confirmReject)) {
      return;
    }

    setUpdatingEnquiryId(enquiry.id);
    setEnquiryError('');

    try {
      await api.updateEnquiryStatus(enquiry.id, newStatus);

      setEnquiries(previous =>
        previous.map(item =>
          item.id === enquiry.id
            ? {
                ...item,
                status: newStatus,
                updated_at: new Date().toISOString()
              }
            : item
        )
      );
    } catch (error) {
      console.error('Enquiry status update failed:', error);
      setEnquiryError(
        error.message || (newStatus === "approved" ? st.approveError : st.rejectError)
      );
    } finally {
      setUpdatingEnquiryId(null);
    }
  };

  // Reply to a buyer without changing the approval status
  const handleReply = async (enquiry) => {
    const reply = (replyDrafts[enquiry.id] || '').trim();

    if (!reply) {
      window.alert(st.replyRequired);
      return;
    }

    setReplyingId(enquiry.id);

    try {
      await api.replyToEnquiry(enquiry.id, reply);

      setEnquiries(previous =>
        previous.map(item =>
          item.id === enquiry.id
            ? {
                ...item,
                reply,
                updated_at: new Date().toISOString()
              }
            : item
        )
      );

      setReplyDrafts(previous => ({
        ...previous,
        [enquiry.id]: ''
      }));
    } catch (error) {
      console.error('Reply failed:', error);
      window.alert(error.message || st.replyError);
    } finally {
      setReplyingId(null);
    }
  };

  const detectedBioLang = detectLanguage(bio);

  const pendingCount = enquiries.filter(
    item => (item.status || 'pending') === 'pending'
  ).length;

  const approvedCount = enquiries.filter(
    item => item.status === 'approved'
  ).length;

  const rejectedCount = enquiries.filter(
    item => item.status === 'rejected'
  ).length;

  const filteredEnquiries = enquiries.filter(item => {
    const status = item.status || 'pending';

    if (enquiryFilter === 'pending') return status === 'pending';
    if (enquiryFilter === 'approved') return status === 'approved';
    if (enquiryFilter === 'rejected') return status === 'rejected';

    return true;
  });

  const getStatusLabel = (status) => {
    switch (status || 'pending') {
      case 'approved':
        return st.approved || 'Approved';
      case 'rejected':
        return st.rejected || 'Rejected';
      default:
        return st.pending || 'Pending';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-muted)' }}>
          {st.loadingProfile || pf.loadingProfile || 'Loading artisan profile...'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

      {saveSuccess && (
        <div className="artisan-profile-success">
          <Check size={18} />
          <span>{saveSuccess}</span>
          <button type="button" onClick={() => setSaveSuccess('')}>
            âœ•
          </button>
        </div>
      )}

      {saveError && (
        <div className="artisan-profile-error">
          <AlertCircle size={18} />
          <span>{saveError}</span>
        </div>
      )}

      {/* PROFILE CARD */}
      <div
        className="card"
        style={{
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)'
        }}
      >
        <div className="artisan-profile-top">
          <div className="artisan-profile-badges">
            {(artisan.badges || []).map(badge => (
              <Badge key={badge} type="verified">
                {badge}
              </Badge>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setIsEditing(!isEditing);
              setSaveError('');
            }}
            className={`btn btn-sm ${
              isEditing ? 'btn-secondary' : 'btn-primary'
            }`}
          >
            <Edit3 size={15} />
            {isEditing
              ? (pf.cancelEditingBtn || 'Cancel Editing')
              : (pf.editProfileBtn || 'Edit Profile & Story')}
          </button>
        </div>

        {!isEditing ? (
          <div>
            <div className="artisan-profile-main">
              <img
                src={artisan.avatar || MOCK_ARTISAN.avatar}
                alt={artisan.name}
                className="artisan-profile-avatar"
              />

              <div className="artisan-profile-info">
                <h1>{artisan.name || fullName || 'Artisan'}</h1>
                <p className="artisan-profile-craft">
                  {artisan.craft || 'Artisan'}
                </p>

                <div className="artisan-profile-meta">
                  <span>
                    <MapPin size={16} />
                    {artisan.region || st.locationMissing || 'Location not added'}
                  </span>

                  <span>
                    <Calendar size={16} />
                    {artisan.experience || st.experienceMissing || 'Experience not added'}{' '}
                    {st.heritagePractice || pf.heritagePractice || 'Heritage Practice'}
                  </span>

                  <span>
                    <Star size={16} fill="#d97706" />
                    {artisan.rating || 0} (
                    {artisan.total_sales || 0}{' '}
                    {pf.craftSales || 'craft sales'})
                  </span>
                </div>
              </div>
            </div>

            <div className="artisan-profile-story">
              <div className="artisan-profile-story-heading">
                <h3>
                  {pf.ancestralStory || 'Artisan Story & Ancestral Tradition'}
                </h3>
                <span>{st.language || "Language"}: {detectedBioLang.toUpperCase()}</span>
              </div>

              <p>{artisan.bio || st.noStory || 'No artisan story added yet.'}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="artisan-profile-form">
            <div className="artisan-profile-form-grid">
              <div className="form-group">
                <label className="form-label">{pf.artisanName || "Artisan Name"} *</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={pf.artisanName || "Artisan Name"}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{pf.craftSpecialization || "Craft & Specialization"} *</label>
                <input
                  type="text"
                  className="form-input"
                  value={craft}
                  onChange={e => setCraft(e.target.value)}
                  placeholder={st.craftPlaceholder || "e.g. Terracotta, Silk Weaving"}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{pf.regionVillage || "Region / Village / State"} *</label>
                <input
                  type="text"
                  className="form-input"
                  value={region}
                  onChange={e => setRegion(e.target.value)}
                  placeholder={st.regionPlaceholder || "e.g. Karnataka, India"}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {pf.experienceYears || "Heritage Practice / Experience"}
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={experience}
                  onChange={e => setExperience(e.target.value)}
                  placeholder={st.experiencePlaceholder || "e.g. 28 years"}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{st.imageUrl || pf.profileImageUrl || "Profile Image URL"}</label>
              <input
                type="url"
                className="form-input"
                value={avatar}
                onChange={e => setAvatar(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="artisan-profile-voice">
              <VoiceTextInput
                id="artisan-story"
                label={st.storyLabel || "Artisan Heritage Story & Biography"}
                placeholder={st.storyPlaceholder || "Speak or type your ancestral story, training, techniques and personal journey..."}
                value={bio}
                onChange={setBio}
                rows={5}
                required
                defaultLang={detectedBioLang}
              />
            </div>

            <div className="artisan-profile-form-actions">
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? (
                  (st.saving || "Saving Profile...")
                ) : (
                  <>
                    <Save size={16} />
                    {st.saveChanges || "Save Profile Changes"}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn btn-secondary"
                disabled={saving}
              >
                {st.cancel || "Cancel"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ARTISAN PRODUCTS */}
      <section className="artisan-products-section">
        <div className="artisan-products-header">
          <div>
            <h2>
              {(st.studioTitle || "Masterpieces from {name}'s Studio").replace('{name}', artisan.name || 'Your')} ({products.length})
            </h2>
            <p>
              {st.studioDesc || "Your handmade creations listed on the KalaSetu marketplace."}
            </p>
          </div>

          <Link to="/add-product" className="btn btn-primary btn-sm">
            <PlusCircle size={16} />
            {st.addCraft || pf.addNewCraft || "Add New Craft"}
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="card artisan-products-empty">
            <ShoppingBag size={40} />
            <h3>{st.noCrafts || pf.noCraftsListed || "No crafts listed yet"}</h3>
            <p>{st.noCraftsDesc || "List your first craft to start receiving buyer enquiries."}</p>
            <Link to="/add-product" className="btn btn-primary">
              {st.listFirst || pf.listFirstCraft || "List Your First Craft"}
            </Link>
          </div>
        ) : (
          <div className="product-grid">
            {products.map(product => (
              <div key={product.id} style={{ position: 'relative' }}>
                <ProductCard product={product} />

                <div className="artisan-product-actions">
                  <Link
                    to={`/edit-product/${product.id}`}
                    className="btn btn-secondary btn-sm"
                  >
                    <Edit3 size={13} />
                    {st.edit || pf.editCraft || "Edit"}
                  </Link>

                  <button
                    type="button"
                    onClick={e => handleDeleteProduct(product.id, e)}
                    className="btn btn-sm artisan-product-delete"
                  >
                    <Trash2 size={13} />
                    {st.delete || pf.deleteCraft || "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* BUYER ENQUIRIES */}
      <section className="artisan-enquiries-section">
        <div className="artisan-enquiries-header">
          <div>
            <h2>
              <MessageSquare size={22} />
              {st.buyerEnquiries || "Buyer Enquiries"}
            </h2>
            <p>
              {st.enquiryDesc || "Review, approve or reject enquiries received for your crafts."}
            </p>
          </div>
        </div>

        {/* ENQUIRY COUNTS */}
        <div className="artisan-enquiry-stats">
          <div className="artisan-enquiry-stat">
            <span>{st.totalEnquiries || "Total Enquiries"}</span>
            <strong>{enquiries.length}</strong>
          </div>

          <div className="artisan-enquiry-stat">
            <span>{st.pending || "Pending"}</span>
            <strong>{pendingCount}</strong>
          </div>

          <div className="artisan-enquiry-stat">
            <span>{st.approved || "Approved"}</span>
            <strong>{approvedCount}</strong>
          </div>

          <div className="artisan-enquiry-stat">
            <span>{st.rejected || "Rejected"}</span>
            <strong>{rejectedCount}</strong>
          </div>
        </div>

        {enquiryError && (
          <div className="artisan-profile-error">
            <AlertCircle size={18} />
            {enquiryError}
          </div>
        )}

        {/* FILTERS */}
        <div className="artisan-enquiry-filters">
          {[
            ['all', (st.all || 'All') + ' (' + enquiries.length + ')'],
            ['pending', (st.pending || 'Pending') + ' (' + pendingCount + ')'],
            ['approved', (st.approved || 'Approved') + ' (' + approvedCount + ')'],
            ['rejected', (st.rejected || 'Rejected') + ' (' + rejectedCount + ')']
          ].map(([filter, label]) => (
            <button
              key={filter}
              type="button"
              className={enquiryFilter === filter ? 'active' : ''}
              onClick={() => setEnquiryFilter(filter)}
            >
              {label}
            </button>
          ))}
        </div>

        {filteredEnquiries.length === 0 ? (
          <div className="artisan-enquiries-empty">
            <MessageSquare size={38} />
            <h3>
              {enquiries.length === 0
                ? (st.noEnquiries || 'No buyer enquiries yet')
                : (st.noCategory || 'No enquiries in this category')}
            </h3>
            <p>
              {enquiries.length === 0
                ? (st.noEnquiriesDesc || 'When buyers contact you about your products, their enquiries will appear here.')
                : (st.tryFilter || 'Try selecting another enquiry filter.')}
            </p>
          </div>
        ) : (
          <div className="artisan-enquiries-list">
            {filteredEnquiries.map(enquiry => {
              const status = enquiry.status || 'pending';
              const isUpdating = updatingEnquiryId === enquiry.id;

              return (
                <article className="artisan-enquiry-card" key={enquiry.id}>
                  <div className="artisan-enquiry-card-header">
                    <div className="artisan-enquiry-buyer">
                      <div className="artisan-enquiry-avatar">
                        {enquiry.buyer_name?.charAt(0)?.toUpperCase() || 'B'}
                      </div>

                      <div>
                        <h3>{enquiry.buyer_name || st.buyer || 'Buyer'}</h3>
                        <span>
                          {enquiry.created_at
                            ? new Date(enquiry.created_at).toLocaleString('en-IN')
                            : (st.dateUnavailable || 'Date unavailable')}
                        </span>
                      </div>
                    </div>

                    <span className={`artisan-enquiry-status ${status}`}>
                      {status === 'approved' ? (
                        <><CheckCircle2 size={13} /> {st.approveStatus}</>
                      ) : status === 'rejected' ? (
                        <><XCircle size={13} /> {st.rejectStatus}</>
                      ) : (
                        <><Clock size={13} /> {getStatusLabel(status)}</>
                      )}
                    </span>
                  </div>

                  <div className="artisan-enquiry-product">
                    <Package size={17} />
                    <span>
                      {st.product || "Product"}: <strong>{enquiry.product_title}</strong>
                    </span>
                  </div>

                  <div className="artisan-enquiry-contact-grid">
                    <div>
                      <Mail size={16} />
                      <span>{enquiry.buyer_email || (st.notProvided || 'Not provided')}</span>
                    </div>

                    <div>
                      <Phone size={16} />
                      <span>{enquiry.phone || (st.notProvided || 'Not provided')}</span>
                    </div>

                    <div>
                      <MapPinned size={16} />
                      <span>
                        {enquiry.buyer_location || st.locationNotProvided || 'Location not provided'}
                      </span>
                    </div>

                    <div>
                      <ShoppingBag size={16} />
                      <span>{st.quantity || "Quantity"}: {enquiry.quantity || '1'}</span>
                    </div>
                  </div>

                  <div className="artisan-enquiry-message">
                    <strong>{st.buyerMessage || "Buyer's Message"}</strong>
                    <p>{enquiry.message}</p>
                  </div>

                  {/* APPROVE / REJECT ACTIONS */}
                  <div className="artisan-enquiry-decision-actions">
                    {status !== 'approved' && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={isUpdating}
                        onClick={() => handleEnquiryStatus(enquiry, 'approved')}
                      >
                        <CheckCircle2 size={15} />
                        {isUpdating ? (st.updating || 'Updating...') : (st.approve || 'Approve Enquiry')}
                      </button>
                    )}

                    {status !== 'rejected' && (
                      <button
                        type="button"
                        className="btn btn-secondary artisan-enquiry-reject"
                        disabled={isUpdating}
                        onClick={() => handleEnquiryStatus(enquiry, 'rejected')}
                      >
                        <XCircle size={15} />
                        {isUpdating ? (st.updating || 'Updating...') : (st.reject || 'Reject Enquiry')}
                      </button>
                    )}
                  </div>

                  {enquiry.reply && (
                    <div className="artisan-enquiry-existing-reply">
                      <div>
                        <CheckCircle2 size={17} />
                        <strong>{st.yourReply || "Your Reply"}</strong>
                      </div>
                      <p>{enquiry.reply}</p>
                    </div>
                  )}

                  <div className="artisan-enquiry-reply-form">
                    <label className="form-label">{st.replyToBuyer || "Reply to Buyer"}</label>

                    <textarea
                      className="form-textarea"
                      rows={3}
                      placeholder={st.replyPlaceholder || "Write your response about availability, pricing, delivery or customization..."}
                      value={replyDrafts[enquiry.id] || ''}
                      onChange={e =>
                        setReplyDrafts(previous => ({
                          ...previous,
                          [enquiry.id]: e.target.value
                        }))
                      }
                    />

                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={replyingId === enquiry.id}
                      onClick={() => handleReply(enquiry)}
                    >
                      <Send size={15} />
                      {replyingId === enquiry.id
                        ? (st.sending || 'Sending Reply...')
                        : (st.sendReply || 'Send Reply')}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}





