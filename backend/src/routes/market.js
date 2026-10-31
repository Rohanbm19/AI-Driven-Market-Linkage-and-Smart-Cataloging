import express from 'express';

const router = express.Router();

const MARKET_TRENDS = [
  {
    craft: 'Bankura Terracotta Horses & Sculptures',
    category: 'pottery',
    region: 'West Bengal',
    growth: '+42%',
    demand: 'High',
    avgPrice: '₹1,800 – ₹4,500',
    topBuyers: 'Germany, USA, Domestic Urban',
    exportOpportunity: 'Festive decor & cultural exhibitions'
  },
  {
    craft: 'Kanjivaram Handwoven Pure Silk',
    category: 'textiles',
    region: 'Tamil Nadu',
    growth: '+38%',
    demand: 'Very High',
    avgPrice: '₹12,000 – ₹35,000',
    topBuyers: 'UK, Singapore, Wedding Retail',
    exportOpportunity: 'Bridal wear & diaspora luxury markets'
  },
  {
    craft: 'Channapatna Eco Wooden Toys',
    category: 'woodwork',
    region: 'Karnataka',
    growth: '+54%',
    demand: 'Surging',
    avgPrice: '₹950 – ₹2,400',
    topBuyers: 'Montessori Schools, Scandinavia, Japan',
    exportOpportunity: 'Non-toxic sustainable educational toys'
  },
  {
    craft: 'Moradabad Hand-Chiseled Brassware',
    category: 'metal',
    region: 'Uttar Pradesh',
    growth: '+29%',
    demand: 'Steady High',
    avgPrice: '₹2,500 – ₹7,800',
    topBuyers: 'UAE, North America, Hospitality',
    exportOpportunity: 'Heritage resort & wellness sanctuary decor'
  },
  {
    craft: 'Jaipur Blue Pottery Glazed Ceramics',
    category: 'pottery',
    region: 'Rajasthan',
    growth: '+35%',
    demand: 'High',
    avgPrice: '₹1,400 – ₹3,900',
    topBuyers: 'Interior Designers, France, Australia',
    exportOpportunity: 'Contemporary tableware & architectural tile accents'
  }
];

// GET /api/market/trends
router.get('/trends', (req, res) => {
  res.json({
    updatedAt: new Date().toISOString(),
    trends: MARKET_TRENDS
  });
});

// POST /api/market/fair-price - Calculates transparent fair trade price
router.post('/fair-price', (req, res) => {
  const {
    materialCost = 0,
    laborHours = 0,
    hourlyWage = 150, // default dignified living wage ₹150/hour
    packagingCost = 0,
    craftCategory = 'craft'
  } = req.body;

  const mat = Number(materialCost) || 0;
  const hours = Number(laborHours) || 0;
  const wage = Number(hourlyWage) || 150;
  const pkg = Number(packagingCost) || 0;

  const laborCost = hours * wage;
  const totalProductionCost = mat + laborCost + pkg;

  // Sustainable artisan profit margin (30%)
  const artisanMargin = Math.round(totalProductionCost * 0.30);
  const suggestedSellingPrice = Math.round(totalProductionCost + artisanMargin);

  const minPrice = Math.round(totalProductionCost * 1.15);
  const maxPrice = Math.round(totalProductionCost * 1.55);

  res.json({
    materialCost: mat,
    laborCost,
    packagingCost: pkg,
    totalProductionCost,
    artisanMargin,
    suggestedSellingPrice: Math.max(suggestedSellingPrice, 100),
    priceRange: {
      min: Math.max(minPrice, 80),
      max: Math.max(maxPrice, 150)
    },
    fairTradeCompliant: true,
    currency: 'INR'
  });
});

export default router;
