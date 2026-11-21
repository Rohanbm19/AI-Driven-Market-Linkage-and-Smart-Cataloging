
import express from 'express';

import {
  isLiveDemandCategorySupported,
  predictLiveDemand,
  predictDemand,
  predictPrice,
  predictSegment,
  predictTrends,
  readMlInsights
} from '../services/mlMarketService.js';

import {
  isSupabaseConfigured,
  supabase
} from '../config/supabase.js';

const router = express.Router();

// --------------------------------------------------
// Helper: Validate numeric input
// --------------------------------------------------

function isValidNumber(value) {
  return value !== undefined && value !== null &&
    value !== '' && Number.isFinite(Number(value));
}

// --------------------------------------------------
// Existing Supabase Market Insights
// GET /api/market/insights
// --------------------------------------------------

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

// --------------------------------------------------
// Existing Market Trends
// GET /api/market/trends
// --------------------------------------------------

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

// --------------------------------------------------
// Existing Live Demand Prediction
// GET /api/market/ml/demand
// --------------------------------------------------

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

// --------------------------------------------------
// ML Demand Prediction
// POST /api/market/ml/demand
// --------------------------------------------------

router.post('/ml/demand', async (req, res) => {
  try {
    const {
      category,
      location,
      historicalUnits,
      views,
      enquiries,
      month,
      festival
    } = req.body;

    if (!category || !location) {
      return res.status(400).json({
        error: 'Category and location are required.'
      });
    }

    if (!isValidNumber(historicalUnits) || Number(historicalUnits) <= 0) {
      return res.status(400).json({
        error: 'Historical units must be a number greater than zero.'
      });
    }

    if (
      !isValidNumber(views) ||
      Number(views) < 0 ||
      !isValidNumber(enquiries) ||
      Number(enquiries) < 0
    ) {
      return res.status(400).json({
        error: 'Views and enquiries must be non-negative numbers.'
      });
    }

    if (
      !isValidNumber(month) ||
      Number(month) < 1 ||
      Number(month) > 12
    ) {
      return res.status(400).json({
        error: 'Month must be between 1 and 12.'
      });
    }

    const result = await predictDemand(req.body);
    return res.json(result);
  } catch (error) {
    console.error('ML demand prediction failed:', error.message);

    return res.status(error.status || 500).json({
      error: error.message || 'Could not generate demand prediction.'
    });
  }
});

// --------------------------------------------------
// ML Price Prediction
// POST /api/market/ml/price
// --------------------------------------------------

router.post('/ml/price', async (req, res) => {
  try {
    const {
      category,
      material,
      labour,
      hours,
      size,
      marketPrice
    } = req.body;

    if (!category) {
      return res.status(400).json({
        error: 'Product category is required.'
      });
    }

    if (
      !isValidNumber(material) ||
      Number(material) < 0 ||
      !isValidNumber(labour) ||
      Number(labour) < 0 ||
      !isValidNumber(hours) ||
      Number(hours) <= 0
    ) {
      return res.status(400).json({
        error: 'Material cost and labour cost must be non-negative numbers, and hours must be greater than zero.'
      });
    }

    if (marketPrice !== undefined &&
        (!isValidNumber(marketPrice) || Number(marketPrice) < 0)) {
      return res.status(400).json({
        error: 'Market price must be a non-negative number.'
      });
    }

    const result = await predictPrice(req.body);
    return res.json(result);
  } catch (error) {
    console.error('ML price prediction failed:', error.message);

    return res.status(error.status || 500).json({
      error: error.message || 'Could not generate price prediction.'
    });
  }
});

// --------------------------------------------------
// ML Customer Segmentation
// POST /api/market/ml/segment
// --------------------------------------------------

router.post('/ml/segment', async (req, res) => {
  try {
    const {
      purchases,
      aov,
      frequency,
      categories
    } = req.body;

    if (
      !isValidNumber(purchases) ||
      Number(purchases) < 0 ||
      !isValidNumber(aov) ||
      Number(aov) < 0 ||
      !isValidNumber(frequency) ||
      Number(frequency) < 0
    ) {
      return res.status(400).json({
        error: 'Purchases, average order value and frequency must be non-negative numbers.'
      });
    }

    if (
      categories !== undefined &&
      !Array.isArray(categories) &&
      typeof categories !== 'string'
    ) {
      return res.status(400).json({
        error: 'Categories must be an array or a string.'
      });
    }

    const result = await predictSegment(req.body);
    return res.json(result);
  } catch (error) {
    console.error('ML customer segmentation failed:', error.message);

    return res.status(error.status || 500).json({
      error: error.message || 'Could not generate customer segmentation.'
    });
  }
});

// --------------------------------------------------
// ML Product Trends
// GET /api/market/ml/trends
// --------------------------------------------------

router.get('/ml/trends', async (_req, res) => {
  try {
    const result = await predictTrends();
    return res.json(result);
  } catch (error) {
    console.error('ML trend analysis failed:', error.message);

    return res.status(error.status || 500).json({
      error: error.message || 'Could not generate ML trend analysis.'
    });
  }
});

// --------------------------------------------------
// ML Model Evaluation Insights
// GET /api/market/ml/insights
// --------------------------------------------------

router.get('/ml/insights', async (_req, res) => {
  try {
    const result = await readMlInsights();
    return res.json(result);
  } catch (error) {
    console.error('ML insights loading failed:', error.message);

    return res.status(error.status || 500).json({
      error: error.message || 'Could not load ML evaluation insights.'
    });
  }
});

// --------------------------------------------------
// Existing Product View Tracking
// POST /api/market/products/:id/view
// --------------------------------------------------

router.post('/products/:id/view', async (req, res) => {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({
      error: 'Supabase is not configured.'
    });
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

    return res.status(202).json({
      success: true
    });
  } catch (error) {
    console.error('Product view recording failed:', error.message);

    return res.status(503).json({
      error: 'Could not record product view.'
    });
  }
});

// --------------------------------------------------
// Existing Fair Price Calculator
// POST /api/market/fair-price
// --------------------------------------------------

router.post('/fair-price', (req, res) => {
  const {
    materialCost = 0,
    laborHours = 0,
    hourlyWage = 150,
    packagingCost = 0,
    craftCategory = 'craft'
  } = req.body;

  const mat = Number(materialCost) || 0;
  const hours = Number(laborHours) || 0;
  const wage = Number(hourlyWage) || 150;
  const pkg = Number(packagingCost) || 0;

  const laborCost = hours * wage;
  const totalProductionCost = mat + laborCost + pkg;

  const artisanMargin = Math.round(totalProductionCost * 0.30);
  const suggestedSellingPrice = Math.round(
    totalProductionCost + artisanMargin
  );

  const minPrice = Math.round(totalProductionCost * 1.15);
  const maxPrice = Math.round(totalProductionCost * 1.55);

  return res.json({
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
