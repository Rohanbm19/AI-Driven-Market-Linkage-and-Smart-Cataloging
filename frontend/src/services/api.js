import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';

const configuredApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
  .trim()
  .replace(/\/+$/, '');

const API_BASE_URL = /\/api$/i.test(configuredApiUrl)
  ? configuredApiUrl
  : `${configuredApiUrl}/api`;

const LOCAL_STORAGE_PRODUCTS_KEY = 'kalasetu_custom_products';
const LOCAL_STORAGE_ARTISAN_KEY = 'kalasetu_artisan_profile';
const LOCAL_STORAGE_ENQUIRIES_KEY = 'kalasetu_enquiries';

export const MOCK_PRODUCTS = [
  {
    id: 'prod-1',
    title: 'Bankura Terracotta Sacred Horse',
    category: 'pottery',
    price: 1850,
    artisan_name: 'Shankar Das',
    artisan_id: 'art-1',
    region: 'Bishnupur, West Bengal',
    description: 'Handcrafted terracotta horse characterized by erect ears, elongated neck, and delicate ornamental incised patterns.',
    materials: ['Natural Alluvial Clay', 'Mineral Oxide Slip'],
    image_url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    enhanced_image_url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=90',
    tags: ['Terracotta', 'Handmade'],
    stock: 12,
    rating: 4.9,
    reviews_count: 28,
    is_verified: false,
    fair_trade: false
  },
  {
    id: 'prod-2',
    title: 'Kanjivaram Silk Saree',
    category: 'textiles',
    price: 14200,
    artisan_name: 'Meenakshi Sundaram',
    artisan_id: 'art-2',
    region: 'Kanchipuram, Tamil Nadu',
    description: 'Traditional silk saree featuring detailed weaving and decorative borders.',
    materials: ['Silk', 'Zari'],
    image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    enhanced_image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=90',
    tags: ['Silk', 'Handloom'],
    stock: 4,
    rating: 5.0,
    reviews_count: 42,
    is_verified: false,
    fair_trade: false
  },
  {
    id: 'prod-3',
    title: 'Moradabad Brass Urli Bowl',
    category: 'metal',
    price: 3200,
    artisan_name: 'Mohammad Rais',
    artisan_id: 'art-3',
    region: 'Moradabad, Uttar Pradesh',
    description: 'Brass urli bowl with decorative hand-engraved patterns.',
    materials: ['Brass'],
    image_url: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=800&q=80',
    enhanced_image_url: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=1200&q=90',
    tags: ['Brass', 'Handmade'],
    stock: 9,
    rating: 4.8,
    reviews_count: 19,
    is_verified: false,
    fair_trade: false
  },
  {
    id: 'prod-4',
    title: 'Channapatna Wooden Dolls',
    category: 'woodwork',
    price: 1450,
    artisan_name: 'Gowramma & Venkatesh',
    artisan_id: 'art-4',
    region: 'Channapatna, Karnataka',
    description: 'Wooden dolls made using traditional turning and decorative techniques.',
    materials: ['Wood', 'Natural Dyes'],
    image_url: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80',
    enhanced_image_url: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=1200&q=90',
    tags: ['Woodwork', 'Handmade'],
    stock: 25,
    rating: 4.9,
    reviews_count: 67,
    is_verified: false,
    fair_trade: false
  },
  {
    id: 'prod-5',
    title: 'Jaipur Blue Pottery Vase',
    category: 'pottery',
    price: 2100,
    artisan_name: 'Ramkishan Kumhar',
    artisan_id: 'art-5',
    region: 'Jaipur, Rajasthan',
    description: 'Decorative blue pottery vase with hand-painted floral patterns.',
    materials: ['Quartz Powder', 'Glass Frit', 'Cobalt Glaze'],
    image_url: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80',
    enhanced_image_url: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=1200&q=90',
    tags: ['Blue Pottery', 'Handmade'],
    stock: 15,
    rating: 4.7,
    reviews_count: 31,
    is_verified: false,
    fair_trade: false
  }
];

