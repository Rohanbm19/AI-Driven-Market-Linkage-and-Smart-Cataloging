import React from 'react';
import { BadgeCheck, Globe2, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';

const quickLinks = [
  { to: '/', label: 'Marketplace' },
  { to: '/market-insights', label: 'Market Insights' },
  { to: '/buyer/login', label: 'Buyer Portal' },
  { to: '/artisan/login', label: 'Artisan Portal' }
];

export default function Footer() {
  return (
    <footer className="kalasetu-footer">
      <div className="footer-inner">
        <div className="footer-brand-col">
          <Logo tagline="Crafts • Culture • Connect" size={36} />
          <p className="footer-desc">
            AI-Driven Market Linkage &amp; Smart Cataloging platform directly connecting Indian traditional master artisans with global collectors and conscious buyers.
          </p>
        </div>

        <nav className="footer-quick-links" aria-label="Footer navigation">
          <h2 className="footer-heading">Quick Links</h2>
          <ul>
            {quickLinks.map(({ to, label }) => (
              <li key={to}>
                <Link to={to}>{label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="footer-meta-col">
          <h2 className="footer-heading">Our Commitments</h2>
          <div className="footer-badges">
            <span className="footer-badge"><BadgeCheck size={16} /> Fair Trade Direct</span>
            <span className="footer-badge"><Globe2 size={16} /> Multilingual Voice AI</span>
            <span className="footer-badge"><ShieldCheck size={16} /> GI Tag Protection</span>
          </div>
          <p className="footer-copyright">
            © {new Date().getFullYear()} KalaSetu. Preserving Heritage. Unlocking Global Markets.
          </p>
        </div>
      </div>
    </footer>
  );
}
