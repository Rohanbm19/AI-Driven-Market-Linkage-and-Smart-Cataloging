// // import { protectArtisanWrites } from '../middleware/auth.js';

// // import express from 'express';
// // import {
// //   supabase,
// //   isSupabaseConfigured
// // } from '../config/supabase.js';

// // import {
// //   translateProduct,
// //   saveProductTranslations,
// //   SUPPORTED_LANGUAGES
// // } from '../services/translationService.js';

// // const router = express.Router();
// // router.use(protectArtisanWrites);

// // // --------------------------------------------------
// // // DEFAULT PRODUCTS
// // // --------------------------------------------------

// // const DEFAULT_PRODUCTS = [
// //   {
// //     id: 'prod-1',
// //     title: 'Bankura Terracotta Sacred Horse',
// //     category: 'pottery',
// //     price: 1850,
// //     artisan_name: 'Shankar Das',
// //     region: 'Bishnupur, West Bengal',
// //     description:
// //       'Handcrafted terracotta horse characterized by erect ears, elongated neck, and delicate ornamental incised patterns.',
// //     materials: ['Natural Alluvial Clay', 'Mineral Oxide Slip'],
// //     image_url:
// //       'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
// //     stock: 12,
// //     rating: 4.9,
// //     is_verified: true,
// //     fair_trade: true
// //   },
// //   {
// //     id: 'prod-2',
// //     title: 'Kanjivaram Pure Mulberry Silk Saree',
// //     category: 'textiles',
// //     price: 14200,
// //     artisan_name: 'Meenakshi Sundaram',
// //     region: 'Kanchipuram, Tamil Nadu',
// //     description:
// //       'Woven with three-ply silk thread and pure gold-dipped silver zari.',
// //     materials: ['100% Pure Mulberry Silk', 'Silver & Gold Zari'],
// //     image_url:
// //       'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
// //     stock: 4,
// //     rating: 5.0,
// //     is_verified: true,
// //     fair_trade: true
// //   }
// // ];

// // // In-memory fallback store
// // let localProductStore = [...DEFAULT_PRODUCTS];

// // // --------------------------------------------------
// // // HELPER: GET PRODUCTS IN SELECTED LANGUAGE
// // // --------------------------------------------------

// // async function getLocalizedProducts(products, language) {
// //   if (language === 'en' || products.length === 0) {
// //     return products;
// //   }

// //   if (!SUPPORTED_LANGUAGES[language]) {
// //     throw new Error(`Unsupported language: ${language}`);
// //   }

// //   const localizedProducts = [];

// //   for (const product of products) {
// //     try {
// //       const translated = await translateProduct(product, language);
// //       localizedProducts.push(translated);
// //     } catch (error) {
// //       console.error(
// //         `Translation failed for product ${product.id}:`,
// //         error.message
// //       );
// //       localizedProducts.push(product);
// //     }
// //   }

// //   return localizedProducts;
// // }
// // // HELPER: CLEAR TRANSLATION CACHE
// // // --------------------------------------------------

// // async function clearProductTranslationCache(productId) {
// //   if (!isSupabaseConfigured()) {
// //     return;
// //   }

// //   const { error } = await supabase
// //     .from('product_translations')
// //     .delete()
// //     .eq('product_id', productId);

// //   if (error) {
// //     console.error(
// //       'Translation cache deletion error:',
// //       error.message
// //     );
// //   }
// // }

// // // --------------------------------------------------
// // // HELPER: VALIDATE LANGUAGE
// // // --------------------------------------------------

// // function getRequestedLanguage(req) {
// //   const language = String(req.query.lang || 'en').toLowerCase();

// //   if (!SUPPORTED_LANGUAGES[language]) {
// //     return null;
// //   }

// //   return language;
// // }

// // // --------------------------------------------------
// // // 1. GET ALL PRODUCTS
// // // GET /api/products?lang=kn
// // // --------------------------------------------------

// // router.get('/', async (req, res) => {
// //   try {
// //     const language = getRequestedLanguage(req);

// //     if (!language) {
// //       return res.status(400).json({
// //         success: false,
// //         error: 'Unsupported language',
// //         supportedLanguages: Object.keys(SUPPORTED_LANGUAGES)
// //       });
// //     }

// //     let products = localProductStore;

