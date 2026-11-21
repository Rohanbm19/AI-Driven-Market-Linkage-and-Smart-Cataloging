
import { askGemini } from './gemini.js';

export const CATALOG_LANGUAGES = {
  en: 'English',
  kn: 'Kannada',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  ml: 'Malayalam'
};

const LANGUAGE_CODES = Object.keys(CATALOG_LANGUAGES);

function cleanString(value) {
  if (typeof value !== 'string') {
    return value == null ? '' : String(value).trim();
  }

  return value.trim();
}

function cleanArray(value) {
  if (Array.isArray(value)) {
    return [...new Set(
      value
        .map((item) => cleanString(item))
        .filter(Boolean)
    )];
  }

  if (typeof value === 'string') {
    return [...new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    )];
  }

  return [];
}

function normalizeCatalog(catalog = {}) {
  return {
    title: cleanString(catalog.title),
    description: cleanString(catalog.description),
    story: cleanString(catalog.story),
    region: cleanString(catalog.region),
    materials: cleanArray(catalog.materials),
    tags: cleanArray(catalog.tags),
    seoKeywords: cleanString(
      catalog.seoKeywords || catalog.seo_keywords
    )
  };
}

function normalizeTranslation(translation = {}) {
  return {
    title: cleanString(translation.title),
    description: cleanString(translation.description),
    story: cleanString(translation.story),
    region: cleanString(translation.region),
    materials: cleanArray(translation.materials),
    tags: cleanArray(translation.tags),
    seo_keywords: cleanString(
      translation.seo_keywords || translation.seoKeywords
    )
  };
}

function extractInput(body = {}) {
  const selectedLanguage = CATALOG_LANGUAGES[body.language]
    ? body.language
    : 'en';

  return {
    title: cleanString(body.title),

    craftType: cleanString(
      body.craftType || body.category
    ),

    region: cleanString(body.region),

    materials: cleanArray(body.materials),

    description: cleanString(
      body.description || body.story
    ),

    story: cleanString(
      body.story || body.description
    ),

    selectedLanguage
  };
}

function validateCatalog(catalog) {
  if (
    !catalog ||
    typeof catalog !== 'object' ||
    Array.isArray(catalog)
  ) {
    throw new Error('Gemini returned an invalid catalog.');
  }

  const normalized = normalizeCatalog(catalog);

  if (!normalized.title) {
    throw new Error('Generated product title is missing.');
  }

  if (!normalized.description) {
    throw new Error('Generated product description is missing.');
  }

  if (!normalized.story) {
    throw new Error('Generated product story is missing.');
  }

  if (!normalized.seoKeywords) {
    throw new Error('Generated SEO keywords are missing.');
  }

  return normalized;
}

function validateTranslation(translation, language) {
  if (
    !translation ||
    typeof translation !== 'object' ||
    Array.isArray(translation)
  ) {
    throw new Error(
      `Gemini did not return the ${CATALOG_LANGUAGES[language]} translation.`
    );
  }

  const normalized = normalizeTranslation(translation);

  const requiredFields = [
    'title',
    'description',
    'story',
    'seo_keywords'
  ];

  const missingFields = requiredFields.filter(
    (field) => !normalized[field]
  );

  if (missingFields.length > 0) {
    throw new Error(
      `Incomplete ${CATALOG_LANGUAGES[language]} translation: ${missingFields.join(', ')}`
    );
  }

  return normalized;
}

function normalizeDetectedLanguage(value, fallback = 'en') {
  const language = cleanString(value).toLowerCase();

  if (CATALOG_LANGUAGES[language]) {
    return language;
  }

  const matchedLanguage = Object.entries(CATALOG_LANGUAGES)
    .find(([, name]) => name.toLowerCase() === language);

  return matchedLanguage
    ? matchedLanguage[0]
    : fallback;
}

/**
 * Generate a complete artisan product catalog
 * and translations in all six supported languages.
 */
