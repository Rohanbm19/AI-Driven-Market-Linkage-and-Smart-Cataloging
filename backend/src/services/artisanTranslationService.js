
import crypto from 'crypto';
import { askGemini } from './gemini.js';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';

export const ARTISAN_LANGUAGES = ['en', 'kn', 'hi', 'ta', 'te', 'ml'];

const TARGET_LANGUAGES = {
  kn: 'Kannada',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  ml: 'Malayalam'
};

// Include badges in the source hash.
// Any profile or badge edit will generate fresh translations.
export function createArtisanSourceHash(artisan) {
  const source = {
    name: artisan.name || '',
    craft: artisan.craft || '',
    region: artisan.region || '',
    experience: artisan.experience || '',
    bio: artisan.bio || '',
    badges: Array.isArray(artisan.badges) ? artisan.badges : []
  };

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(source))
    .digest('hex');
}

function getOriginalFields(artisan) {
  return {
    name: artisan.name || '',
    craft: artisan.craft || '',
    region: artisan.region || '',
    experience: artisan.experience || '',
    bio: artisan.bio || '',
    badges: Array.isArray(artisan.badges) ? artisan.badges : []
  };
}

async function generateAllArtisanTranslations(artisan) {
  const source = getOriginalFields(artisan);

  const prompt = `
You are an expert multilingual translator for an Indian artisan marketplace.

Generate localized artisan profiles in all five languages:

- Kannada (kn)
- Hindi (hi)
- Tamil (ta)
- Telugu (te)
- Malayalam (ml)

IMPORTANT RULES:

1. Translate craft, region, experience and bio naturally.
2. Transliterate the artisan's name into each language's native script.
   Do not translate the meaning of the name.
3. Preserve the original pronunciation of the name.
4. Translate every badge into the target language.
5. Preserve the exact meaning and status of every badge.
6. Never invent awards, certifications or achievements.
7. Do not upgrade or exaggerate any certification.
8. Keep the same number of badges and preserve their order.
9. Preserve all numbers and years accurately.
10. If the source text is already in an Indian language,
    understand its meaning before translating.
11. Return valid JSON only. No Markdown or explanations.
12. Every text field must be a non-empty string.
13. The badges field must be an array of strings with the same
    number of elements as the original badges array.

Original artisan profile:
${JSON.stringify(source, null, 2)}

Return exactly this JSON structure:

{
  "kn": {
    "name": "Kannada name",
    "craft": "Kannada craft",
    "region": "Kannada region",
    "experience": "Kannada experience",
    "bio": "Kannada biography",
    "badges": ["Kannada badge 1", "Kannada badge 2"]
  },
  "hi": {
    "name": "Hindi name",
    "craft": "Hindi craft",
    "region": "Hindi region",
    "experience": "Hindi experience",
    "bio": "Hindi biography",
    "badges": ["Hindi badge 1", "Hindi badge 2"]
  },
  "ta": {
    "name": "Tamil name",
    "craft": "Tamil craft",
    "region": "Tamil region",
    "experience": "Tamil experience",
    "bio": "Tamil biography",
    "badges": ["Tamil badge 1", "Tamil badge 2"]
  },
  "te": {
    "name": "Telugu name",
    "craft": "Telugu craft",
    "region": "Telugu region",
    "experience": "Telugu experience",
    "bio": "Telugu biography",
    "badges": ["Telugu badge 1", "Telugu badge 2"]
  },
  "ml": {
    "name": "Malayalam name",
    "craft": "Malayalam craft",
    "region": "Malayalam region",
    "experience": "Malayalam experience",
    "bio": "Malayalam biography",
    "badges": ["Malayalam badge 1", "Malayalam badge 2"]
  }
}

The badge arrays above are examples. Return exactly the same
number of badges as the original input.
`;

  const result = await askGemini(prompt, true, 'artisan');

  if (!result || typeof result !== 'object') {
    throw new Error('Gemini returned an invalid artisan translation response.');
  }

  const requiredFields = [
    'name',
    'craft',
    'region',
    'experience',
    'bio'
  ];

  for (const language of Object.keys(TARGET_LANGUAGES)) {
    const translation = result[language];

    if (
      !translation ||
      !requiredFields.every(
        (field) =>
          typeof translation[field] === 'string' &&
          translation[field].trim().length > 0
      )
    ) {
      throw new Error(
        `Gemini returned incomplete ${language} artisan translations.`
      );
    }

    if (
      !Array.isArray(translation.badges) ||
      translation.badges.length !== source.badges.length ||
      !translation.badges.every(
        (badge) =>
          typeof badge === 'string' && badge.trim().length > 0
      )
    ) {
      throw new Error(
        `Gemini returned incomplete ${language} badge translations.`
      );
    }
  }

  return result;
}

