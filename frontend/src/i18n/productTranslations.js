
// /**
//  * Get product details in the selected language.
//  * Uses translations saved in Supabase.
//  * Keeps artisan name, region and price unchanged.
//  */

// export function getLocalizedProduct(product, lang = 'en') {
//   if (!product) return product;

//   let translations = product.translations || {};

//   // Handle translations stored as JSON text
//   if (typeof translations === 'string') {
//     try {
//       translations = JSON.parse(translations);
//     } catch {
//       translations = {};
//     }
//   }

//   const translated =
//     translations[lang] ||
//     translations.en ||
//     {};

//   return {
//     ...product,

//     // Translate only product-related content
//     title: translated.title || product.title,
//     description: translated.description || product.description,
//     materials: translated.materials || product.materials,
//     tags: translated.tags || product.tags,

//     // Preserve original information
//     artisan_name: product.artisan_name,
//     region: product.region,
//     price: product.price
//   };
// }

/**
 * Product localization helper.
 * Backend normally returns an already-localized product.
 */

export function getLocalizedProduct(product, lang = 'en') {
  if (!product) return product;

  // Backend has already selected and applied this language.
  if (product.localized_language === lang) {
    return product;
  }

  // Also support products containing nested translations.
  let translations = product.translations || {};

  if (typeof translations === 'string') {
    try {
      translations = JSON.parse(translations);
    } catch {
      translations = {};
    }
  }

  const translated = translations[lang] || {};

  return {
    ...product,
    title: translated.title || product.title,
    description: translated.description || product.description,
    materials: translated.materials || product.materials,
    tags: translated.tags || product.tags,

    // Never translate these fields.
    artisan_name: product.artisan_name,
    region: product.region,
    price: product.price
  };
}