export async function generateSmartCatalog(input = {}) {
  const originalContent = extractInput(input);

  const hasInput = Boolean(
    originalContent.title ||
    originalContent.craftType ||
    originalContent.description ||
    originalContent.region ||
    originalContent.materials.length
  );

  if (!hasInput) {
    throw new Error(
      'Please provide a product title, craft type, materials, or product story.'
    );
  }

  const prompt = `
You are KalaSetu's professional AI catalog assistant.

Your job is to understand artisan-provided information,
create a useful product catalog, and translate it into
six Indian languages.

ARTISAN INPUT:
${JSON.stringify(originalContent, null, 2)}

SUPPORTED LANGUAGES:
en = English
kn = Kannada
hi = Hindi
ta = Tamil
te = Telugu
ml = Malayalam

YOUR TASKS:

1. Detect the actual language of the artisan's original
   description and story.

2. Return the detected language using its two-letter code:
   en, kn, hi, ta, te, or ml.

3. Improve the supplied product title when necessary.
   Do not change its actual identity.

4. Create a clear and professional product description.

5. Write a short, engaging but factual artisan product story.

6. Preserve the supplied geographical region.

7. Preserve all supplied materials.

8. Generate 3 to 8 relevant product tags.

9. Generate useful SEO keywords.

10. Translate the complete catalog into all six languages.

STRICT FACTUAL RULES:

- Never invent materials.
- Never invent manufacturing techniques.
- Never invent an artisan's name.
- Never invent years of experience.
- Never invent awards or certifications.
- Never claim GI registration unless explicitly provided.
- Never claim Fair Trade certification unless explicitly provided.
- Never invent cultural history or heritage facts.
- Never invent prices, dimensions, or product specifications.
- Never add unsupported claims such as organic, pure,
  authentic, certified, or eco-friendly.
- Do not assume that a craft belongs to a particular
  village or region without supplied information.
- Do not invent information to make the product story
  sound more impressive.
- Preserve proper names and geographical identities.
- Preserve every supplied material.
- Do not remove factual information from the input.

LANGUAGE RULES:

- Detect the source language from the actual artisan text,
  not from the selected interface language.
- The selected interface language is:
  ${originalContent.selectedLanguage}
- Generate all six language versions regardless of
  the selected interface language.
- Use natural, readable Indian language translations.
- Do not mix languages unnecessarily.
- English must be a natural English translation.
- Do not copy non-English source text into English fields.
- Keep names and place identities accurate.

EMPTY FIELD RULES:

- If the region is missing, return an empty string.
- If materials are missing, return an empty array.
- Never fill missing factual information with guesses.
- If the story contains insufficient information,
  write only a short factual description based on
  the information actually supplied.
- Do not invent details to fill empty fields.

TAG RULES:

- Generate tags relevant to the actual product.
- Do not automatically add GI Tagged or Fair Trade.
- Do not add certifications unless explicitly confirmed.
- Each language may have a different number of tags.

OUTPUT RULES:

Return valid JSON only.
Do not include Markdown.
Do not include explanations outside the JSON.
Every language must contain all seven fields.
All fields must use the correct data types.

Return this exact structure:

{
  "detectedLanguage": "en",
  "catalog": {
    "title": "",
    "description": "",
    "story": "",
    "region": "",
    "materials": [],
    "tags": [],
    "seo_keywords": ""
  },
  "translations": {
    "en": {
      "title": "",
      "description": "",
      "story": "",
      "region": "",
      "materials": [],
      "tags": [],
      "seo_keywords": ""
    },
    "kn": {
      "title": "",
      "description": "",
      "story": "",
      "region": "",
      "materials": [],
      "tags": [],
      "seo_keywords": ""
    },
    "hi": {
      "title": "",
      "description": "",
      "story": "",
      "region": "",
      "materials": [],
      "tags": [],
      "seo_keywords": ""
    },
    "ta": {
      "title": "",
      "description": "",
      "story": "",
      "region": "",
      "materials": [],
      "tags": [],
      "seo_keywords": ""
    },
    "te": {
      "title": "",
      "description": "",
      "story": "",
      "region": "",
      "materials": [],
      "tags": [],
      "seo_keywords": ""
    },
    "ml": {
      "title": "",
      "description": "",
      "story": "",
      "region": "",
      "materials": [],
      "tags": [],
      "seo_keywords": ""
    }
  }
}
`;

  const result = await askGemini(
    prompt,
    true,
    'catalog'
  );

  if (
    !result ||
    typeof result !== 'object' ||
    Array.isArray(result) ||
    !result.catalog ||
    !result.translations
  ) {
    throw new Error(
      'Gemini returned an incomplete catalog structure.'
    );
  }

  const catalog = validateCatalog(result.catalog);

  const translations = {};

  for (const language of LANGUAGE_CODES) {
    translations[language] = validateTranslation(
      result.translations[language],
      language
    );
  }

  const detectedLanguage = normalizeDetectedLanguage(
    result.detectedLanguage,
    originalContent.selectedLanguage
  );

  const selectedLanguage = originalContent.selectedLanguage;

  const selectedCatalog = translations[selectedLanguage];

  return {
    success: true,

    originalContent,

    detectedLanguage,

    selectedLanguage,

    catalog,

    title: selectedCatalog.title,
    description: selectedCatalog.description,
    story: selectedCatalog.story,
    region: selectedCatalog.region,
    materials: selectedCatalog.materials,
    tags: selectedCatalog.tags,
    seoKeywords: selectedCatalog.seo_keywords,

    suggestedPrice: null,
    priceRange: null,

    translations
  };
}
