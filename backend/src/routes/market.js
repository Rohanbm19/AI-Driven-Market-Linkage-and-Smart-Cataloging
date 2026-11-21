import express from 'express';
import {
  isLiveDemandCategorySupported,
  predictLiveDemand
} from '../services/mlMarketService.js';
import { isSupabaseConfigured, supabase } from '../config/supabase.js';

const router = express.Router();

async function fetchMarketInsights() {
  if (!isSupabaseConfigured()) {
    const error = new Error('Supabase is not configured.');
    error.status = 503;
    throw error;
  }

  const [overviewResult, categoriesResult] = await Promise.all([
    supabase.from('market_insights_overview').select('*').single(),
    supabase
      .from('market_insights_by_category')
      .select('*')
      .order('enquiries_30d', { ascending: false })
  ]);

  if (overviewResult.error) throw overviewResult.error;
  if (categoriesResult.error) throw categoriesResult.error;

  return {
    overview: overviewResult.data,
    categories: (categoriesResult.data || []).map((category) => ({
      ...category,
      ml_supported: isLiveDemandCategorySupported(category.category)
    })),
    updatedAt: new Date().toISOString()
  };
}

router.get('/insights', async (_req, res) => {
  try {
    return res.json(await fetchMarketInsights());
  } catch (error) {
    console.error('Market insights database query failed:', error.message);
    return res.status(error.status || 503).json({
      error: 'Could not load market insights. Apply the latest Supabase migration and try again.'
    });
  }
});

router.get('/trends', async (_req, res) => {
  try {
    const insights = await fetchMarketInsights();
    return res.json({
      updatedAt: insights.updatedAt,
      trends: insights.categories
    });
  } catch (error) {
    console.error('Market trends database query failed:', error.message);
    return res.status(error.status || 503).json({
      error: 'Could not load market trends. Apply the latest Supabase migration and try again.'
    });
  }
});

router.get('/ml/demand', async (req, res) => {
  try {
    return res.json(await predictLiveDemand(req.query.category));
  } catch (error) {
    console.error('Live ML demand prediction failed:', error.message);
    return res.status(error.status || 503).json({
      error: error.status
        ? error.message
        : 'Could not generate a demand estimate. Check the ML Python environment and trained model.'
    });
  }
});

router.post('/products/:id/view', async (req, res) => {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: 'Supabase is not configured.' });
  }

  try {
    const { error } = await supabase
      .from('product_views')
      .insert({ product_id: req.params.id });

    if (error) {
      console.error('Product view recording failed:', error.message);
      return res.status(error.code === '23503' ? 404 : 503).json({
        error: error.code === '23503'
          ? 'Product not found.'
          : 'Could not record product view.'
      });
    }

    return res.status(202).json({ success: true });
  } catch (error) {
    console.error('Product view recording failed:', error.message);
    return res.status(503).json({ error: 'Could not record product view.' });
  }
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
