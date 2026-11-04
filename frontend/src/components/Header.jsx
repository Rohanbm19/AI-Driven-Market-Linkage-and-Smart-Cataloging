import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  Sparkles,
  Bot,
  TrendingUp,
  User,
  Store,
  Menu,
  X
} from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import Logo from './Logo.jsx';
import { useLanguage } from '../i18n/index.js';

export default function Header() {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const isCatalogingPage = pathname.startsWith('/add-product');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <header className="header">
      <div className="header-inner">
        {/* Left: Brand Logo */}
        <div className="header-left">
          <Logo
            variant="compact"
            showTagline={false}
            to="/"
          />
        </div>

        {/* Center: Main Navigation (Marketplace, AI Cataloging, AI Assistant, Market Insights) */}
        <nav className="nav-center" aria-label="Main Navigation">
          <ul className="nav-links">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                end
              >
                <ShoppingBag size={17} />
                <span>{t.nav?.marketplace || 'Marketplace'}</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/add-product"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Sparkles size={17} />
                <span>{t.nav?.smartCatalog || 'AI Cataloging'}</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/assistant"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Bot size={17} />
                <span>{t.nav?.assistant || 'AI Assistant'}</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/market-insights"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <TrendingUp size={17} />
                <span>{t.nav?.insights || 'Market Insights'}</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Right Actions: Language Selector, My Studio, Sign In (always last) */}
        <div className="header-actions">
          {/* Language Selector */}
          <div className="header-lang-wrapper">
            <LanguageSwitcher />
          </div>

          {/* My Studio Button */}
          <Link
            to="/artisan-profile"
            className="btn btn-my-studio"
            title="My Artisan Studio"
          >
            <Store size={16} />
            <span>{t.nav?.profile || 'My Studio'}</span>
          </Link>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {!isCatalogingPage && (
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
            <li>
              <NavLink
                to="/"
                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobile}
                end
              >
                <ShoppingBag size={18} />
                <span>{t.nav?.marketplace || 'Marketplace'}</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/add-product"
                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobile}
              >
                <Sparkles size={18} />
                <span>{t.nav?.smartCatalog || 'AI Cataloging'}</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/assistant"
                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobile}
              >
                <Bot size={18} />
                <span>{t.nav?.assistant || 'AI Assistant'}</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/market-insights"
                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobile}
              >
                <TrendingUp size={18} />
                <span>{t.nav?.insights || 'Market Insights'}</span>
              </NavLink>
            </li>
            <li className="mobile-divider" />
            <li>
              <Link
                to="/artisan-profile"
                className="mobile-nav-link"
                onClick={closeMobile}
              >
                <Store size={18} />
                <span>{t.nav?.profile || 'My Studio'}</span>
              </Link>
            </li>
            {!isCatalogingPage && (
              <li>
                <Link
                  to="/login"
                  className="mobile-nav-link mobile-nav-signin"
                  onClick={closeMobile}
                >
                  <User size={18} />
                  <span>{t.nav?.login || 'Sign In'}</span>
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}
