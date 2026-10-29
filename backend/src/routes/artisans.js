import express from 'express';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('artisans').select('*');
      if (!error && data) return res.json(data);
    }
    return res.json([
      {
        id: 'art-1',
        name: 'Shankar Das',
        craft: 'Terracotta Sculpting',
        region: 'Bishnupur, West Bengal',
        rating: 4.9,
        is_verified: true
      }
    ]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
