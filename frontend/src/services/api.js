import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const LOCAL_STORAGE_KEY = 'kalasetu_custom_products';

// Curated artisan products for demonstration and fallback
export const MOCK_PRODUCTS = [
  {
    id: 'prod-1',
    title: 'Bankura Terracotta Sacred Horse',
    category: 'pottery',
    price: 1850,
    artisan_name: 'Shankar Das',
    artisan_id: 'art-1',
    region: 'Bishnupur, West Bengal',
    description: 'Handcrafted terracotta horse characterized by erect ears, elongated neck, and delicate ornamental incised patterns. Fired in traditional clay kilns using age-old alluvial clay.',
    materials: ['Natural Alluvial Clay', 'Mineral Oxide Slip'],
    image_url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    enhanced_image_url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=90',
    tags: ['GI Tagged', 'Terracotta', 'Handmade'],
    stock: 12,
    rating: 4.9,
    reviews_count: 28,
    is_verified: true,
    fair_trade: true
  },
  {
    id: 'prod-2',
    title: 'Kanjivaram Pure Mulberry Silk Saree',
    category: 'textiles',
    price: 14200,
    artisan_name: 'Meenakshi Sundaram',
    artisan_id: 'art-2',
    region: 'Kanchipuram, Tamil Nadu',
    description: 'Woven with three-ply silk thread and pure gold-dipped silver zari. Features traditional temple gopuram border motif and rich pallu crafted on historic pit looms.',
    materials: ['100% Pure Mulberry Silk', 'Silver & Gold Zari'],
    image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    enhanced_image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=90',
    tags: ['Silk Mark', 'Handloom', 'Zari Work'],
    stock: 4,
    rating: 5.0,
    reviews_count: 42,
    is_verified: true,
    fair_trade: true
  },
  {
    id: 'prod-3',
    title: 'Moradabad Engraved Brass Urli Bowl',
    category: 'metal',
    price: 3200,
    artisan_name: 'Mohammad Rais',
    artisan_id: 'art-3',
    region: 'Moradabad, Uttar Pradesh',
    description: 'Solid sand-cast brass urli bowl with intricate floral hand-chiseling (Naqshi work). Ideal for floating flowers, candles, and heritage home decor.',
    materials: ['Virgin Brass', 'Antique Patina Finish'],
    image_url: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=800&q=80',
    enhanced_image_url: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=1200&q=90',
    tags: ['Brass', 'Chiseled', 'Heritage'],
    stock: 9,
    rating: 4.8,
    reviews_count: 19,
    is_verified: true,
    fair_trade: true
  },
  {
    id: 'prod-4',
    title: 'Channapatna Lacquerware Wooden Nesting Dolls',
    category: 'woodwork',
    price: 1450,
    artisan_name: 'Gowramma & Venkatesh',
    artisan_id: 'art-4',
    region: 'Channapatna, Karnataka',
    description: 'Hand-turned Ivory Wood (Wrightia Tinctoria) toys coated with safe non-toxic organic vegetable dyes and lustrous natural shellac polish.',
    materials: ['Aale Mara (Ivory Wood)', 'Natural Vegetable Dyes'],
    image_url: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80',
    enhanced_image_url: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=1200&q=90',
    tags: ['GI Tagged', 'Eco-friendly', 'Child-safe'],
    stock: 25,
    rating: 4.9,
    reviews_count: 67,
    is_verified: true,
    fair_trade: true
  },
  {
    id: 'prod-5',
    title: 'Blue Pottery Jaipur Floral Ceramic Vase',
    category: 'pottery',
    price: 2100,
    artisan_name: 'Ramkishan Kumhar',
    artisan_id: 'art-5',
    region: 'Jaipur, Rajasthan',
    description: 'Unique quartz-based pottery fired once with Egyptian blue and cobalt oxide glazes. Delicately hand-painted with Persian floral vine motifs.',
    materials: ['Quartz Powder', 'Glass Frit', 'Cobalt Glaze'],
    image_url: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80',
    enhanced_image_url: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=1200&q=90',
    tags: ['GI Tagged', 'Blue Pottery', 'Lead Free'],
    stock: 15,
    rating: 4.7,
    reviews_count: 31,
    is_verified: true,
    fair_trade: true
  },
  {
    id: 'prod-6',
    title: 'Pochampally Ikat Handwoven Cotton Shawl',
    category: 'textiles',
    price: 2450,
    artisan_name: 'Yadagiri Chary',
    artisan_id: 'art-6',
    region: 'Bhoodan Pochampally, Telangana',
    description: 'Distinctive geometric tie-and-dye motifs achieved through precision warp and weft tieing. Breathable handspun cotton with natural indigo dye accents.',
    materials: ['Organic Handspun Cotton', 'Azo-Free Dyes'],
    image_url: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=800&q=80',
    enhanced_image_url: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=1200&q=90',
    tags: ['Ikat', 'Handloom', 'Natural Dye'],
    stock: 8,
    rating: 4.85,
    reviews_count: 14,
    is_verified: true,
    fair_trade: true
  }
];

