import React from 'react';
import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import Header from './components/Header.jsx';
import Logo from './components/Logo.jsx';
import Marketplace from './pages/Marketplace.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import AddProduct from './pages/AddProduct.jsx';
import Assistant from './pages/Assistant.jsx';
import MarketInsights from './pages/MarketInsights.jsx';
import ArtisanProfile from './pages/ArtisanProfile.jsx';
import Login from './pages/Login.jsx';
import { useLanguage } from './i18n/index.jsx';

import RequireArtisan from './components/RequireArtisan.jsx';
import RequireBuyer from './components/RequireBuyer.jsx';
import BuyerProfile from './pages/BuyerProfile.jsx';
function LegacyLogin() {
  const [params] = useSearchParams();
  const role = params.get('role') === 'artisan' ? 'artisan' : 'buyer';
  params.delete('role');
  return <Navigate to={`/${role}/login?${params.toString()}`} replace />;
}
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
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/market-insights" element={<MarketInsights />} />
          <Route path="/login" element={<LegacyLogin />} />
          <Route path="/buyer/login" element={<Login key="buyer" role="buyer" />} />
          <Route path="/artisan/login" element={<Login key="artisan" role="artisan" />} />
          <Route element={<RequireBuyer />}>
            <Route path="/buyer/profile" element={<BuyerProfile />} />
          </Route>
          <Route element={<RequireArtisan />}>
            <Route path="/seller/dashboard" element={<Navigate to="/artisan-profile" replace />} />
            <Route path="/add-product" element={<AddProduct />} />
            <Route path="/edit-product/:id" element={<AddProduct />} />
            <Route path="/artisan-profile" element={<ArtisanProfile />} />
          </Route>
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

            <p className="footer-copyright">
              © {new Date().getFullYear()} {f.copyright}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}