// //     if (isSupabaseConfigured()) {
// //       const { data, error } = await req.db
// //         .from('products')
// //         .select('*')
// //         .order('created_at', { ascending: false });

// //       if (error) {
// //         console.error('Supabase product fetch error:', error.message);
// //       } else if (Array.isArray(data)) {
// //         products = data.length > 0 ? data : localProductStore;
// //       }
// //     }

// //     const localizedProducts = await getLocalizedProducts(
// //       products,
// //       language
// //     );

// //     return res.json(localizedProducts);

// //   } catch (error) {
// //     console.error('Error fetching products:', error);

// //     return res.status(500).json({
// //       success: false,
// //       error: error.message
// //     });
// //   }
// // });

// // // --------------------------------------------------
// // // 2. GET PRODUCT BY ID
// // // GET /api/products/prod-1?lang=kn
// // // --------------------------------------------------

// // router.get('/:id', async (req, res) => {
// //   const { id } = req.params;

// //   try {
// //     const language = getRequestedLanguage(req);

// //     if (!language) {
// //       return res.status(400).json({
// //         success: false,
// //         error: 'Unsupported language'
// //       });
// //     }

// //     let product = null;

// //     if (isSupabaseConfigured()) {
// //       const { data, error } = await req.db
// //         .from('products')
// //         .select('*')
// //         .eq('id', id)
// //         .maybeSingle();

// //       if (error) {
// //         console.error('Supabase product lookup error:', error.message);
// //       } else {
// //         product = data;
// //       }
// //     }

// //     if (!product) {
// //       product = localProductStore.find(
// //         p => String(p.id) === String(id)
// //       );
// //     }

// //     if (!product) {
// //       return res.status(404).json({
// //         error: 'Product not found'
// //       });
// //     }

// //     const [localizedProduct] = await getLocalizedProducts(
// //       [product],
// //       language
// //     );

// //     return res.json(localizedProduct);

// //   } catch (error) {
// //     console.error('Product detail error:', error);

// //     return res.status(500).json({
// //       error: error.message
// //     });
// //   }
// // });

// // // --------------------------------------------------
// // // 3. CREATE PRODUCT
// // // POST /api/products
// // // --------------------------------------------------

// // router.post('/', async (req, res) => {
// //   try {
// //     const { translations, ...productFields } = req.body;
// //     const payload = { ...productFields, id: req.body.id || crypto.randomUUID(), artisan_id: req.user.id,
// //       is_verified: false, rating: 0, reviews_count: 0 };
// //     if (!payload.title || !Number.isFinite(Number(payload.price)) || Number(payload.price) < 0)
// //       return res.status(400).json({ error: 'A title and valid non-negative price are required.' });
// //     const { data, error } = await req.db.from('products').insert(payload).select().single();
// //     if (error) return res.status(400).json({ error: error.message });

// //     if (translations) {
// //       try {
// //         await saveProductTranslations(data.id, translations, data);
// //       } catch (translationError) {
// //         return res.status(201).json({
// //           success: true,
// //           data,
// //           savedInSupabase: true,
// //           translationsSaved: false,
// //           translationError: translationError.message
// //         });
// //       }
// //     }

// //     return res.status(201).json({
// //       success: true,
// //       data,
// //       savedInSupabase: true,
// //       translationsSaved: Boolean(translations)
// //     });
// //   } catch (error) { return res.status(500).json({ error: error.message }); }
// // });
// // router.put('/:id', async (req, res) => {
// //   try {
// //     const { translations, ...updates } = req.body;
// //     delete updates.id; delete updates.artisan_id;
// //     const { data, error } = await req.db.from('products').update(updates)
// //       .eq('id', req.params.id).eq('artisan_id', req.user.id).select().single();
// //     if (error) return res.status(400).json({ error: error.message });
// //     await clearProductTranslationCache(req.params.id);

// //     if (translations) {
// //       try {
// //         await saveProductTranslations(data.id, translations, data);
// //       } catch (translationError) {
// //         return res.json({
// //           success: true,
// //           data,
// //           savedInSupabase: true,
// //           translationsSaved: false,
// //           translationError: translationError.message
// //         });
// //       }
// //     }

