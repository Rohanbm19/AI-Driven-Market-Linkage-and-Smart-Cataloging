import express from 'express';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';

const router = express.Router();

// Fallback products in case Supabase is empty or connecting
const DEFAULT_PRODUCTS = [
  {
    id: 'prod-1',
    title: 'Bankura Terracotta Sacred Horse',
    category: 'pottery',
    price: 1850,
    artisan_name: 'Shankar Das',
    region: 'Bishnupur, West Bengal',
    description: 'Handcrafted terracotta horse characterized by erect ears, elongated neck, and delicate ornamental incised patterns.',
    materials: ['Natural Alluvial Clay', 'Mineral Oxide Slip'],
    image_url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    stock: 12,
    rating: 4.9,
    is_verified: true,
    fair_trade: true
  },
  {
    id: 'prod-2',
    title: 'Kanjivaram Pure Mulberry Silk Saree',
    category: 'textiles',
    price: 14200,
    artisan_name: 'Meenakshi Sundaram',
    region: 'Kanchipuram, Tamil Nadu',
    description: 'Woven with three-ply silk thread and pure gold-dipped silver zari.',
    materials: ['100% Pure Mulberry Silk', 'Silver & Gold Zari'],
    image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    stock: 4,
    rating: 5.0,
    is_verified: true,
    fair_trade: true
  }
];

// In-memory cache for fallback when Supabase keys not set
let localProductStore = [...DEFAULT_PRODUCTS];

// 1. GET /api/products - List all products
router.get('/', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return res.json(data);
      }
    }
    return res.json(localProductStore);
  } catch (err) {
    console.error('Error fetching products:', err);
    return res.json(localProductStore);
  }
});

// 2. GET /api/products/:id - Get product details
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return res.json(data);
      }
    }

    const found = localProductStore.find((p) => p.id === id);
    if (found) return res.json(found);

    return res.status(404).json({ error: 'Product not found' });
  } catch (err) {
    console.error('Error fetching product by id:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 3. POST /api/products - Save new product in Supabase
router.post('/', async (req, res) => {
  try {
    const {
      title,
      category,
      price,
      artisan_name,
      region,
      description,
      materials,
      image_url,
      stock,
      tags
    } = req.body;

    if (!title || !price) {
      return res.status(400).json({ error: 'Title and price are required fields.' });
    }

    const newProduct = {
      id: req.body.id || `prod-${Date.now()}`,
      title: title.trim(),
      category: category || 'other',
      price: Number(price),
      artisan_name: artisan_name || 'Master Artisan',
      artisan_id: req.body.artisan_id || `art-${Date.now()}`,
      region: region || 'India',
      description: description || '',
      materials: Array.isArray(materials)
        ? materials
        : (typeof materials === 'string' ? materials.split(',').map(m => m.trim()).filter(Boolean) : []),
      image_url: image_url || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
      enhanced_image_url: req.body.enhanced_image_url || image_url,
      tags: Array.isArray(tags)
        ? tags
        : (typeof tags === 'string' ? tags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean) : ['Handmade']),
      stock: Number(stock) || 1,
      rating: 5.0,
      reviews_count: 0,
      is_verified: true,
      fair_trade: true,
      created_at: new Date().toISOString()
    };

    let savedInSupabase = false;
    let dbError = null;

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('products')
        .insert([newProduct])
        .select();

      if (error) {
        console.error('Supabase DB Insert Error:', error);
        dbError = error.message;
      } else if (data && data.length > 0) {
        savedInSupabase = true;
      }
    }

    // Also keep in-memory backup
    localProductStore = [newProduct, ...localProductStore.filter(p => p.id !== newProduct.id)];

    return res.status(201).json({
      success: true,
      data: newProduct,
      savedInSupabase,
      dbError,
      message: savedInSupabase
        ? 'Successfully stored in Supabase products table!'
        : 'Saved locally in server memory (Configure SUPABASE_URL in backend/.env to persist in cloud).'
    });
  } catch (err) {
    console.error('Product creation failed:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
