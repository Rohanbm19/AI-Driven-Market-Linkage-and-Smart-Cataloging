import express from 'express';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';

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

// GET /api/artisans - List all artisans
router.get('/', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('artisans').select('*');
      if (!error && Array.isArray(data) && data.length > 0) {
        return res.json(data);
      }
    }
    return res.json(localArtisansStore);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/artisans/:id - Get single artisan
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('artisans')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return res.json(data);
      }
    }

    const found = localArtisansStore.find((a) => a.id === id);
    if (found) return res.json(found);

    return res.json(localArtisansStore[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/artisans/:id - Update artisan profile
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    let savedInSupabase = false;
    let dbError = null;

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('artisans')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) {
        console.warn('Supabase artisan update error:', error.message);
        dbError = error.message;
      } else if (data && data.length > 0) {
        savedInSupabase = true;
      }
    }

    // Update in local memory cache
    const index = localArtisansStore.findIndex((a) => a.id === id);
    if (index >= 0) {
      localArtisansStore[index] = { ...localArtisansStore[index], ...updates };
    } else {
      localArtisansStore.push({ id, ...updates });
    }

    const updated = localArtisansStore.find((a) => a.id === id) || { id, ...updates };

    return res.json({
      success: true,
      data: updated,
      savedInSupabase,
      dbError,
      message: 'Artisan profile successfully updated.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/artisans - Register / Create artisan
router.post('/', async (req, res) => {
  try {
    const payload = {
      id: req.body.id || `art-${Date.now()}`,
      name: req.body.name || 'Master Artisan',
      craft: req.body.craft || 'Traditional Craft',
      region: req.body.region || 'India',
      experience: req.body.experience || '10+ years',
      bio: req.body.bio || '',
      avatar: req.body.avatar || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
      is_verified: true,
      rating: 5.0,
      total_sales: 0
    };

    if (isSupabaseConfigured()) {
      await supabase.from('artisans').insert([payload]);
    }

    localArtisansStore.push(payload);
    return res.status(201).json({ success: true, data: payload });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