// //     return res.json({
// //       success: true,
// //       data,
// //       savedInSupabase: true,
// //       translationsSaved: Boolean(translations)
// //     });
// //   } catch (error) { return res.status(500).json({ error: error.message }); }
// // });
// // router.delete('/:id', async (req, res) => {
// //   const { data, error } = await req.db.from('products').delete()
// //     .eq('id', req.params.id).eq('artisan_id', req.user.id).select('id').single();
// //   if (error) return res.status(400).json({ error: error.message });
// //   return res.json({ success: true, deletedId: data.id, deletedInSupabase: true });
// // });
// // export default router;


// import crypto from 'crypto';
// import express from 'express';

// import { protectArtisanWrites } from '../middleware/auth.js';

// import {
//   supabase,
//   isSupabaseConfigured
// } from '../config/supabase.js';

// import {
//   translateProduct,
//   saveProductTranslations,
//   SUPPORTED_LANGUAGES
// } from '../services/translationService.js';

// const router = express.Router();

// // --------------------------------------------------
// // DEFAULT PRODUCTS
// // --------------------------------------------------

// const DEFAULT_PRODUCTS = [
//   {
//     id: 'prod-1',
//     title: 'Bankura Terracotta Sacred Horse',
//     category: 'pottery',
//     price: 1850,
//     artisan_name: 'Shankar Das',
//     region: 'Bishnupur, West Bengal',
//     description:
//       'Handcrafted terracotta horse characterized by erect ears, elongated neck, and delicate ornamental incised patterns.',
//     materials: ['Natural Alluvial Clay', 'Mineral Oxide Slip'],
//     image_url:
//       'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
//     stock: 12,
//     rating: 4.9,
//     is_verified: true,
//     fair_trade: true
//   },
//   {
//     id: 'prod-2',
//     title: 'Kanjivaram Pure Mulberry Silk Saree',
//     category: 'textiles',
//     price: 14200,
//     artisan_name: 'Meenakshi Sundaram',
//     region: 'Kanchipuram, Tamil Nadu',
//     description:
//       'Woven with three-ply silk thread and pure gold-dipped silver zari.',
//     materials: ['100% Pure Mulberry Silk', 'Silver & Gold Zari'],
//     image_url:
//       'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
//     stock: 4,
//     rating: 5.0,
//     is_verified: true,
//     fair_trade: true
//   }
// ];

// let localProductStore = [...DEFAULT_PRODUCTS];

// // --------------------------------------------------
// // LANGUAGE VALIDATION
// // --------------------------------------------------

// function getRequestedLanguage(req) {
//   const language = String(req.query.lang || 'en').toLowerCase();

//   return SUPPORTED_LANGUAGES[language] ? language : null;
// }

// // --------------------------------------------------
// // GET PRODUCTS IN SELECTED LANGUAGE
// // --------------------------------------------------

// async function getLocalizedProducts(products, language) {
//   if (!SUPPORTED_LANGUAGES[language]) {
//     throw new Error(`Unsupported language: ${language}`);
//   }

//   if (language === 'en' || products.length === 0) {
//     return products.map(product => ({
//       ...product,
//       localized_language: 'en'
//     }));
//   }

//   return Promise.all(
//     products.map(async product => {
//       try {
//         return await translateProduct(product, language);
//       } catch (error) {
//         console.error(
//           `Translation failed for ${product.id} (${language}):`,
//           error.message
//         );

//         return {
//           ...product,
//           localized_language: 'translation_failed',
//           translation_error: error.message
//         };
//       }
//     })
//   );
// }

// // --------------------------------------------------
// // CLEAR TRANSLATION CACHE
// // --------------------------------------------------

// async function clearProductTranslationCache(productId) {
//   if (!isSupabaseConfigured()) return;

//   const { error } = await supabase
//     .from('product_translations')
//     .delete()
//     .eq('product_id', productId);

//   if (error) {
//     throw new Error(
//       `Translation cache deletion failed: ${error.message}`
//     );
//   }
// }

// // --------------------------------------------------
// // 1. GET ALL PRODUCTS
// // GET /api/products?lang=kn
// // --------------------------------------------------

// router.get('/', async (req, res) => {
//   try {
//     const language = getRequestedLanguage(req);

//     if (!language) {
//       return res.status(400).json({
//         success: false,
//         error: 'Unsupported language',
//         supportedLanguages: Object.keys(SUPPORTED_LANGUAGES)
//       });
//     }

