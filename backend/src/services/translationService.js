
import crypto from 'crypto';
import { askGemini } from './gemini.js';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';

export const SUPPORTED_LANGUAGES = {
  en: 'English',
  kn: 'Kannada',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  ml: 'Malayalam'
};

const LANGUAGE_CODES = Object.keys(SUPPORTED_LANGUAGES);

function cleanArray(value) {
  if (!Array.isArray(value)) return [];

  return [...new Set(
    value
      .map((item) => String(item).trim())
      .filter(Boolean)
  )];
}

export function normalizeProduct(product = {}) {
  return {
    title: String(product.title || ''),
    description: String(product.description || ''),
    region: String(product.region || ''),
    materials: cleanArray(product.materials),
    tags: cleanArray(product.tags),
    story: String(product.story || product.description || ''),
    seo_keywords: String(product.seo_keywords || product.seoKeywords || '')
  };
}

export function createProductSourceHash(product) {
  const source = normalizeProduct(product);

  return crypto
    .createHash('sha256')
    .update(JSON.stringify({
      title: source.title,
      description: source.description,
      region: source.region,
      materials: source.materials,
      tags: source.tags
    }))
    .digest('hex');
}

function extractJSON(result) {
  if (result && typeof result === 'object' && !Array.isArray(result)) {
    return result;
  }

  if (typeof result !== 'string') {
    throw new Error('Gemini returned an empty or invalid response.');
  }

  const cleaned = result
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');

    if (start === -1 || end <= start) {
      throw new Error('Gemini did not return valid JSON.');
    }

    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      throw new Error('Gemini returned malformed JSON.');
    }
  }
}

function normalizeTranslation(data = {}) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Invalid translation object returned by Gemini.');
  }

  const fields = [
    'title',
    'description',
    'region',
    'story',
    'seo_keywords'
  ];

  for (const field of fields) {
    if (typeof data[field] !== 'string') {
      throw new Error(`Gemini returned an invalid ${field} field.`);
    }
  }

  if (!Array.isArray(data.materials) || !Array.isArray(data.tags)) {
    throw new Error('Gemini returned invalid materials or tags.');
  }

  return {
    title: data.title.trim(),
    description: data.description.trim(),
    region: data.region.trim(),
    materials: cleanArray(data.materials),
    tags: cleanArray(data.tags),
    story: data.story.trim(),
    seo_keywords: data.seo_keywords.trim()
  };
}

/**
 * Generate all six language translations in one Gemini call.
 */
export async function generateAllTranslations(product) {
  const source = normalizeProduct(product);

  if (!source.title && !source.description) {
    throw new Error('Product title or description is required.');
  }

  const prompt = `
You are KalaSetu's professional multilingual translation engine.

Translate this product information into all six requested languages.

SOURCE:
${JSON.stringify(source, null, 2)}

LANGUAGES:
en: English
kn: Kannada
hi: Hindi
ta: Tamil
te: Telugu
ml: Malayalam

STRICT RULES:
1. Preserve the exact meaning and factual information.
2. Do not invent product details, materials, awards or certifications.
3. Translate naturally for Indian marketplace customers.
4. Keep proper names and geographical identities accurate.
5. Translate materials and tags naturally.
6. Preserve all supplied materials.
7. Tags may have a different number in each language.
8. Do not force the original tag count.
9. Empty source fields must remain empty.
10. English must preserve the original source content.
11. Return JSON only, without Markdown or explanations.
12. Every language must contain every requested field.
13. Do not create unsupported product claims.

Return this exact structure:

{
  "en": {
    "title": "",
    "description": "",
    "region": "",
    "materials": [],
    "tags": [],
    "story": "",
    "seo_keywords": ""
  },
  "kn": {
    "title": "",
    "description": "",
    "region": "",
    "materials": [],
    "tags": [],
    "story": "",
    "seo_keywords": ""
  },
  "hi": {
    "title": "",
    "description": "",
    "region": "",
    "materials": [],
    "tags": [],
    "story": "",
    "seo_keywords": ""
  },
  "ta": {
    "title": "",
    "description": "",
    "region": "",
    "materials": [],
    "tags": [],
    "story": "",
    "seo_keywords": ""
  },
  "te": {
    "title": "",
    "description": "",
    "region": "",
    "materials": [],
    "tags": [],
    "story": "",
    "seo_keywords": ""
  },
  "ml": {
    "title": "",
    "description": "",
    "region": "",
    "materials": [],
    "tags": [],
    "story": "",
    "seo_keywords": ""
  }
}
`;

  const rawResult = await askGemini(prompt, true, 'product');
  const result = extractJSON(rawResult);

  const translations = {};

  for (const language of LANGUAGE_CODES) {
    if (!result[language]) {
      throw new Error(`Gemini did not return the ${language} translation.`);
    }

    translations[language] = normalizeTranslation(result[language]);
  }

  return translations;
}

/**
 * Save translations in Supabase.
 */
export async function saveProductTranslations(
  productId,
  translations,
  sourceProduct
) {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  if (!productId) {
    throw new Error('Product ID is required.');
  }

  const sourceHash = createProductSourceHash(sourceProduct);

  const rows = LANGUAGE_CODES.map((language) => {
    const translated = normalizeTranslation(translations[language]);

    return {
      product_id: productId,
      language_code: language,
      title: translated.title,
      description: translated.description,
      region: translated.region,
      materials: translated.materials,
      tags: translated.tags,
      story: translated.story,
      seo_keywords: translated.seo_keywords,
      source_hash: sourceHash,
      updated_at: new Date().toISOString()
    };
  });

  const { error } = await supabase
    .from('product_translations')
    .upsert(rows, {
      onConflict: 'product_id,language_code'
    });

  if (error) {
    throw new Error(
      `Could not save product translations: ${error.message}`
    );
  }

  return rows;
}

/**
 * Retrieve cached translations.
 */
export async function getCachedProductTranslation(
  productId,
  language,
  sourceProduct
) {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  if (!SUPPORTED_LANGUAGES[language]) {
    throw new Error('Unsupported language.');
  }

  const { data, error } = await supabase
    .from('product_translations')
    .select('*')
    .eq('product_id', productId)
    .eq('language_code', language)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Could not read translation cache: ${error.message}`
    );
  }

  if (!data) return null;

  const currentHash = createProductSourceHash(sourceProduct);

  if (data.source_hash !== currentHash) {
    return null;
  }

  return {
    title: data.title,
    description: data.description,
    region: data.region,
    materials: data.materials || [],
    tags: data.tags || [],
    story: data.story || '',
    seo_keywords: data.seo_keywords || ''
  };
}

/**
 * Translate one product and cache all six languages.
 */
export async function translateProduct(product, language = 'en') {
  if (!SUPPORTED_LANGUAGES[language]) {
    throw new Error('Unsupported language.');
  }

  if (language === 'en') {
    return product;
  }

  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase is not configured for translation.');
  }

  const cached = await getCachedProductTranslation(
    product.id,
    language,
    product
  );

  if (cached) {
    return {
      ...product,
      ...cached
    };
  }

  const translations = await generateAllTranslations(product);

  await saveProductTranslations(
    product.id,
    translations,
    product
  );

  return {
    ...product,
    ...translations[language]
  };
}
