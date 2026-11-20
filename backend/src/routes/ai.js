
import express from 'express';

import { generateSmartCatalog } from '../services/catalogService.js';
import { handleAdvisorChat } from '../services/chatService.js';
import { enhanceProductImage } from '../services/imageService.js';
import { calculateFairPrice } from '../services/marketService.js';

const router = express.Router();

/**
 * POST /api/ai/catalog
 * Generate a product catalog and translations in six languages.
 */
router.post('/catalog', async (req, res) => {
  try {
    const generated = await generateSmartCatalog(req.body || {});

    return res.json(generated);
  } catch (error) {
    console.error('Catalog generation error:', error.message);

    return res.status(500).json({
      success: false,
      error: 'Unable to generate catalog. Please try again.',
      details: error.message
    });
  }
});

/**
 * POST /api/ai/chat
 * Existing craft advisor endpoint.
 */
router.post('/chat', async (req, res) => {
  try {
    const result = await handleAdvisorChat(req.body || {});

    return res.json(result);
  } catch (error) {
    console.error('Craft advisor error:', error.message);

    return res.status(500).json({
      error: 'Unable to get an AI response. Please try again.'
    });
  }
});

/**
 * POST /api/ai/enhance-image
 * Existing image enhancement endpoint.
 */
router.post('/enhance-image', async (req, res) => {
  try {
    if (!req.body?.imageData) {
      return res.status(400).json({
        success: false,
        error: 'Image data is required.'
      });
    }

    const result = await enhanceProductImage(req.body.imageData);

    return res.json(result);
  } catch (error) {
    console.error('Image enhancement error:', error.message);

    return res.status(500).json({
      success: false,
      error: error.message || 'Unable to enhance image.'
    });
  }
});

/**
 * POST /api/ai/pricing
 * Existing fair price calculator endpoint.
 */
router.post('/pricing', async (req, res) => {
  try {
    const pricing = calculateFairPrice(req.body || {});

    return res.json(pricing);
  } catch (error) {
    console.error('Fair price calculation error:', error.message);

    return res.status(500).json({
      error: error.message || 'Unable to calculate product price.'
    });
  }
});

export default router;