async function saveArtisanTranslations(artisan, translations, sourceHash) {
  if (!isSupabaseConfigured()) return;

  const rows = Object.keys(TARGET_LANGUAGES).map((language) => ({
    artisan_id: artisan.id,
    language_code: language,
    name: translations[language].name,
    craft: translations[language].craft,
    region: translations[language].region,
    experience: translations[language].experience,
    bio: translations[language].bio,
    badges: translations[language].badges,
    source_hash: sourceHash,
    updated_at: new Date().toISOString()
  }));

  try {
    const { error } = await supabase
      .from('artisan_translations')
      .upsert(rows, {
        onConflict: 'artisan_id,language_code'
      });

    if (error) {
      console.warn(
        'Artisan translations generated but cache save failed:',
        error.message
      );
    }
  } catch (error) {
    console.warn(
      'Artisan translations generated but cache save failed:',
      error.message
    );
  }
}

async function getCachedArtisanTranslation(
  artisanId,
  language,
  sourceHash
) {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('artisan_translations')
      .select('*')
      .eq('artisan_id', artisanId)
      .eq('language_code', language)
      .eq('source_hash', sourceHash)
      .maybeSingle();

    if (error) {
      console.warn(
        'Artisan translation cache lookup failed:',
        error.message
      );
      return null;
    }

    return data;
  } catch (error) {
    console.warn(
      'Artisan translation cache lookup failed:',
      error.message
    );
    return null;
  }
}

export async function translateArtisan(artisan, language = 'en') {
  if (!artisan) {
    throw new Error('Artisan profile is required for translation.');
  }

  const selectedLanguage = ARTISAN_LANGUAGES.includes(language)
    ? language
    : 'en';

  // English returns the original profile.
  if (selectedLanguage === 'en') {
    return {
      ...artisan,
      language_code: 'en'
    };
  }

  const sourceHash = createArtisanSourceHash(artisan);

  // Check Supabase cache first.
  const cached = await getCachedArtisanTranslation(
    artisan.id,
    selectedLanguage,
    sourceHash
  );

  if (cached) {
    return {
      ...artisan,
      name: cached.name || artisan.name,
      craft: cached.craft,
      region: cached.region,
      experience: cached.experience,
      bio: cached.bio,
      badges: Array.isArray(cached.badges)
        ? cached.badges
        : artisan.badges || [],
      language_code: selectedLanguage
    };
  }

  // Generate all five translations in one Gemini request.
  const translations = await generateAllArtisanTranslations(artisan);

  // Cache all five languages in Supabase.
  await saveArtisanTranslations(
    artisan,
    translations,
    sourceHash
  );

  const selectedTranslation = translations[selectedLanguage];

  return {
    ...artisan,
    name: selectedTranslation.name,
    craft: selectedTranslation.craft,
    region: selectedTranslation.region,
    experience: selectedTranslation.experience,
    bio: selectedTranslation.bio,
    badges: selectedTranslation.badges,
    language_code: selectedLanguage
  };
}

