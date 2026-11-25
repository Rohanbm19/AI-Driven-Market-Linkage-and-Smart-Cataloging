import { protectArtisanWrites } from '../middleware/auth.js';
import express from 'express';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import { translateArtisan } from '../services/artisanTranslationService.js';

const router = express.Router();
router.use(protectArtisanWrites);

let localArtisansStore = [
  {
    id: 'art-1',
    name: 'Shankar Das',
    craft: 'Terracotta & Alluvial Clay Sculpting',
    region: 'Bishnupur, West Bengal',
    experience: '28 years',
    bio: 'Third-generation terracotta master craftsman honored with State Handicrafts Merit Award. Dedicated to keeping Bishnupur temple terracotta motifs alive in modern functional art.',
    avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
    rating: 4.9,
    total_sales: 342,
    is_verified: true,
    badges: ['Master Craftsman', 'Fair Trade Certified', 'GI Custodian']
  }
];

// GET /api/artisans - List all artisans
router.get('/', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await req.db.from('artisans').select('*');
      if (!error && Array.isArray(data) && data.length > 0) {
        return res.json(data);
      }
    }
    return res.json(localArtisansStore);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/artisans/:id - Get single artisan with AI localization
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const language = String(req.query.lang || 'en').toLowerCase();

  try {
    let artisan = null;

    if (isSupabaseConfigured()) {
      const { data, error } = await req.db
        .from('artisans')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Artisan lookup error:', error.message);
      } else {
        artisan = data;
      }
    }

    if (!artisan) {
      artisan = localArtisansStore.find((a) => a.id === id)
        || localArtisansStore[0];
    }

    const localized = await translateArtisan(artisan, language);

    return res.json({
      success: true,
      data: {
        ...localized,
        original_profile: artisan
      }
    });
  } catch (err) {
    console.error('Artisan translation error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Unable to load artisan profile.'
    });
  }
});
// PUT /api/artisans/:id - Update artisan profile
router.put('/:id', async (req, res) => {
  if (req.params.id !== req.user.id) return res.status(403).json({ error: 'You can only update your own studio.' });
  const { name, craft, region, experience, bio, avatar } = req.body;
  const { data, error } = await req.db.from('artisans').upsert({ id: req.user.id, name, craft, region, experience, bio, avatar }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  return res.json({ success: true, data, savedInSupabase: true });
});
router.post('/', async (req, res) => {
  const { name, craft, region, experience, bio, avatar } = req.body;
  const { data, error } = await req.db.from('artisans').insert({ id: req.user.id, name, craft, region, experience, bio, avatar }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  return res.status(201).json({ success: true, data, savedInSupabase: true });
});
export default router;

