
import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin } from 'lucide-react';
import Badge from './Badge.jsx';
import { useLanguage } from '../i18n/index.js';
import { getLocalizedProduct } from '../i18n/productTranslations.js';

export default function ProductCard({ product }) {
  const { t, lang } = useLanguage();

  // Get product details in the selected language
  const localizedProduct = getLocalizedProduct(product, lang);

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
  } = localizedProduct || {};

  // Translated UI labels
  const productText = t?.product || {};

  return (
    <div className="product-card">

      {/* Product Image */}
      <div className="product-card-img-wrapper">
        <img
          src={
            image_url ||
            'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=480&q=80'
          }
          alt={title || productText.craft || 'Craft'}
          className="product-card-img"
          loading="eager"
        />

        {/* Product Badges */}
        <div className="product-card-badges">
          {tags[0] && (
            <Badge type="craft">
              {tags[0]}
            </Badge>
          )}

          {fair_trade && (
            <Badge type="verified">
              {productText.fairPrice || 'Fair Trade'}
            </Badge>
          )}
        </div>
      </div>

      {/* Product Information */}
      <div className="product-card-body">

        {/* Region and Verification */}
        <div className="product-artisan">
          <MapPin size={13} />

          <span>
            {region || productText.defaultRegion || 'India'}
          </span>

          {is_verified && (
            <ShieldCheck
              size={14}
              color="#059669"
              title={productText.verified || 'Verified Artisan'}
            />
          )}
        </div>

        {/* Product Title */}
        <h3 className="product-title">
          <Link
            to={`/product/${id}`}
            style={{
              textDecoration: 'none',
              color: 'inherit'
            }}
          >
            {title || productText.untitled || 'Untitled Craft'}
          </Link>
        </h3>

        {/* Product Description */}
        <p className="product-desc">
          {description || productText.noDescription || ''}
        </p>

        {/* Product Footer */}
        <div className="product-card-footer">

          <div>
            <span
              style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                display: 'block'
              }}
            >
              {productText.artisan || 'Crafted by'}:{' '}
              {artisan_name || productText.defaultArtisan || 'Master Artisan'}
            </span>

            {/* Product Price */}
            <span className="product-price">
              ₹{Number(price || 0).toLocaleString('en-IN')}
            </span>
          </div>

          {/* View Product Button */}
          <Link
            to={`/product/${id}`}
            className="btn btn-primary btn-sm"
          >
            {productText.viewBtn || 'View Craft'}
          </Link>

        </div>
      </div>
    </div>
  );
}
