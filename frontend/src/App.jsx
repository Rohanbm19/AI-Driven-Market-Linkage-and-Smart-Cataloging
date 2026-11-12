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
import { useLanguage } from './i18n/index.js';

export default function App() {
  const { t } = useLanguage();
  const f = t.footer || {};
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
              tagline={f.logoTagline}
              size={36}
            />
            <p className="footer-desc">{f.desc}</p>
          </div>
          <div className="footer-meta-col">
            <div className="footer-badges">
              <span className="footer-badge">{f.fairTrade}</span>
              <span className="footer-dot">•</span>
              <span className="footer-badge">{f.voiceAi}</span>
              <span className="footer-dot">•</span>
              <span className="footer-badge">{f.giTag}</span>
            </div>
            <p className="footer-copyright">
              © {new Date().getFullYear()} {f.copyright}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
