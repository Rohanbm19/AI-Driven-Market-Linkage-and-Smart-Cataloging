import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

export const api = {
  async submitEnquiry(enquiry) {
    if (!isSupabaseConfigured()) {
      throw new Error('Enquiry submission is unavailable because Supabase is not configured.');
    }

    const { error } = await supabase.from('buyer_enquiries').insert(enquiry);
    if (error) throw error;
  },

  async getBuyerEnquiries(buyerId) {
    if (!isSupabaseConfigured()) {
      throw new Error('Enquiry history is unavailable because Supabase is not configured.');
    }

    const { data, error } = await supabase
      .from('buyer_enquiries')
      .select('id, product_id, product_title, buyer_name, buyer_email, quantity, message, created_at')
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getProducts() {
    try {
      const res = await fetch(`${API_BASE_URL}/products`);
      if (res.ok) return await res.json();
    } catch (e) {
      // fallback to mock
    }
    return MOCK_PRODUCTS;
  },

  async getProductById(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`);
      if (res.ok) return await res.json();
    } catch (e) {
      // fallback to mock
    }
    return MOCK_PRODUCTS.find(p => p.id === id) || MOCK_PRODUCTS[0];
  },

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

    // Simulated AI response
    await new Promise(r => setTimeout(r, 1200));
    return {
      title: `${formData.craftType || 'Artisanal'} Heritage Handcrafted Piece`,
      description: `Authentic handmade creation crafted from ${formData.materials || 'fine traditional materials'} in ${formData.region || 'India'}. Made with ancestral techniques passed down across generations. Each detail represents timeless artisanal mastery.`,
      suggestedPrice: 2200,
      priceRange: { min: 1950, max: 2600 },
      tags: ['Authentic Handmade', 'Eco-friendly', 'GI Certified', 'Artisan Direct'],
      seoKeywords: 'handmade indian craft, artisan decor, fair trade gift, heritage art',
      story: 'Every curve and stroke on this masterpiece is shaped by skilled hands, keeping centuries of Indian artistic tradition thriving in a modern world.'
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