//     let products = localProductStore;

//     if (isSupabaseConfigured()) {
//       const { data, error } = await req.db
//         .from('products')
//         .select('*')
//         .order('created_at', { ascending: false });

//       if (error) {
//         throw new Error(`Product fetch failed: ${error.message}`);
//       }

//       if (Array.isArray(data)) {
//         products = data.length > 0 ? data : localProductStore;
//       }
//     }

//     const localizedProducts = await getLocalizedProducts(
//       products,
//       language
//     );

//     return res.json(localizedProducts);

//   } catch (error) {
//     console.error('Product list error:', error);

//     return res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// });

// // --------------------------------------------------
// // 2. GET PRODUCT BY ID
// // GET /api/products/:id?lang=kn
// // --------------------------------------------------

// router.get('/:id', async (req, res) => {
//   try {
//     const language = getRequestedLanguage(req);

//     if (!language) {
//       return res.status(400).json({
//         success: false,
//         error: 'Unsupported language'
//       });
//     }

//     const { id } = req.params;
//     let product = null;

//     if (isSupabaseConfigured()) {
//       const { data, error } = await req.db
//         .from('products')
//         .select('*')
//         .eq('id', id)
//         .maybeSingle();

//       if (error) {
//         throw new Error(`Product lookup failed: ${error.message}`);
//       }

//       product = data;
//     }

//     if (!product) {
//       product = localProductStore.find(
//         item => String(item.id) === String(id)
//       );
//     }

//     if (!product) {
//       return res.status(404).json({
//         error: 'Product not found'
//       });
//     }

//     const [localizedProduct] = await getLocalizedProducts(
//       [product],
//       language
//     );

//     return res.json(localizedProduct);

//   } catch (error) {
//     console.error('Product detail error:', error);

//     return res.status(500).json({
//       error: error.message
//     });
//   }
// });

// // --------------------------------------------------
// // 3. CREATE PRODUCT
// // POST /api/products
// // --------------------------------------------------

// router.post('/', protectArtisanWrites, async (req, res) => {
//   try {
//     const { translations, ...productFields } = req.body;

//     const payload = {
//       ...productFields,
//       id: req.body.id || crypto.randomUUID(),
//       artisan_id: req.user.id,
//       is_verified: false,
//       rating: 0,
//       reviews_count: 0
//     };

//     if (
//       !payload.title ||
//       !Number.isFinite(Number(payload.price)) ||
//       Number(payload.price) < 0
//     ) {
//       return res.status(400).json({
//         error: 'A title and valid non-negative price are required.'
//       });
//     }

//     const { data, error } = await req.db
//       .from('products')
//       .insert(payload)
//       .select()
//       .single();

//     if (error) {
//       return res.status(400).json({ error: error.message });
//     }

//     let translationsSaved = false;
//     let translationError = null;

//     if (translations) {
//       try {
//         await saveProductTranslations(
//           data.id,
//           translations,
//           data
//         );

//         translationsSaved = true;
//       } catch (error) {
//         translationError = error.message;

//         console.error(
//           'Product translation save error:',
//           error.message
//         );
//       }
//     }

//     return res.status(201).json({
//       success: true,
//       data,
//       savedInSupabase: true,
//       translationsSaved,
//       translationError
//     });

//   } catch (error) {
//     console.error('Create product error:', error);

//     return res.status(500).json({
//       error: error.message
//     });
//   }
// });

// // --------------------------------------------------
// // 4. UPDATE PRODUCT
// // PUT /api/products/:id
// // --------------------------------------------------

// router.put('/:id', protectArtisanWrites, async (req, res) => {
//   try {
//     const { translations, ...updates } = req.body;

//     delete updates.id;
//     delete updates.artisan_id;

//     const { data, error } = await req.db
//       .from('products')
//       .update(updates)
//       .eq('id', req.params.id)
//       .eq('artisan_id', req.user.id)
//       .select()
//       .single();

//     if (error) {
//       return res.status(400).json({
//         error: error.message
//       });
//     }

//     await clearProductTranslationCache(req.params.id);

//     let translationsSaved = false;
//     let translationError = null;

//     if (translations) {
//       try {
//         await saveProductTranslations(
//           data.id,
//           translations,
//           data
//         );

//         translationsSaved = true;
//       } catch (error) {
//         translationError = error.message;
//       }
//     }