export const MOCK_ARTISAN = {
  id: 'art-1',
  name: 'Shankar Das',
  craft: 'Terracotta & Alluvial Clay Sculpting',
  region: 'Bishnupur, West Bengal',
  experience: '28 years',
  bio: 'Third-generation terracotta master craftsman honored with State Handicrafts Merit Award. Dedicated to keeping Bishnupur temple terracotta motifs alive in modern functional art.',
  avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
  is_verified: true,
  rating: 4.9,
  total_sales: 342,
  badges: ['Master Craftsman', 'Fair Trade Certified', 'GI Custodian']
};

// Local storage helpers
function getLocalProducts() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to read local products:', e);
    return [];
  }
}

function saveProductLocally(product) {
  try {
    const current = getLocalProducts();
    const updated = [product, ...current.filter(p => p.id !== product.id)];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save product locally:', e);
  }
}

function mergeProducts(primaryList, secondaryList, fallbackList = []) {
  const map = new Map();
  // Primary (e.g. Supabase) takes highest precedence
  primaryList.forEach(p => map.set(p.id, p));
  // Secondary (e.g. Local custom) adds if not already present
  secondaryList.forEach(p => {
    if (!map.has(p.id)) map.set(p.id, p);
  });
  // Fallback defaults
  fallbackList.forEach(p => {
    if (!map.has(p.id)) map.set(p.id, p);
  });
  return Array.from(map.values());
}

