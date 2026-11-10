import React from 'react';
import { useLanguage } from '../i18n/index.js';
import {
  TrendingUp,
  DollarSign,
  Users,
  Award,
  Globe,
  ArrowUpRight,
  ShieldCheck,
  BarChart3
} from 'lucide-react';

const TRENDS = [
  {
    craft: 'Bankura Terracotta Horses & Sculptures',
    region: 'West Bengal',
    growth: '+42%',
    demand: 'High',
    avgPrice: '₹1,800 – ₹4,500',
    topBuyers: 'Germany, USA, Domestic Urban'
  },
  {
    craft: 'Kanjivaram Handwoven Pure Silk',
    region: 'Tamil Nadu',
    growth: '+38%',
    demand: 'Very High',
    avgPrice: '₹12,000 – ₹35,000',
    topBuyers: 'UK, Singapore, Wedding Retail'
  },
  {
    craft: 'Channapatna Eco Wooden Toys',
    region: 'Karnataka',
    growth: '+54%',
    demand: 'Surging',
    avgPrice: '₹950 – ₹2,400',
    topBuyers: 'Montessori Schools, Scandinavia, Japan'
  },
  {
    craft: 'Moradabad Hand-Chiseled Brassware',
    region: 'Uttar Pradesh',
    growth: '+29%',
    demand: 'Steady High',
    avgPrice: '₹2,500 – ₹7,800',
    topBuyers: 'UAE, North America, Hospitality'
  },
  {
    craft: 'Jaipur Blue Pottery Glazed Ceramics',
    region: 'Rajasthan',
    growth: '+35%',
    demand: 'High',
    avgPrice: '₹1,400 – ₹3,900',
    topBuyers: 'Interior Designers, France, Australia'
  }
];

export default function MarketInsights() {
  const { t } = useLanguage();
  const text = t.insights;
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{text.title}</h1>
          <p className="page-subtitle">
            {text.desc}
          </p>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="stat-val">+41.8%</div>
            <div className="stat-lbl">{text.giDemand}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div className="stat-val">2.8x</div>
            <div className="stat-lbl">{text.earnings}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}>
            <Globe size={24} />
          </div>
          <div>
            <div className="stat-val">34+</div>
            <div className="stat-lbl">{text.exportCountries}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="stat-val">100%</div>
            <div className="stat-lbl">{text.settlements}</div>
          </div>
        </div>
      </div>

      {/* Price Comparison Callout */}
      <div
        className="card"
        style={{
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
          border: '1px solid #fed7aa'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', color: '#9a3412', marginBottom: '0.25rem' }}>
              💡 {text.benchmark}
            </h3>
            <p style={{ fontSize: '0.92rem', color: '#7c2d12', maxWidth: '720px' }}>
              {text.benchmarkDesc}
            </p>
          </div>
          <div
            style={{
              background: 'white',
              padding: '0.75rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-sm)',
              textAlign: 'center'
            }}
          >
            <span style={{ fontSize: '0.75rem', color: '#9a3412', fontWeight: 700, textTransform: 'uppercase' }}>
              {text.margin}
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#c2410c' }}>
              +62%
            </div>
          </div>
        </div>
      </div>

      {/* Craft Category Velocity Table */}
      <div className="card">
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart3 size={20} color="var(--primary)" />
          <span>{text.topCrafts}</span>
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.92rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem' }}>{text.category}</th>
                <th style={{ padding: '0.75rem' }}>{text.region}</th>
                <th style={{ padding: '0.75rem' }}>{text.growth}</th>
                <th style={{ padding: '0.75rem' }}>{text.intensity}</th>
                <th style={{ padding: '0.75rem' }}>{text.fairPrice}</th>
                <th style={{ padding: '0.75rem' }}>{text.buyers}</th>
              </tr>
            </thead>
            <tbody>
              {TRENDS.map((t, i) => (
                <tr
                  key={t.craft}
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    background: i % 2 === 0 ? 'rgba(250, 248, 245, 0.5)' : 'white'
                  }}
                >
                  <td style={{ padding: '1rem 0.75rem', fontWeight: 600 }}>{t.craft}</td>
                  <td style={{ padding: '1rem 0.75rem', color: 'var(--text-muted)' }}>{t.region}</td>
                  <td style={{ padding: '1rem 0.75rem', color: '#059669', fontWeight: 700 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                      <ArrowUpRight size={15} />
                      {t.growth}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 0.75rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background: '#ecfdf5',
                        color: '#065f46'
                      }}
                    >
                      {text[t.demand === 'Very High' ? 'veryHigh' : t.demand === 'Steady High' ? 'steadyHigh' : t.demand.toLowerCase()] || t.demand}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 0.75rem', fontWeight: 600, color: 'var(--primary)' }}>
                    {t.avgPrice}
                  </td>
                  <td style={{ padding: '1rem 0.75rem', color: '#4b5563' }}>{t.topBuyers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
