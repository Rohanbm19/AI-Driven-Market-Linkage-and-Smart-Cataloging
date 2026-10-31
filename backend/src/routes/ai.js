import express from 'express';
import { generateSmartCatalog } from '../services/catalogService.js';
import { handleAdvisorChat } from '../services/chatService.js';
import { enhanceProductImage } from '../services/imageService.js';
import { calculateFairPrice } from '../services/marketService.js';

const router = express.Router();

// 1. POST /api/ai/catalog - Smart AI Catalog generation
router.post('/catalog', (req, res) => {
  try {
    const generated = generateSmartCatalog(req.body);
    return res.json(generated);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. POST /api/ai/chat - Multilingual Craft Advisor
router.post('/chat', (req, res) => {
  try {
    const result = handleAdvisorChat(req.body);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. POST /api/ai/enhance-image - Studio image enhance simulation
router.post('/enhance-image', (req, res) => {
  try {
    const result = enhanceProductImage(req.body.imageData);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. POST /api/ai/pricing - Fair pricing recommendation
router.post('/pricing', (req, res) => {
  try {
    const pricing = calculateFairPrice(req.body);
    return res.json(pricing);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