export const api = {
  /**
   * Fetch all products from Supabase, local cache, or fallback mock list
   */
  async getProducts() {
    const local = getLocalProducts();

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          return mergeProducts(data, local, MOCK_PRODUCTS);
        } else if (error) {
          console.warn('Supabase fetch error, using local/mock:', error.message);
        }
      } catch (err) {
        console.warn('Supabase connection failed, using local/mock:', err);
      }
    }

    // Try express backend if available
    try {
      const res = await fetch(`${API_BASE_URL}/products`);
      if (res.ok) {
        const backendData = await res.json();
        return mergeProducts(backendData, local, MOCK_PRODUCTS);
      }
    } catch (e) {
      // Backend not running
    }

    return mergeProducts([], local, MOCK_PRODUCTS);
  },

  /**
   * Fetch a single product by ID
   */
  async getProductById(id) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) return data;
      } catch (e) {
        console.warn('Supabase fetch product error:', e);
      }
    }

    const local = getLocalProducts();
    const foundLocal = local.find(p => p.id === id);
    if (foundLocal) return foundLocal;

    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`);
      if (res.ok) return await res.json();
    } catch (e) {
      // Backend not running
    }

    return MOCK_PRODUCTS.find(p => p.id === id) || MOCK_PRODUCTS[0];
  },

  /**
   * Upload an image file to Supabase Storage (product-images bucket)
   * Falls back to a base64 Data URL if Supabase is not configured or fails
   */
  async uploadProductImage(file) {
    if (!file) return null;

    if (isSupabaseConfigured()) {
      try {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const filePath = `crafts/${fileName}`;

        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (!error) {
          const { data: publicUrlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

          if (publicUrlData?.publicUrl) {
            return {
              url: publicUrlData.publicUrl,
              storage: 'supabase'
            };
          }
        } else {
          console.warn('Supabase storage upload error:', error.message);
        }
      } catch (err) {
        console.warn('Storage upload failed:', err);
      }
    }

    // Fallback: convert file to base64 data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          url: reader.result,
          storage: 'local'
        });
      };
      reader.readAsDataURL(file);
    });
  },

  /**
   * Create a new product in Supabase and locally
   */
  async createProduct(productData) {
    const id = productData.id || `prod-${Date.now()}`;
    const payload = {
      id,
      title: productData.title.trim(),
      category: productData.category || 'other',
      price: Number(productData.price) || 0,
      artisan_name: productData.artisan_name || 'Master Artisan',
      artisan_id: productData.artisan_id || 'art-user',
      region: productData.region || 'India',
      description: productData.description || '',
      materials: Array.isArray(productData.materials)
        ? productData.materials
        : (typeof productData.materials === 'string'
          ? productData.materials.split(',').map(m => m.trim()).filter(Boolean)
          : []),
      image_url: productData.image_url || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
      enhanced_image_url: productData.enhanced_image_url || productData.image_url || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=90',
      tags: Array.isArray(productData.tags)
        ? productData.tags
        : (typeof productData.tags === 'string'
          ? productData.tags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean)
          : ['Handmade']),
      stock: Number(productData.stock) || 1,
      rating: 5.0,
      reviews_count: 0,
      is_verified: true,
      fair_trade: true,
      created_at: new Date().toISOString()
    };

    let savedInSupabase = false;
    let supabaseError = null;
    let savedRecord = payload;

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('products')
          .insert([payload])
          .select();

        if (error) {
          console.error('Supabase DB Insert Error:', error);
          supabaseError = error.message;
        } else if (data && data.length > 0) {
          savedInSupabase = true;
          savedRecord = data[0];
        }
      } catch (err) {
        console.error('Supabase DB Request Exception:', err);
        supabaseError = err.message || 'Database connection error';
      }
    }

    // Always persist to local cache so marketplace instantly updates
    saveProductLocally(savedRecord);

    return {
      success: true,
      data: savedRecord,
      savedInSupabase,
      supabaseConfigured: isSupabaseConfigured(),
      supabaseError
    };
  },

  /**
   * AI Catalog generator endpoint or local AI simulation
   */
  async generateSmartCatalog(formData) {
    try {
      const res = await fetch(`${API_BASE_URL}/ai/catalog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // fallback mock generator
    }

    // Realistic generative AI processing
    await new Promise(r => setTimeout(r, 1100));

    const craftType = formData.craftType || 'Heritage';
    const region = formData.region || 'Traditional Artisan Hub';
    const materials = formData.materials || 'Pure Natural Elements';

    // Intelligent title generation based on craft
    let generatedTitle = `${region.split(',')[0].trim()} Handcrafted ${craftType}`;
    if (craftType.toLowerCase().includes('terracotta') || craftType.toLowerCase().includes('clay')) {
      generatedTitle = `${region.split(',')[0].trim()} Ceremonial Terracotta Sculpture`;
    } else if (craftType.toLowerCase().includes('silk') || craftType.toLowerCase().includes('textile') || craftType.toLowerCase().includes('handloom')) {
      generatedTitle = `${region.split(',')[0].trim()} Handwoven Pure Zari Silk Creation`;
    } else if (craftType.toLowerCase().includes('brass') || craftType.toLowerCase().includes('metal')) {
      generatedTitle = `${region.split(',')[0].trim()} Hand-Chiseled Antique Brass Urli`;
    } else if (craftType.toLowerCase().includes('wood')) {
      generatedTitle = `${region.split(',')[0].trim()} Organic Lacquer Turned Wood Masterpiece`;
    } else if (craftType.toLowerCase().includes('pottery') || craftType.toLowerCase().includes('ceramic')) {
      generatedTitle = `${region.split(',')[0].trim()} Glazed Quartz Blue Pottery Decorative Vessel`;
    }

    return {
      title: generatedTitle,
      description: formData.description
        ? `${formData.description} Masterfully created in ${region} using traditional ${materials}. Every piece is sculpted and detailed through ancestral techniques passed down across generations, representing authentic cultural legacy.`
        : `Authentic handcrafted masterpiece lovingly created from ${materials} in ${region}. Built using ancestral methods that celebrate time-honored artisanal heritage and sustainable craftsmanship.`,
      suggestedPrice: 2450,
      priceRange: { min: 2100, max: 2850 },
      tags: ['Authentic Handmade', 'Eco-friendly', 'GI Certified', 'Artisan Direct', 'Fair Trade'],
      seoKeywords: `${craftType.toLowerCase()}, handmade craft, ${region.toLowerCase()} art, fair trade artisan`,
      story: 'Every curve, weave, and chisel stroke on this creation is shaped with deep reverence for generations of Indian artistic tradition.'
    };
  },

  async askAssistant(message, language = 'en') {
    try {
      const res = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, language })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // mock response
    }

    await new Promise(r => setTimeout(r, 800));
    return {
      reply: `Namaste! I am your KalaSetu craft advisor. How can I help you today? I can help you price your craft, write descriptions in multiple languages, find buyer trends, or enhance your product photos.`
    };
  },

  async enhanceImage(imageData) {
    try {
      const res = await fetch(`${API_BASE_URL}/ai/enhance-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // fallback mock
    }

    await new Promise(r => setTimeout(r, 1500));
    return {
      success: true,
      enhancedUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=95'
    };
  }
};
