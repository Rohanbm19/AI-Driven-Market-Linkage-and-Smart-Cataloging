import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import Marketplace from './pages/Marketplace.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import AddProduct from './pages/AddProduct.jsx';
import ImageEnhancer from './pages/ImageEnhancer.jsx';
import Assistant from './pages/Assistant.jsx';
import MarketInsights from './pages/MarketInsights.jsx';
import Enquiries from './pages/Enquiries.jsx';
import ArtisanProfile from './pages/ArtisanProfile.jsx';
import Login from './pages/Login.jsx';

export default function App() {
  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Marketplace />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/add-product" element={<AddProduct />} />
          <Route path="/edit-product/:id" element={<AddProduct />} />
          <Route path="/image-enhancer" element={<ImageEnhancer />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/market-insights" element={<MarketInsights />} />
          <Route path="/enquiries" element={<Enquiries />} />
          <Route path="/artisan-profile" element={<ArtisanProfile />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>

      <footer
        style={{
          borderTop: '1px solid var(--border-color)',
          background: 'white',
          padding: '2.5rem 1.5rem',
          marginTop: 'auto',
          fontSize: '0.9rem',
          color: 'var(--text-muted)'
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div>
            <strong style={{ color: 'var(--primary)', fontSize: '1.05rem', fontFamily: 'var(--font-serif)' }}>
              कलासेतु • KalaSetu
            </strong>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.84rem' }}>
              AI-Driven Market Linkage & Smart Cataloging for Rural Artisans & Traditional Crafts.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.84rem' }}>
            <span>Fair Trade Direct</span>
            <span>•</span>
            <span>Multilingual Speech AI</span>
            <span>•</span>
            <span>GI Tag Protection</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
