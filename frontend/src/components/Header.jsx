
import React, { useEffect, useRef, useState } from 'react';
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
import { loginTranslations } from '../i18n/loginTranslations.js';

import { useAuth } from '../context/AuthContext.jsx';

export default function Header() {
  const { t, lang } = useLanguage();
  const copy = loginTranslations[lang] || loginTranslations.en;
  const { pathname } = useLocation();
  const { isAuthenticated, isArtisan, signOut } = useAuth();
  const navigate = useNavigate();
  const headerRef = useRef(null);
  const menuToggleRef = useRef(null);
  const profilePath = isArtisan ? '/artisan-profile' : '/buyer/profile';
  const profileLabel = isArtisan ? 'My Studio' : 'My Profile';
  const handleSignOut = async () => {
    try { await signOut(); setMobileMenuOpen(false); navigate('/'); }
    catch (error) { window.alert(error.message || 'Unable to sign out. Please try again.'); }
  };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!headerRef.current?.contains(event.target)) setMobileMenuOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        menuToggleRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <header className="header" ref={headerRef}>
      <div className="header-inner">

        {/* Brand Logo */}
        <div className="header-left">
          <Logo
            variant="compact"
            showTagline={false}
            to="/"
          />
        </div>

        {/* Header Actions */}
        <div className="header-actions">

          <div className="header-lang-wrapper">
            <LanguageSwitcher />
          </div>

          {/* Single Theme Toggle */}
          <ThemeToggle />

          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            ref={menuToggleRef}
            aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="account-menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

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
                <span>{isAuthenticated ? profileLabel : copy.artisanLink}</span>
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