export const MOCK_ARTISAN = {
  id: 'art-1',
  name: 'Shankar Das',
  craft: 'Terracotta & Alluvial Clay Sculpting',
  region: 'Bishnupur, West Bengal',
  experience: '28 years',
  bio: 'Third-generation terracotta master craftsman.',
  avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
  is_verified: false,
  rating: 4.9,
  total_sales: 342,
  badges: ['Master Craftsman']
};

// ==========================================
// LOCAL STORAGE HELPERS
// ==========================================

function getLocalProducts() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PRODUCTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Failed to read local products:', error);
    return [];
  }
}

function saveProductLocally(product) {
  try {
    const current = getLocalProducts();

    const updated = [
      product,
      ...current.filter(item => item.id !== product.id)
    ];

    localStorage.setItem(
      LOCAL_STORAGE_PRODUCTS_KEY,
      JSON.stringify(updated)
    );
  } catch (error) {
    console.error('Failed to save local product:', error);
  }
}

function removeProductLocally(productId) {
  try {
    const updated = getLocalProducts().filter(
      product => product.id !== productId
    );

    localStorage.setItem(
      LOCAL_STORAGE_PRODUCTS_KEY,
      JSON.stringify(updated)
    );
  } catch (error) {
    console.error('Failed to remove local product:', error);
  }
}

function cleanDeletedLocalProducts() {
  removeProductLocally('prod-6');
}

function getLocalArtisan() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ARTISAN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocalArtisan(artisan) {
  try {
    localStorage.setItem(
      LOCAL_STORAGE_ARTISAN_KEY,
      JSON.stringify(artisan)
    );
  } catch (error) {
    console.error('Failed to save artisan locally:', error);
  }
}

// ==========================================
// RESPONSE AND DATA HELPERS
// ==========================================

async function readResponse(response) {
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.details ||
      result.dbError ||
      result.error ||
      result.message ||
      `Request failed with status ${response.status}`
    );
  }

  return result;
}

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value.split(',').map(item => item.trim()).filter(Boolean);
  }

  return [];
}

// ==========================================
// SUPABASE AUTH HELPERS
// ==========================================

async function currentUser() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) throw error;

  if (!user) {
    throw new Error('Please sign in first.');
  }

  return user;
}

async function requireArtisan() {
  const user = await currentUser();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;

  if (!profile) {
    throw new Error('Your user profile could not be found.');
  }

  if (profile.role !== 'artisan') {
    throw new Error('Artisan access is required.');
  }

  return user;
}

async function getAuthHeaders(includeContentType = true) {
  await requireArtisan();

  const {
    data: { session },
    error
  } = await supabase.auth.getSession();

  if (error) throw error;

  if (!session?.access_token) {
    throw new Error('Please sign in again.');
  }

  return {
    ...(includeContentType
      ? { 'Content-Type': 'application/json' }
      : {}),
    Authorization: `Bearer ${session.access_token}`
  };
}

// ==========================================
// API METHODS
// ==========================================

