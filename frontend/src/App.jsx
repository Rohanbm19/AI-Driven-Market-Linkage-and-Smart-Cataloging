import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import Logo from './components/Logo.jsx';
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
          <Route path="/image-enhancer" element={<ImageEnhancer />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/market-insights" element={<MarketInsights />} />
          <Route path="/enquiries" element={<Enquiries />} />
          <Route path="/artisan-profile" element={<ArtisanProfile />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>

      <footer className="kalasetu-footer">
        <div className="footer-inner">
          <div className="footer-brand-col">
            <Logo
              tagline="Crafts • Culture • Connect"
              size={36}
            />
            <p className="footer-desc">
              AI-Driven Market Linkage & Smart Cataloging platform directly connecting Indian traditional master artisans with global collectors and conscious buyers.
            </p>
          </div>
          <div className="footer-meta-col">
            <div className="footer-badges">
              <span className="footer-badge">Fair Trade Direct</span>
              <span className="footer-dot">•</span>
              <span className="footer-badge">Multilingual Voice AI</span>
              <span className="footer-dot">•</span>
              <span className="footer-badge">GI Tag Protection</span>
            </div>
            <p className="footer-copyright">
              © {new Date().getFullYear()} KalaSetu. Preserving Heritage. Unlocking Global Markets.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