//     return res.json({
//       success: true,
//       data,
//       savedInSupabase: true,
//       translationsSaved,
//       translationError
//     });

//   } catch (error) {
//     console.error('Update product error:', error);

//     return res.status(500).json({
//       error: error.message
//     });
//   }
// });

// // --------------------------------------------------
// // 5. DELETE PRODUCT
// // DELETE /api/products/:id
// // --------------------------------------------------

// router.delete('/:id', protectArtisanWrites, async (req, res) => {
//   try {
//     const { data, error } = await req.db
//       .from('products')
//       .delete()
//       .eq('id', req.params.id)
//       .eq('artisan_id', req.user.id)
//       .select('id')
//       .single();

//     if (error) {
//       return res.status(400).json({
//         error: error.message
//       });
//     }

//     return res.json({
//       success: true,
//       deletedId: data.id,
//       deletedInSupabase: true
//     });

//   } catch (error) {
//     console.error('Delete product error:', error);

//     return res.status(500).json({
//       error: error.message
//     });
//   }
// });

// export default router;


import crypto from 'crypto';
import express from 'express';

import { protectArtisanWrites } from '../middleware/auth.js';

import {
  supabase,
  isSupabaseConfigured
} from '../config/supabase.js';

import {
  translateProduct,
  saveProductTranslations,
  SUPPORTED_LANGUAGES
} from '../services/translationService.js';

const router = express.Router();

// --------------------------------------------------
// DEFAULT PRODUCTS
// --------------------------------------------------

const DEFAULT_PRODUCTS = [
  {
    id: 'prod-1',
    title: 'Bankura Terracotta Sacred Horse',
    category: 'pottery',
    price: 1850,
    artisan_name: 'Shankar Das',
    region: 'Bishnupur, West Bengal',
    description:
      'Handcrafted terracotta horse characterized by erect ears, elongated neck, and delicate ornamental incised patterns.',
    materials: ['Natural Alluvial Clay', 'Mineral Oxide Slip'],
    image_url:
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
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
    description:
      'Woven with three-ply silk thread and pure gold-dipped silver zari.',
    materials: ['100% Pure Mulberry Silk', 'Silver & Gold Zari'],
    image_url:
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    stock: 4,
    rating: 5.0,
    is_verified: true,
    fair_trade: true
  }
];

let localProductStore = [...DEFAULT_PRODUCTS];

// --------------------------------------------------
// LANGUAGE VALIDATION
// --------------------------------------------------

function getRequestedLanguage(req) {
  const language = String(req.query.lang || 'en').toLowerCase();

  return SUPPORTED_LANGUAGES[language] ? language : null;
}

// --------------------------------------------------
// GET PRODUCTS IN SELECTED LANGUAGE
// --------------------------------------------------

async function getLocalizedProducts(products, language) {
  if (!SUPPORTED_LANGUAGES[language]) {
    throw new Error(`Unsupported language: ${language}`);
  }

  if (language === 'en' || products.length === 0) {
    return products.map(product => ({
      ...product,
      localized_language: 'en'
    }));
  }

  return Promise.all(
    products.map(async product => {
      try {
        const translated = await translateProduct(product, language);

        return {
          ...product,
          ...(translated || {}),
          id: product.id,
          artisan_id: product.artisan_id
        };
      } catch (error) {
        console.error(
          `Translation failed for ${product.id} (${language}):`,
          error.message
        );

        return {
          ...product,
          localized_language: 'translation_failed',
          translation_error: error.message
        };
      }
    })
  );
}

// --------------------------------------------------
// CLEAR TRANSLATION CACHE
// --------------------------------------------------

async function clearProductTranslationCache(productId) {
  if (!isSupabaseConfigured()) return;

  const { error } = await supabase
    .from('product_translations')
    .delete()
    .eq('product_id', productId);

  if (error) {
    throw new Error(
      `Translation cache deletion failed: ${error.message}`
    );
  }
}

// --------------------------------------------------
// 1. GET ALL PRODUCTS
// GET /api/products?lang=kn
// --------------------------------------------------