export const api = {

  // ==========================================
  // MARKET INSIGHTS
  // ==========================================

  async getMarketInsights() {
    const response = await fetch(`${API_BASE_URL}/market/insights`);
    return await readResponse(response);
  },

  async getLiveDemandForecast(category) {
    const response = await fetch(
      `${API_BASE_URL}/market/ml/demand?category=${encodeURIComponent(category)}`
    );

    return await readResponse(response);
  },

  // ==========================================
  // ML MODEL INSIGHTS
  // ==========================================

  async getMlInsights() {
    const response = await fetch(`${API_BASE_URL}/market/ml/insights`);
    return await readResponse(response);
  },

  async getMlTrends() {
    const response = await fetch(`${API_BASE_URL}/market/ml/trends`);
    return await readResponse(response);
  },

  async predictMlDemand(data) {
    const response = await fetch(`${API_BASE_URL}/market/ml/demand`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    return await readResponse(response);
  },

  async predictMlPrice(data) {
    const response = await fetch(`${API_BASE_URL}/market/ml/price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    return await readResponse(response);
  },

  async predictMlSegment(data) {
    const response = await fetch(`${API_BASE_URL}/market/ml/segment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    return await readResponse(response);
  },

  // ==========================================
  // PRODUCTS
  // ==========================================

  async getProducts(language = 'en') {
    const lang = language || 'en';

    cleanDeletedLocalProducts();

    const response = await fetch(
      `${API_BASE_URL}/products?lang=${encodeURIComponent(lang)}`
    );

    const products = await readResponse(response);

    if (!Array.isArray(products)) {
      throw new Error('Invalid product response from backend.');
    }

    return products;
  },

  async getProductById(id, language = 'en') {
    cleanDeletedLocalProducts();

    const response = await fetch(
      `${API_BASE_URL}/products/${encodeURIComponent(id)}?lang=${encodeURIComponent(language || 'en')}`
    );

    return await readResponse(response);
  },

  async trackProductView(id) {
    const response = await fetch(
      `${API_BASE_URL}/market/products/${encodeURIComponent(id)}/view`,
      { method: 'POST' }
    );

    return await readResponse(response);
  },

  // ==========================================
  // PRODUCT IMAGE UPLOAD
  // ==========================================

  async uploadProductImage(file) {
    if (!file) return null;

    if (isSupabaseConfigured()) {
      try {
        const fileExt = file.name.split('.').pop() || 'jpg';

        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 8)}.${fileExt}`;

        const filePath = `crafts/${fileName}`;

        const { error } = await supabase.storage
          .from('product-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (!error) {
          const { data } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

          if (data?.publicUrl) {
            return {
              url: data.publicUrl,
              storage: 'supabase'
            };
          }
        }

        console.warn('Supabase image upload failed:', error?.message);
      } catch (error) {
        console.warn('Storage upload failed:', error.message);
      }
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        resolve({
          url: reader.result,
          storage: 'local'
        });
      };

      reader.onerror = () => {
        reject(new Error('Unable to read the selected image.'));
      };

      reader.readAsDataURL(file);
    });
  },

  // ==========================================
  // CREATE PRODUCT
  // ==========================================

  async createProduct(productData) {
    const user = await currentUser();
    const id = productData.id || `prod-${Date.now()}`;

    const payload = {
      id,
      title: String(productData.title || '').trim(),
      category: productData.category || 'other',
      price: Number(productData.price),
      artisan_name: productData.artisan_name || 'Master Artisan',
      artisan_id: user.id,
      region: productData.region || '',
      description: productData.description || '',
      materials: normalizeArray(productData.materials),
      image_url: productData.image_url || null,
      original_image_url:
        productData.original_image_url || productData.image_url || null,
      enhanced_image_url: productData.enhanced_image_url ?? null,
      tags: normalizeArray(productData.tags),
      stock: Number(productData.stock ?? 1),
      translations: productData.translations || undefined
    };

    if (!payload.title) {
      throw new Error('Product title is required.');
    }

    if (!Number.isFinite(payload.price) || payload.price < 0) {
      throw new Error('Please enter a valid product price.');
    }

    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    const result = await readResponse(response);

    if (!result.success || !result.savedInSupabase || !result.data) {
      throw new Error(
        result.dbError ||
        result.error ||
        'The product was not saved to Supabase.'
      );
    }

    saveProductLocally(result.data);

    return {
      success: true,
      data: result.data,
      savedInSupabase: true,
      translationsSaved: result.translationsSaved,
      translationError: result.translationError
    };
  },

  // ==========================================
  // UPDATE PRODUCT
  // ==========================================

  async updateProduct(id, productData) {
    const updates = { ...productData };

    if (updates.price !== undefined) {
      updates.price = Number(updates.price);
    }

    if (updates.stock !== undefined) {
      updates.stock = Number(updates.stock);
    }

    if (updates.materials !== undefined) {
      updates.materials = normalizeArray(updates.materials);
    }

    if (updates.tags !== undefined) {
      updates.tags = normalizeArray(updates.tags);
    }

    const response = await fetch(
      `${API_BASE_URL}/products/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        headers: await getAuthHeaders(),
        body: JSON.stringify(updates)
      }
    );

    const result = await readResponse(response);

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Unable to update product.');
    }

    saveProductLocally(result.data);

    return {
      success: true,
      data: result.data,
      savedInSupabase: true,
      translationsSaved: result.translationsSaved,
      translationError: result.translationError
    };
  },

  // ==========================================
  // DELETE PRODUCT
  // ==========================================

  async deleteProduct(id) {
    const response = await fetch(
      `${API_BASE_URL}/products/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: await getAuthHeaders(false)
      }
    );

    const result = await readResponse(response);

    if (!result.success) {
      throw new Error(result.error || 'Unable to delete product.');
    }

    removeProductLocally(id);

    return {
      success: true,
      id,
      deletedInSupabase: true
    };
  },

  // ==========================================
  // ARTISAN PROFILE
  // ==========================================

  async getArtisanProfile(id = 'art-1', language = 'en') {
    const lang = language || 'en';

    try {
      const response = await fetch(
        `${API_BASE_URL}/artisans/${encodeURIComponent(id)}?lang=${encodeURIComponent(lang)}`
      );

      const result = await readResponse(response);

      if (!result.success || !result.data) {
        throw new Error(
          result.message || 'Invalid artisan profile response.'
        );
      }

      return result.data;
    } catch (error) {
      console.error('Artisan profile fetch failed:', error.message);

      if (lang !== 'en') throw error;

      const local = getLocalArtisan();

      if (local && local.id === id) {
        return local;
      }

      if (isSupabaseConfigured()) {
        try {
          const { data, error: dbError } = await supabase
            .from('artisans')
            .select('*')
            .eq('id', id)
            .maybeSingle();

          if (!dbError && data) return data;
        } catch (dbError) {
          console.warn(
            'Supabase artisan lookup failed:',
            dbError.message
          );
        }
      }

      return MOCK_ARTISAN;
    }
  },

  async updateArtisanProfile(id, updatedData) {
    const response = await fetch(
      `${API_BASE_URL}/artisans/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        headers: await getAuthHeaders(),
        body: JSON.stringify(updatedData)
      }
    );

    const result = await readResponse(response);

    if (!result.success || !result.data) {
      throw new Error(
        result.message ||
        result.dbError ||
        'Unable to update artisan profile.'
      );
    }

    saveLocalArtisan(result.data);

    return {
      success: true,
      data: result.data,
      savedInSupabase: result.savedInSupabase,
      supabaseError: result.dbError || null
    };
  },

  // ==========================================
  // ENQUIRIES
  // ==========================================

  // Get enquiries belonging to the logged-in artisan
  async getEnquiries() {
    const user = await requireArtisan();

    const { data, error } = await supabase
      .from('enquiries')
      .select('*')
      .eq('artisan_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  },

  // Submit buyer enquiry to the product owner
  
async submitEnquiry(enquiryData) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const buyer = await currentUser();

  const payload = {
    id: `enq-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}`,

    buyer_id: buyer.id,
    artisan_id: enquiryData.artisan_id,
    product_id: String(enquiryData.product_id),
    product_title: String(enquiryData.product_title).trim(),

    buyer_name: String(enquiryData.buyer_name).trim(),
    buyer_email: String(enquiryData.buyer_email).trim(),
    phone: String(enquiryData.phone).trim(),
    buyer_location: String(enquiryData.buyer_location).trim(),

    quantity: String(enquiryData.quantity),
    message: String(enquiryData.message).trim(),

    status: 'pending',
    reply: null
  };

  console.log('Submitting enquiry:', {
    buyer_id: payload.buyer_id,
    artisan_id: payload.artisan_id,
    product_id: payload.product_id
  });

  // INSERT ONLY — do not use .select()
  const { error } = await supabase
    .from('enquiries')
    .insert(payload);

  if (error) {
    console.error('Supabase enquiry error:', error);
    throw error;
  }

  return {
    success: true,
    data: payload
  };
},

  // Approve or reject a buyer enquiry
  async updateEnquiryStatus(id, status) {
    const allowedStatuses = ['approved', 'rejected'];

    if (!allowedStatuses.includes(status)) {
      throw new Error('Invalid enquiry status.');
    }

    const user = await requireArtisan();

    const { data, error } = await supabase
      .from('enquiries')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('artisan_id', user.id)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      throw new Error(
        'No enquiry was updated. Check that this enquiry belongs to your artisan account and that Supabase RLS allows the update.'
      );
    }

    return data[0];
  },

  // Reply to a buyer without changing approval/rejection status
  async replyToEnquiry(id, reply) {
    if (!reply || !reply.trim()) {
      throw new Error('Please enter a reply.');
    }

    const user = await requireArtisan();

    const { data, error } = await supabase
      .from('enquiries')
      .update({
        reply: reply.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('artisan_id', user.id)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      throw new Error(
        'Reply was not saved. Check enquiry ownership and Supabase RLS policies.'
      );
    }

    return data[0];
  },

  // ==========================================
  // AI CATALOG GENERATOR
  // ==========================================

  async generateSmartCatalog(formData) {
    const response = await fetch(`${API_BASE_URL}/ai/catalog`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(formData)
    });

    const result = await readResponse(response);

    if (!result.success || !result.translations || !result.catalog) {
      throw new Error('The AI catalog response is incomplete.');
    }

    return result;
  },

  // ==========================================
  // FAIR PRICE CALCULATOR
  // ==========================================

  async calculateFairPrice(costData) {
    try {
      const response = await fetch(`${API_BASE_URL}/market/fair-price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(costData)
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Backend pricing unavailable:', error.message);
    }

    const materialCost = Number(costData.materialCost) || 0;
    const laborHours = Number(costData.laborHours) || 0;
    const hourlyWage = Number(costData.hourlyWage) || 150;
    const packagingCost = Number(costData.packagingCost) || 0;

    const laborCost = laborHours * hourlyWage;

    const totalProductionCost =
      materialCost + laborCost + packagingCost;

    const artisanMargin = Math.round(totalProductionCost * 0.3);

    const suggestedSellingPrice =
      Math.round(totalProductionCost + artisanMargin);

    return {
      materialCost,
      laborCost,
      packagingCost,
      totalProductionCost,
      artisanMargin,
      suggestedSellingPrice: Math.max(suggestedSellingPrice, 100),
      priceRange: {
        min: Math.max(Math.round(totalProductionCost * 1.15), 80),
        max: Math.max(Math.round(totalProductionCost * 1.55), 150)
      }
    };
  },

  // ==========================================
  // CRAFT ADVISOR
  // ==========================================

  async askAssistant(message, language = 'en') {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, language })
      });

      return await readResponse(response);
    } catch (error) {
      console.warn('Craft advisor unavailable:', error.message);

      return {
        reply:
          'Namaste! I am your KalaSetu craft advisor. I can help you understand product pricing, descriptions, artisan markets and product presentation.'
      };
    }
  },

  // ==========================================
  // IMAGE ENHANCEMENT
  // ==========================================

  async enhanceImage(imageData) {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/enhance-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData })
      });

      return await readResponse(response);
    } catch (error) {
      console.warn('Image enhancement unavailable:', error.message);

      throw new Error('Unable to enhance the image. Please try again.');
    }
  }
};