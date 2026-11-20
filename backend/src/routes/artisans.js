
import express from 'express';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import { translateArtisan } from '../services/artisanTranslationService.js';

const router = express.Router();

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

// GET /api/artisans
router.get('/', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('artisans')
        .select('*');

      if (!error && Array.isArray(data) && data.length > 0) {
        return res.json(data);
      }
    }

    return res.json(localArtisansStore);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/artisans/:id?lang=hi
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const language = String(req.query.lang || 'en').toLowerCase();

  try {
    let artisan = null;

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('artisans')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.warn('Supabase artisan fetch error:', error.message);
      } else {
        artisan = data;
      }
    }

    if (!artisan) {
      artisan = localArtisansStore.find((item) => item.id === id);
    }

    if (!artisan) {
      return res.status(404).json({
        success: false,
        message: 'Artisan not found.'
      });
    }

    const localizedArtisan = await translateArtisan(artisan, language);

    return res.json({
      success: true,
      data: localizedArtisan
    });
  } catch (err) {
    console.error('Artisan profile error:', err);

    return res.status(500).json({
      success: false,
      message: 'Could not load the artisan profile.',
      error: err.message
    });
  }
});

// PUT /api/artisans/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    let savedInSupabase = false;
    let dbError = null;
    let updated = null;

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('artisans')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        dbError = error.message;
        console.warn('Supabase artisan update error:', error.message);
      } else if (data) {
        savedInSupabase = true;
        updated = data;
      }
    }

    const index = localArtisansStore.findIndex((item) => item.id === id);

    if (index >= 0) {
      localArtisansStore[index] = {
        ...localArtisansStore[index],
        ...updates
      };
      updated = updated || localArtisansStore[index];
    } else if (!updated) {
      localArtisansStore.push({ id, ...updates });
      updated = { id, ...updates };
    }

    return res.json({
      success: true,
      data: updated,
      savedInSupabase,
      dbError,
      message: 'Artisan profile successfully updated.'
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/artisans
router.post('/', async (req, res) => {
  try {
    const payload = {
      id: req.body.id || `art-${Date.now()}`,
      name: req.body.name || 'Master Artisan',
      craft: req.body.craft || 'Traditional Craft',
      region: req.body.region || 'India',
      experience: req.body.experience || '10+ years',
      bio: req.body.bio || '',
      avatar: req.body.avatar ||
        'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
      is_verified: true,
      rating: 5.0,
      total_sales: 0,
      badges: req.body.badges || []
    };

    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('artisans')
        .insert([payload]);

      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Could not create artisan.',
          error: error.message
        });
      }
    }

    localArtisansStore.push(payload);

    return res.status(201).json({
      success: true,
      data: payload
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
