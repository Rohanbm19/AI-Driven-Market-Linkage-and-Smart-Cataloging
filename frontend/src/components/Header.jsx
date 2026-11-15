
import React, { useEffect, useState } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Sparkles,
  Bot,
  TrendingUp,
  User,
  Store,
  Menu,
  X, LogOut
} from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import Logo from './Logo.jsx';
import { useLanguage } from '../i18n/index.js';

import { useAuth } from '../context/AuthContext.jsx';

export default function Header() {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const { isAuthenticated, isArtisan, signOut } = useAuth();
  const navigate = useNavigate();
  const profilePath = isArtisan ? '/artisan-profile' : '/buyer/profile';
  const profileLabel = isArtisan ? 'My Studio' : 'My Profile';
  const handleSignOut = async () => {
    try { await signOut(); setMobileMenuOpen(false); navigate('/'); }
    catch (error) { window.alert(error.message || 'Unable to sign out. Please try again.'); }
  };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <header className="header">
      <div className="header-inner">

        {/* Brand Logo */}
        <div className="header-left">
          <Logo
            variant="compact"
            showTagline={false}
            to="/"
          />
        </div>

        {/* Desktop Navigation */}
        <nav
          className="nav-center"
          aria-label={t?.common?.mainNav || 'Main Navigation'}
        >
          <ul className="nav-links">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                end
              >
                <ShoppingBag size={17} />
                <span>{t?.nav?.marketplace || 'Marketplace'}</span>
              </NavLink>
            </li>

            {isArtisan && <li>
              <NavLink
                to="/add-product"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Sparkles size={17} />
                <span>{t?.nav?.smartCatalog || 'AI Cataloging'}</span>
              </NavLink>
            </li>}

            <li>
              <NavLink
                to="/assistant"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Bot size={17} />
                <span>{t?.nav?.assistant || 'AI Assistant'}</span>
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/market-insights"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <TrendingUp size={17} />
                <span>{t?.nav?.insights || 'Market Insights'}</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Header Actions */}
        <div className="header-actions">

          <div className="header-lang-wrapper">
            <LanguageSwitcher />
          </div>

          {/* Single Theme Toggle */}
          <ThemeToggle />

          <Link
            to={isAuthenticated ? profilePath : "/artisan/login"}
            className="btn btn-my-studio"
            title={t?.common?.myStudioTitle || 'My Studio'}
          >
            <Store size={16} />
            <span>{isAuthenticated ? profileLabel : 'Artisan Sign In'}</span>
          </Link>

          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="account-menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {!isAuthenticated && (
            <Link
              to="/buyer/login"
              className="btn btn-signin"
              aria-label="Sign In"
            >
              <User size={16} />
              <span>{t?.nav?.login || 'Sign In'}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Compact Floating Navigation Menu */}
      {mobileMenuOpen && (
        <div id="account-menu" className="mobile-drawer">
          <ul className="mobile-nav-links">

            <li>
              <NavLink
                to="/"
                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobile}
                end
              >
                <ShoppingBag size={18} />
                <span>{t?.nav?.marketplace || 'Marketplace'}</span>
              </NavLink>
            </li>

            {isArtisan && <li>
              <NavLink
                to="/add-product"
                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobile}
              >
                <Sparkles size={18} />
                <span>{t?.nav?.smartCatalog || 'AI Cataloging'}</span>
              </NavLink>
            </li>}

            <li>
              <NavLink
                to="/assistant"
                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobile}
              >
                <Bot size={18} />
                <span>{t?.nav?.assistant || 'AI Assistant'}</span>
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/market-insights"
                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobile}
              >
                <TrendingUp size={18} />
                <span>{t?.nav?.insights || 'Market Insights'}</span>
              </NavLink>
            </li>

            <li className="mobile-divider" />

            <li>
              <Link
                to={isAuthenticated ? profilePath : "/artisan/login"}
                className="mobile-nav-link"
                onClick={closeMobile}
              >
                <Store size={18} />
                <span>{isAuthenticated ? profileLabel : 'Artisan Sign In'}</span>
              </Link>
            </li>

            {!isAuthenticated && (
              <li>
                <Link
                  to="/buyer/login"
                  className="mobile-nav-link mobile-nav-signin"
                  onClick={closeMobile}
                >
                  <User size={18} />
                  <span>{t?.nav?.login || 'Sign In'}</span>
                </Link>
              </li>
            )}

            {isArtisan && <li><Link to="/image-enhancer" className="mobile-nav-link" onClick={closeMobile}>Image Enhancer</Link></li>}
            {isArtisan && <li><Link to="/enquiries" className="mobile-nav-link" onClick={closeMobile}>Buyer Enquiries</Link></li>}
            {isAuthenticated && <li><button type="button" className="mobile-nav-link" onClick={handleSignOut}><LogOut size={18} /><span>Sign Out</span></button></li>}
          </ul>
        </div>
      )}
    </header>
  );
}
