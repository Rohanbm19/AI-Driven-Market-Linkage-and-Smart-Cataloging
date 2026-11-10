import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin } from 'lucide-react';
import Badge from './Badge.jsx';
import { useLanguage } from '../i18n/index.js';

export default function ProductCard({ product }) {
  const { t } = useLanguage();
  const {
    id,
    title,
    price,
    artisan_name,
    region,
    image_url,
    description,
    is_verified,
    fair_trade,
    tags = []
  } = product || {};

  return (
    <div className="product-card">
      <div className="product-card-img-wrapper">
        <img
          src={image_url || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=480&q=80'}
          alt={title || 'Craft'}
          className="product-card-img"
          loading="eager"
        />
        <div className="product-card-badges">
          {tags[0] && <Badge type="craft">{tags[0]}</Badge>}
          {fair_trade && <Badge type="verified">{t?.product?.fairPrice || 'Fair Trade'}</Badge>}
        </div>
      </div>

      <div className="product-card-body">
        <div className="product-artisan">
          <MapPin size={13} />
          <span>{region || 'India'}</span>
          {is_verified && <ShieldCheck size={14} color="#059669" title="Verified Artisan" />}
        </div>

        <h3 className="product-title">
          <Link
            to={`/product/${id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            {title || 'Untitled Craft'}
          </Link>
        </h3>

        <p className="product-desc">{description}</p>

        <div className="product-card-footer">
          <div>
            <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block' }}>
              {t?.product?.artisan || 'Crafted by'}: {artisan_name || 'Master Artisan'}
            </span>
            <span className="product-price">₹{Number(price || 0).toLocaleString('en-IN')}</span>
          </div>

          <Link to={`/product/${id}`} className="btn btn-primary btn-sm">
            {t?.product?.viewBtn || 'View Craft'}
          </Link>
        </div>
      </div>
    </div>
  );
}