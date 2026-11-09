import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Award,
  MapPin,
  Calendar,
  Star,
  ShoppingBag,
  Heart,
  Share2,
  Edit3,
  Check,
  AlertCircle,
  PlusCircle,
  Sparkles,
  Save,
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api, MOCK_ARTISAN } from '../services/api.js';
import ProductCard from '../components/ProductCard.jsx';
import Badge from '../components/Badge.jsx';
import VoiceTextInput from '../components/VoiceTextInput.jsx';
import { detectLanguage } from '../utils/detectLanguage.js';
import { useLanguage } from '../i18n/index.jsx';

export default function ArtisanProfile() {
  const { t, lang } = useLanguage();
  const pf = t?.profile || {};
  const [artisan, setArtisan] = useState(MOCK_ARTISAN);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Editable Profile Form State
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(MOCK_ARTISAN.name);
  const [craft, setCraft] = useState(MOCK_ARTISAN.craft);
  const [region, setRegion] = useState(MOCK_ARTISAN.region);
  const [experience, setExperience] = useState(MOCK_ARTISAN.experience);
  const [avatar, setAvatar] = useState(MOCK_ARTISAN.avatar);
  const [bio, setBio] = useState(MOCK_ARTISAN.bio);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // Load Artisan Data & Products
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [loadedArtisan, allProducts] = await Promise.all([
          api.getArtisanProfile('art-1'),
          api.getProducts()
        ]);

        if (isMounted) {
          const profile = loadedArtisan || MOCK_ARTISAN;
          setArtisan(profile);
          setName(profile.name || '');
          setCraft(profile.craft || '');
          setRegion(profile.region || '');
          setExperience(profile.experience || '');
          setAvatar(profile.avatar || '');
          setBio(profile.bio || '');

          const artisanProducts = allProducts.filter(
            (p) => p.artisan_id === profile.id || p.artisan_name === profile.name || p.category === 'pottery'
          );
          setProducts(artisanProducts.length > 0 ? artisanProducts : allProducts.slice(0, 4));
        }
      } catch (err) {
        console.error('Failed to load artisan profile:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

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

      const result = await api.updateArtisanProfile(artisan.id, payload);

      if (result.success) {
        setArtisan(result.data);
        setIsEditing(false);
        setSaveSuccess(
          result.savedInSupabase
            ? 'Profile updated and saved to Supabase cloud database!'
            : 'Profile updated and saved locally in your browser!'
        );
        confetti({
          particleCount: 60,
          spread: 55,
          origin: { y: 0.6 }
        });
      } else {
        setSaveError('Failed to save profile changes. Please try again.');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setSaveError(err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (productId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this craft item?')) return;

    try {
      await api.deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      alert('Could not delete product: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem auto' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading artisan profile...</p>
      </div>
    );
  }

  const detectedBioLang = detectLanguage(bio);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Success Notification */}
      {saveSuccess && (
        <div
          style={{
            marginBottom: '1.25rem',
            padding: '0.85rem 1.25rem',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: 'var(--radius-md)',
            color: '#065f46',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Check size={18} />
            <span style={{ fontWeight: 600 }}>{saveSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccess('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065f46' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Notification */}
      {saveError && (
        <div
          style={{
            marginBottom: '1.25rem',
            padding: '0.85rem 1.25rem',
            background: '#fef2f2',
            border: '1px solid #fee2e2',
            borderRadius: 'var(--radius-md)',
            color: '#b91c1c',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <AlertCircle size={18} />
          <span>{saveError}</span>
        </div>
      )}

      {/* Profile Header Card */}
      <div
        className="card"
        style={{
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #ffffff 0%, #faf8f5 100%)',
          border: '1px solid var(--border-color)'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(artisan.badges || ['Master Craftsman', 'Fair Trade Certified', 'GI Custodian']).map((b) => (
              <Badge key={b} type="verified">
                {b}
              </Badge>
            ))}
          </div>

          <button
            id="edit-profile-btn"
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`btn btn-sm ${isEditing ? 'btn-secondary' : 'btn-primary'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
          >
            <Edit3 size={15} />
            <span>{isEditing ? (pf.cancelEditingBtn || 'Cancel Editing') : (pf.editProfileBtn || 'Edit Profile & Story')}</span>
          </button>
        </div>

        {/* View Mode vs Edit Mode */}
        {!isEditing ? (
          <div>
            <div
              style={{
                display: 'flex',
                gap: '2rem',
                alignItems: 'center',
                flexWrap: 'wrap'
              }}
            >
              <img
                src={artisan.avatar}
                alt={artisan.name}
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '4px solid white',
                  boxShadow: 'var(--shadow-md)'
                }}
              />

              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 0.35rem 0' }}>
                  {artisan.name}
                </h1>

                <p
                  style={{
                    color: 'var(--primary)',
                    fontWeight: 600,
                    margin: '0 0 0.75rem 0',
                    fontSize: '1.05rem'
                  }}
                >
                  {artisan.craft}
                </p>

                <div
                  style={{
                    display: 'flex',
                    gap: '1.5rem',
                    color: 'var(--text-muted)',
                    fontSize: '0.88rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MapPin size={16} color="var(--primary)" />
                    {artisan.region}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={16} />
                    {artisan.experience} {pf.heritagePractice || 'Heritage Practice'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#d97706', fontWeight: 600 }}>
                    <Star size={16} fill="#d97706" />
                    {artisan.rating || 4.9} ({artisan.total_sales || 342} {pf.craftSales || 'craft sales'})
                  </span>
                </div>
              </div>
            </div>

            {/* Heritage Story Section */}
            <div style={{ marginTop: '1.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', margin: 0 }}>
                  {pf.ancestralStory || 'Artisan Story & Ancestral Tradition'}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Language: {detectedBioLang.toUpperCase()}
                </span>
              </div>
              <p style={{ color: '#4b5563', lineHeight: 1.7, maxWidth: '900px', whiteSpace: 'pre-line', fontSize: '0.96rem' }}>
                {artisan.bio}
              </p>
            </div>
          </div>
        ) : (
          /* Editable Form with Multilingual Voice Dictation */
          <form onSubmit={handleSaveProfile} style={{ marginTop: '0.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Artisan Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Master Craftsman Name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Craft & Specialization *</label>
                <input
                  type="text"
                  className="form-input"
                  value={craft}
                  onChange={(e) => setCraft(e.target.value)}
                  placeholder="e.g. Terracotta & Clay Sculpting, Silk Weaving"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Region / Village / State *</label>
                <input
                  type="text"
                  className="form-input"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="e.g. Bishnupur, West Bengal"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Heritage Practice / Years of Experience</label>
                <input
                  type="text"
                  className="form-input"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="e.g. 28 years, 3rd Generation"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Profile Image URL</label>
              <input
                type="url"
                className="form-input"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Tip: Paste any web image URL for your profile picture.
              </span>
            </div>

            {/* Multilingual Voice-to-Text Component for Artisan Bio */}
            <div style={{ marginBottom: '1.5rem', background: '#ffffff', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <VoiceTextInput
                id="artisan-story"
                label="Artisan Heritage Story & Biography (Speak or Type in your Native Tongue)"
                placeholder="Speak or type your ancestral lineage, training, unique clay or loom techniques, awards, or personal journey..."
                value={bio}
                onChange={(newVal) => setBio(newVal)}
                rows={5}
                required
                defaultLang={detectedBioLang}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button
                id="save-profile-btn"
                type="submit"
                disabled={saving}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', minWidth: '150px' }}
              >
                {saving ? (
                  <>
                    <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn btn-secondary"
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Artisan's Crafts Showcase */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
              Masterpieces from {artisan.name}'s Studio ({products.length})
            </h2>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Authentic GI-certified and fair-trade handmade creations directly linked to buyers.
            </p>
          </div>

          <Link
            to="/add-product"
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
          >
            <PlusCircle size={16} />
            <span>Add New Craft</span>
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <ShoppingBag size={40} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
            <h3>No crafts listed yet</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              List your first craft using voice dictation and AI pricing assistance.
            </p>
            <Link to="/add-product" className="btn btn-primary">
              List Your First Craft
            </Link>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <div key={product.id} style={{ position: 'relative' }}>
                <ProductCard product={product} />

                {/* Edit / Delete quick controls overlay */}
                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    justifyContent: 'flex-end',
                    marginTop: '0.5rem'
                  }}
                >
                  <Link
                    to={`/edit-product/${product.id}`}
                    className="btn btn-secondary btn-sm"
                    style={{
                      fontSize: '0.78rem',
                      padding: '0.3rem 0.6rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      textDecoration: 'none'
                    }}
                  >
                    <Edit3 size={13} /> Edit
                  </Link>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteProduct(product.id, e)}
                    className="btn btn-sm"
                    style={{
                      fontSize: '0.78rem',
                      padding: '0.3rem 0.6rem',
                      background: '#fee2e2',
                      color: '#b91c1c',
                      border: '1px solid #fecaca',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)'
                    }}
                    title="Delete product"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
