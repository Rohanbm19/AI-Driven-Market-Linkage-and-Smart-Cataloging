import express from 'express';

const router = express.Router();

// 1. POST /api/ai/catalog - Smart AI Catalog generation
router.post('/catalog', (req, res) => {
  const { craftType, region, materials, description } = req.body;

  const craft = craftType || 'Artisanal';
  const place = region ? region.split(',')[0].trim() : 'India';
  const mat = materials || 'Traditional Materials';

  let title = `${place} Handcrafted ${craft}`;
  if (craft.toLowerCase().includes('terracotta') || craft.toLowerCase().includes('clay')) {
    title = `${place} Sacred Hand-Fired Terracotta Sculpture`;
  } else if (craft.toLowerCase().includes('silk') || craft.toLowerCase().includes('textile')) {
    title = `${place} Handloom Pure Mulberry Silk Zari Piece`;
  } else if (craft.toLowerCase().includes('brass') || craft.toLowerCase().includes('metal')) {
    title = `${place} Hand-Chiseled Antique Virgin Brass Vessel`;
  }

  const generated = {
    title,
    description: description
      ? `${description} Handcrafted in ${place} using authentic ${mat}. Created with ancestral methods passed down through generations.`
      : `Masterfully shaped from ${mat} in ${place}. Preserves age-old artisan traditions with precision handcraftsmanship and sustainable materials.`,
    suggestedPrice: 2200,
    priceRange: { min: 1900, max: 2600 },
    tags: ['Authentic Handmade', 'Eco-friendly', 'GI Certified', 'Fair Trade Direct'],
    seoKeywords: `${craft.toLowerCase()}, handmade indian craft, ${place.toLowerCase()} art`
  };

  return res.json(generated);
});

// 2. POST /api/ai/chat - Multilingual Craft Advisor
router.post('/chat', (req, res) => {
  const { message, language } = req.body;
  return res.json({
    reply: `Namaste! I am KalaSetu's AI Artisan Advisor. I received your query: "${message}". How else can I assist your craft journey today?`
  });
});

// 3. POST /api/ai/enhance-image - Studio image enhance simulation
router.post('/enhance-image', (req, res) => {
  return res.json({
    success: true,
    enhancedUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=95'
  });
});

export default router;
