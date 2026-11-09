import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Sparkles,
  TrendingUp,
  User,
  Store,
  Menu,
  X,
  LayoutDashboard,
  Image as ImageIcon,
  MessageSquare,
  LogOut
} from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import Logo from './Logo.jsx';
import { useLanguage } from '../i18n/index.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Header() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { isAuthenticated, isArtisan, role, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobile = () => setMobileMenuOpen(false);
  const buyerLinks = [
    { to: '/', label: t.nav?.marketplace || 'Marketplace', icon: ShoppingBag, end: true },
    { to: '/market-insights', label: t.nav?.insights || 'Market Insights', icon: TrendingUp },
    { to: '/assistant', label: t.nav?.assistant || 'Craft Assistant', icon: Sparkles }
  ];
  const sellerLinks = [
    { to: '/seller/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/add-product', label: t.nav?.smartCatalog || 'AI Cataloging', icon: Sparkles },
    { to: '/image-enhancer', label: 'Image Enhancer', icon: ImageIcon },
    { to: '/enquiries', label: 'Buyer Enquiries', icon: MessageSquare },
    { to: '/artisan-profile', label: t.nav?.profile || 'My Studio', icon: Store }
  ];
  const links = isArtisan
    ? [{ ...buyerLinks[0], label: 'Marketplace' }, ...sellerLinks]
    : buyerLinks;

  const renderLinks = (className) => links.map(({ to, label, icon: Icon, end }) => (
    <li key={to}>
      <NavLink
        to={to}
        end={end}
        onClick={closeMobile}
        className={({ isActive }) => `${className} ${isActive ? 'active' : ''}`}
      >
        <Icon size={className === 'mobile-nav-link' ? 18 : 17} />
        <span>{label}</span>
      </NavLink>
    </li>
  ));

  const handleSignOut = async () => {
    closeMobile();
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Unable to sign out:', error);
      window.alert('Unable to sign out. Please try again.');
    }
  };

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-left">
          <Logo variant="compact" showTagline={false} to="/" />
          {isArtisan && <span className="role-chip role-chip-seller">Seller</span>}
          {isAuthenticated && role === 'buyer' && <span className="role-chip">Buyer</span>}
        </div>

        <nav className="nav-center" aria-label="Main Navigation">
          <ul className="nav-links">{renderLinks('nav-link')}</ul>
        </nav>

        <div className="header-actions">
          <div className="header-lang-wrapper">
            <LanguageSwitcher />
          </div>

          {!isArtisan && (
            <Link to="/login?role=artisan" className="btn btn-my-studio" title="Artisan sign in">
              <Store size={16} />
              <span>Artisan Portal</span>
            </Link>
          )}

          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {isAuthenticated ? (
            <button type="button" className="btn btn-signin" onClick={handleSignOut} aria-label="Sign Out">
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="btn btn-signin"
              aria-label="Sign In"
            >
              <User size={16} />
              <span>{t.nav?.login || 'Sign In'}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <ul className="mobile-nav-links">
            {renderLinks('mobile-nav-link')}
            <li className="mobile-divider" />
            <li>
              {isAuthenticated ? (
                <button type="button" className="mobile-nav-link mobile-nav-signin" onClick={handleSignOut}>
                  <LogOut size={18} /><span>Sign Out</span>
                </button>
              ) : (
                <Link to="/login" className="mobile-nav-link mobile-nav-signin" onClick={closeMobile}>
                  <User size={18} /><span>{t.nav?.login || 'Sign In'}</span>
                </Link>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
