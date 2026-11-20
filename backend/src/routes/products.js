
import express from 'express';
import {
  supabase,
  isSupabaseConfigured
} from '../config/supabase.js';

import {
  translateProduct,
  saveProductTranslations,
  SUPPORTED_LANGUAGES
} from '../services/translationService.js';

const router = express.Router();

function requireDatabase(res) {
  if (!isSupabaseConfigured() || !supabase) {
    res.status(503).json({
      success: false,
      error: 'Supabase is not configured on the backend.'
    });
    return false;
  }

  return true;
}

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

/**
 * Only fields that exist in the products table are accepted.
 */
function normalizeProductInput(body = {}) {
  const product = {};

  if (body.title !== undefined) {
    product.title = String(body.title).trim();
  }

  if (body.category !== undefined) {
    product.category = String(body.category).trim();
  }

  if (body.price !== undefined) {
    product.price = Number(body.price);
  }

  if (body.artisan_name !== undefined) {
    product.artisan_name = String(body.artisan_name).trim();
  }

  if (body.artisan_id !== undefined) {
    product.artisan_id = body.artisan_id || null;
  }

  if (body.region !== undefined) {
    product.region = String(body.region).trim();
  }

  if (body.description !== undefined) {
    product.description = String(body.description).trim();
  }

  if (body.materials !== undefined) {
    product.materials = normalizeArray(body.materials);
  }

  if (body.tags !== undefined) {
    product.tags = normalizeArray(body.tags);
  }

  if (body.image_url !== undefined) {
    product.image_url = body.image_url || null;
  }

  if (body.original_image_url !== undefined) {
    product.original_image_url = body.original_image_url || null;
  }

  if (body.enhanced_image_url !== undefined) {
    product.enhanced_image_url = body.enhanced_image_url || null;
  }

  if (body.stock !== undefined) {
    product.stock = Number(body.stock);
  }

  return product;
}

function validateProduct(product, isUpdate = false) {
  if (!isUpdate && !product.title) {
    return 'Product title is required.';
  }

  if (!isUpdate && !product.category) {
    return 'Product category is required.';
  }

  if (
    product.price !== undefined &&
    (!Number.isFinite(product.price) || product.price < 0)
  ) {
    return 'Product price must be a valid non-negative number.';
  }

  if (
    product.stock !== undefined &&
    (!Number.isInteger(product.stock) || product.stock < 0)
  ) {
    return 'Product stock must be a non-negative whole number.';
  }

  return null;
}

function validateLanguage(language) {
  return Boolean(SUPPORTED_LANGUAGES[language]);
}

/**
 * GET /api/products?lang=kn
 * Fetch products in the requested language.
 */
router.get('/', async (req, res) => {
  if (!requireDatabase(res)) return;

  try {
    const language = String(req.query.lang || 'en');

    if (!validateLanguage(language)) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported language.'
      });
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (language === 'en') {
      return res.json(data || []);
    }

    const localizedProducts = await Promise.all(
      (data || []).map((product) =>
        translateProduct(product, language)
      )
    );

    return res.json(localizedProducts);
  } catch (error) {
    console.error('Get products error:', error.message);

    return res.status(500).json({
      success: false,
      error: 'Unable to fetch products.',
      details: error.message
    });
  }
});

/**
 * GET /api/products/:id?lang=kn
 * Fetch one product in the requested language.
 */
router.get('/:id', async (req, res) => {
  if (!requireDatabase(res)) return;

  try {
    const language = String(req.query.lang || 'en');

    if (!validateLanguage(language)) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported language.'
      });
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Product not found.'
      });
    }

    const product = language === 'en'
      ? data
      : await translateProduct(data, language);

    return res.json(product);
  } catch (error) {
    console.error('Get product error:', error.message);

    return res.status(500).json({
      success: false,
      error: 'Unable to fetch product.',
      details: error.message
    });
  }
});

/**
 * POST /api/products
 * Save a product and its six AI-generated translations.
 */
router.post('/', async (req, res) => {
  if (!requireDatabase(res)) return;

  try {
    const productData = normalizeProductInput(req.body);
    const validationError = validateProduct(productData);

    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError
      });
    }

    const id = req.body.id || `prod-${Date.now()}`;

    const newProduct = {
      ...productData,
      id,
      artisan_name: productData.artisan_name || 'Master Artisan',
      region: productData.region || '',
      description: productData.description || '',
      materials: productData.materials || [],
      tags: productData.tags || [],
      stock: productData.stock ?? 1,
      rating: 0,
      reviews_count: 0,
      is_verified: false,
      fair_trade: false,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('products')
      .insert([newProduct])
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    let translationsSaved = false;
    let translationError = null;

    if (req.body.translations) {
      try {
        await saveProductTranslations(
          data.id,
          req.body.translations,
          data
        );

        translationsSaved = true;
      } catch (error) {
        translationError = error.message;
        console.error('Translation save error:', error.message);
      }
    }

    return res.status(201).json({
      success: true,
      savedInSupabase: true,
      translationsSaved,
      translationError,
      data
    });
  } catch (error) {
    console.error('Create product error:', error.message);

    return res.status(500).json({
      success: false,
      savedInSupabase: false,
      error: 'Unable to save product.',
      dbError: error.message
    });
  }
});

/**
 * PUT /api/products/:id
 * Update product and refresh translations when supplied.
 */
router.put('/:id', async (req, res) => {
  if (!requireDatabase(res)) return;

  try {
    const updates = normalizeProductInput(req.body);
    const validationError = validateProduct(updates, true);

    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError
      });
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid product fields were supplied.'
      });
    }

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', req.params.id)
      .select('*')
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Product not found.'
      });
    }

    let translationsSaved = false;
    let translationError = null;

    if (req.body.translations) {
      try {
        await saveProductTranslations(
          data.id,
          req.body.translations,
          data
        );

        translationsSaved = true;
      } catch (error) {
        translationError = error.message;
        console.error('Updated translation save error:', error.message);
      }
    }

    return res.json({
      success: true,
      savedInSupabase: true,
      translationsSaved,
      translationError,
      data
    });
  } catch (error) {
    console.error('Update product error:', error.message);

    return res.status(500).json({
      success: false,
      error: 'Unable to update product.',
      details: error.message
    });
  }
});

/**
 * DELETE /api/products/:id
 * Delete translations first, then delete the product.
 */
router.delete('/:id', async (req, res) => {
  if (!requireDatabase(res)) return;

  try {
    const { error: translationError } = await supabase
      .from('product_translations')
      .delete()
      .eq('product_id', req.params.id);

    if (translationError) {
      throw translationError;
    }

    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id)
      .select('id')
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Product not found.'
      });
    }

    return res.json({
      success: true,
      deletedInSupabase: true,
      id: data.id
    });
  } catch (error) {
    console.error('Delete product error:', error.message);

    return res.status(500).json({
      success: false,
      error: 'Unable to delete product.',
      details: error.message
    });
  }
});

export default router;