router.get('/', async (req, res) => {
  try {
    const language = getRequestedLanguage(req);

    if (!language) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported language',
        supportedLanguages: Object.keys(SUPPORTED_LANGUAGES)
      });
    }

    let products = localProductStore;

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Product fetch failed: ${error.message}`);
      }

      if (Array.isArray(data)) {
        products = data.length > 0 ? data : localProductStore;
      }
    }

    const localizedProducts = await getLocalizedProducts(
      products,
      language
    );

    return res.json(localizedProducts);

  } catch (error) {
    console.error('Product list error:', error);

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// --------------------------------------------------
// 2. GET PRODUCT BY ID
// GET /api/products/:id?lang=kn
// --------------------------------------------------

router.get('/:id', async (req, res) => {
  try {
    const language = getRequestedLanguage(req);

    if (!language) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported language',
        supportedLanguages: Object.keys(SUPPORTED_LANGUAGES)
      });
    }

    const { id } = req.params;
    let product = null;

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw new Error(`Product lookup failed: ${error.message}`);
      }

      product = data;
    }

    if (!product) {
      product = localProductStore.find(
        item => String(item.id) === String(id)
      );
    }

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    const [localizedProduct] = await getLocalizedProducts(
      [product],
      language
    );

    return res.json(localizedProduct);

  } catch (error) {
    console.error('Product detail error:', error);

    return res.status(500).json({
      error: error.message
    });
  }
});

// --------------------------------------------------
// 3. CREATE PRODUCT
// POST /api/products
// --------------------------------------------------

router.post('/', protectArtisanWrites, async (req, res) => {
  try {
    const { translations, ...productFields } = req.body;

    const payload = {
      ...productFields,
      id: req.body.id || crypto.randomUUID(),
      artisan_id: req.user.id,
      is_verified: false,
      rating: 0,
      reviews_count: 0
    };

    if (
      !payload.title ||
      !Number.isFinite(Number(payload.price)) ||
      Number(payload.price) < 0
    ) {
      return res.status(400).json({
        error: 'A title and valid non-negative price are required.'
      });
    }

    const { data, error } = await req.db
      .from('products')
      .insert(payload)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        error: error.message
      });
    }

    let translationsSaved = false;
    let translationError = null;

    if (translations) {
      try {
        await saveProductTranslations(
          data.id,
          translations,
          data
        );

        translationsSaved = true;
      } catch (error) {
        translationError = error.message;

        console.error(
          'Product translation save error:',
          error.message
        );
      }
    }

    return res.status(201).json({
      success: true,
      data,
      savedInSupabase: true,
      translationsSaved,
      translationError
    });

  } catch (error) {
    console.error('Create product error:', error);

    return res.status(500).json({
      error: error.message
    });
  }
});

// --------------------------------------------------
// 4. UPDATE PRODUCT
// PUT /api/products/:id
// --------------------------------------------------

router.put('/:id', protectArtisanWrites, async (req, res) => {
  try {
    const { translations, ...updates } = req.body;

    delete updates.id;
    delete updates.artisan_id;

    const { data, error } = await req.db
      .from('products')
      .update(updates)
      .eq('id', req.params.id)
      .eq('artisan_id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        error: error.message
      });
    }

    await clearProductTranslationCache(req.params.id);

    let translationsSaved = false;
    let translationError = null;

    if (translations) {
      try {
        await saveProductTranslations(
          data.id,
          translations,
          data
        );

        translationsSaved = true;
      } catch (error) {
        translationError = error.message;

        console.error(
          'Updated product translation save error:',
          error.message
        );
      }
    }

    return res.json({
      success: true,
      data,
      savedInSupabase: true,
      translationsSaved,
      translationError
    });

  } catch (error) {
    console.error('Update product error:', error);

    return res.status(500).json({
      error: error.message
    });
  }
});

// --------------------------------------------------
// 5. DELETE PRODUCT
// DELETE /api/products/:id
// --------------------------------------------------

router.delete('/:id', protectArtisanWrites, async (req, res) => {
  try {
    const { data, error } = await req.db
      .from('products')
      .delete()
      .eq('id', req.params.id)
      .eq('artisan_id', req.user.id)
      .select('id')
      .single();

    if (error) {
      return res.status(400).json({
        error: error.message
      });
    }

    return res.json({
      success: true,
      deletedId: data.id,
      deletedInSupabase: true
    });

  } catch (error) {
    console.error('Delete product error:', error);

    return res.status(500).json({
      error: error.message
    });
  }
});

export default router;
