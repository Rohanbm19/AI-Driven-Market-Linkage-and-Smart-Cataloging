import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin, Sparkles } from 'lucide-react';
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
    category,
    image_url,
    description,
    is_verified,
    fair_trade,
    tags = []
  } = product;

  return (
    <div className="product-card">
      <div className="product-card-img-wrapper">
        <img
          src={image_url}
          alt={title}
          className="product-card-img"
          loading="lazy"
        />
        <div className="product-card-badges">
          {tags[0] && <Badge type="craft">{tags[0]}</Badge>}
          {fair_trade && <Badge type="verified">{t?.product?.fairPrice || 'Fair Trade'}</Badge>}
        </div>
      </div>

      <div className="product-card-body">
        <div className="product-artisan">
          <MapPin size={13} />
          <span>{region}</span>
          {is_verified && <ShieldCheck size={14} color="#059669" title="Verified Artisan" />}
        </div>

        <h3 className="product-title">
          <Link
            to={`/product/${id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            {title}
          </Link>
        </h3>

        <p className="product-desc">{description}</p>

        <div className="product-card-footer">
          <div>
            <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block' }}>
              {t?.product?.artisan || 'Crafted by'}: {artisan_name}
            </span>
            <span className="product-price">₹{price.toLocaleString('en-IN')}</span>
          </div>

          <Link to={`/product/${id}`} className="btn btn-primary btn-sm">
            {t?.product?.viewBtn || 'View Craft'}
          </Link>
        </div>
      </div>
    </div>
  );
}
