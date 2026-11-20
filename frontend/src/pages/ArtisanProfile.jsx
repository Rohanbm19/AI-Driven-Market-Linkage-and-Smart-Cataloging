
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Star,
  ShoppingBag,
  Edit3,
  AlertCircle,
  PlusCircle,
  Save,
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { api, MOCK_ARTISAN } from '../services/api.js';
import ProductCard from '../components/ProductCard.jsx';
import Badge from '../components/Badge.jsx';
import VoiceTextInput from '../components/VoiceTextInput.jsx';
import { detectLanguage } from '../utils/detectLanguage.js';
import { useLanguage } from '../i18n/index.js';

export default function ArtisanProfile() {
  const { t, lang } = useLanguage();
  const pf = t?.profile || {};

  const [artisan, setArtisan] = useState(null);
  const [sourceArtisan, setSourceArtisan] = useState(null);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState('');

  const [isEditing, setIsEditing] = useState(false);

  const [name, setName] = useState('');
  const [craft, setCraft] = useState('');
  const [region, setRegion] = useState('');
  const [experience, setExperience] = useState('');
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const languageRequest = useRef(0);

  // Load the original profile for editing.
  useEffect(() => {
    let active = true;

    async function loadOriginalProfile() {
      try {
        const profile = await api.getArtisanProfile('art-1', 'en');

        if (!active || !profile) return;

        setSourceArtisan(profile);

        setName(profile.name || '');
        setCraft(profile.craft || '');
        setRegion(profile.region || '');
        setExperience(profile.experience || '');
        setAvatar(profile.avatar || '');
        setBio(profile.bio || '');
      } catch (error) {
        console.error('Original artisan profile error:', error);

        if (active) {
          setProfileError(error.message || 'Unable to load artisan profile.');
        }
      }
    }

    loadOriginalProfile();

    return () => {
      active = false;
    };
  }, []);

  // Load the profile in the currently selected language.
  useEffect(() => {
    let active = true;
    const requestId = ++languageRequest.current;

    async function loadLocalizedProfile() {
      setLoading(true);
      setProfileError('');

      try {
        const profile = await api.getArtisanProfile('art-1', lang);

        if (!active || requestId !== languageRequest.current) return;

        setArtisan(profile);
      } catch (error) {
        console.error('Localized artisan profile error:', error);

        if (!active || requestId !== languageRequest.current) return;

        setProfileError(
          error.message || 'Unable to load translated artisan profile.'
        );

        // Do not silently display English content in another language.
        setArtisan(null);
      } finally {
        if (active && requestId === languageRequest.current) {
          setLoading(false);
        }
      }
    }

    loadLocalizedProfile();

    return () => {
      active = false;
    };
  }, [lang]);

  // Load products in the selected language.
  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        const allProducts = await api.getProducts(lang);

        if (!active) return;

        const artisanId = sourceArtisan?.id || 'art-1';

        const artisanProducts = allProducts.filter(
          (product) => product.artisan_id === artisanId
        );

        setProducts(artisanProducts);
      } catch (error) {
        console.error('Product loading error:', error);

        if (active) setProducts([]);
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, [lang, sourceArtisan?.id]);

  const resetEditForm = () => {
    if (!sourceArtisan) return;

    setName(sourceArtisan.name || '');
    setCraft(sourceArtisan.craft || '');
    setRegion(sourceArtisan.region || '');
    setExperience(sourceArtisan.experience || '');
    setAvatar(sourceArtisan.avatar || '');
    setBio(sourceArtisan.bio || '');
    setSaveError('');
  };

  const handleCancelEditing = () => {
    resetEditForm();
    setIsEditing(false);
  };

  // Save original artisan information.
  const handleSaveProfile = async (event) => {
    event.preventDefault();

    if (!sourceArtisan) return;

    setSaving(true);
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

      const result = await api.updateArtisanProfile(
        sourceArtisan.id,
        payload
      );

      if (!result.success || !result.data) {
        throw new Error('Profile could not be saved.');
      }

      setSourceArtisan(result.data);

      setName(result.data.name || '');
      setCraft(result.data.craft || '');
      setRegion(result.data.region || '');
      setExperience(result.data.experience || '');
      setAvatar(result.data.avatar || '');
      setBio(result.data.bio || '');

      // Request fresh localized data after saving.
      const localizedProfile = await api.getArtisanProfile(
        result.data.id,
        lang
      );

      setArtisan(localizedProfile);

      setIsEditing(false);

      confetti({
        particleCount: 60,
        spread: 55,
        origin: { y: 0.6 }
      });
    } catch (error) {
      console.error('Profile save error:', error);
      setSaveError(error.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (productId, event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!window.confirm(pf.deleteCraft || 'Delete')) return;

    try {
      await api.deleteProduct(productId);

      setProducts((previous) =>
        previous.filter((product) => product.id !== productId)
      );
    } catch (error) {
      console.error('Product deletion error:', error);
      window.alert(error.message || 'Could not delete product.');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div
          className="spinner"
          style={{ margin: '0 auto 1rem auto' }}
        />
        <p style={{ color: 'var(--text-muted)' }}>
          {pf.loadingProfile || 'Loading artisan profile...'}
        </p>
      </div>
    );
  }

  if (!artisan) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <AlertCircle size={32} />
        <h3>{profileError || 'Unable to load artisan profile.'}</h3>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  const detectedBioLang = detectLanguage(bio);

  // These values come directly from the localized API response.
  const badges = Array.isArray(artisan.badges)
    ? artisan.badges
    : [];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
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
            {badges.map((badge, index) => (
              <Badge key={`${index}-${badge}`} type="verified">
                {badge}
              </Badge>
            ))}
          </div>

          <button
            id="edit-profile-btn"
            type="button"
            onClick={() => {
              if (isEditing) {
                handleCancelEditing();
              } else {
                setSaveError('');
                setIsEditing(true);
              }
            }}
            className={`btn btn-sm ${
              isEditing ? 'btn-secondary' : 'btn-primary'
            }`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer'
            }}
          >
            <Edit3 size={15} />
            <span>
              {isEditing ? pf.cancelEditingBtn : pf.editProfileBtn}
            </span>
          </button>
        </div>

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
                src={artisan.avatar || MOCK_ARTISAN.avatar}
                alt={artisan.name || 'Artisan'}
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
                    {artisan.experience} {pf.heritagePractice}
                  </span>

                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      color: '#d97706',
                      fontWeight: 600
                    }}
                  >
                    <Star size={16} fill="#d97706" />
                    {artisan.rating || 4.9} ({artisan.total_sales || 342} {pf.craftSales})
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: '1.75rem',
                borderTop: '1px solid var(--border-color)',
                paddingTop: '1.25rem'
              }}
            >
              <h3 style={{ fontSize: '1.15rem', margin: '0 0 0.5rem 0' }}>
                {pf.ancestralStory}
              </h3>

              <p
                style={{
                  color: '#4b5563',
                  lineHeight: 1.7,
                  maxWidth: '900px',
                  whiteSpace: 'pre-line',
                  fontSize: '0.96rem'
                }}
              >
                {artisan.bio}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} style={{ marginTop: '0.5rem' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.25rem',
                marginBottom: '1.25rem'
              }}
            >
              <div className="form-group">
                <label className="form-label">{pf.artisanName} *</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{pf.craftSpecialization} *</label>
                <input
                  type="text"
                  className="form-input"
                  value={craft}
                  onChange={(event) => setCraft(event.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{pf.regionVillage} *</label>
                <input
                  type="text"
                  className="form-input"
                  value={region}
                  onChange={(event) => setRegion(event.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{pf.experienceYears}</label>
                <input
                  type="text"
                  className="form-input"
                  value={experience}
                  onChange={(event) => setExperience(event.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">{pf.profileImageUrl}</label>
              <input
                type="url"
                className="form-input"
                value={avatar}
                onChange={(event) => setAvatar(event.target.value)}
              />
            </div>

            <div
              style={{
                marginBottom: '1.5rem',
                background: '#ffffff',
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)'
              }}
            >
              <VoiceTextInput
                id="artisan-story"
                label={pf.bioStoryLabel}
                placeholder={pf.bioStoryPlaceholder}
                value={bio}
                onChange={setBio}
                rows={5}
                required
                defaultLang={detectedBioLang}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                id="save-profile-btn"
                type="submit"
                disabled={saving}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  minWidth: '150px'
                }}
              >
                {saving ? (
                  <>
                    <span
                      className="spinner"
                      style={{ width: '16px', height: '16px', borderWidth: '2px' }}
                    />
                    <span>{pf.savingBtn}</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>{pf.saveBtn}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCancelEditing}
                className="btn btn-secondary"
                disabled={saving}
              >
                {pf.cancelBtn}
              </button>
            </div>
          </form>
        )}
      </div>

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
              {pf.studioCraftsTitle} ({products.length})
            </h2>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              {pf.studioCraftsDesc}
            </p>
          </div>

          <Link
            to="/add-product"
            className="btn btn-primary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              textDecoration: 'none'
            }}
          >
            <PlusCircle size={16} />
            <span>{pf.addNewCraft}</span>
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <ShoppingBag
              size={40}
              style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }}
            />
            <h3>{pf.noCraftsListed}</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              {pf.studioCraftsDesc}
            </p>
            <Link to="/add-product" className="btn btn-primary">
              {pf.listFirstCraft}
            </Link>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <div key={product.id} style={{ position: 'relative' }}>
                <ProductCard product={product} />

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
                    <Edit3 size={13} />
                    {pf.editCraft}
                  </Link>

                  <button
                    type="button"
                    onClick={(event) => handleDeleteProduct(product.id, event)}
                    className="btn btn-sm"
                    title={pf.deleteCraft}
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
                  >
                    <Trash2 size={13} />
                    {pf.deleteCraft}
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
