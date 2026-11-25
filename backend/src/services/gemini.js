
import { GoogleGenAI, Type } from '@google/genai';

let client;

// Keep Gemini requests under the free-tier requests-per-minute limit.
const MIN_REQUEST_INTERVAL_MS = 5000;

let requestQueue = Promise.resolve();
let lastGeminiRequestAt = 0;

function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing from backend/.env');
  }

  if (!client) {
    client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });
  }

  return client;
}

const stringField = {
  type: Type.STRING
};

const stringArrayField = {
  type: Type.ARRAY,
  items: {
    type: Type.STRING
  }
};

// Catalog schema
const catalogFields = {
  type: Type.OBJECT,
  properties: {
    title: stringField,
    description: stringField,
    story: stringField,
    region: stringField,
    materials: stringArrayField,
    tags: stringArrayField,
    seo_keywords: stringField
  },
  required: [
    'title',
    'description',
    'story',
    'region',
    'materials',
    'tags',
    'seo_keywords'
  ]
};

const catalogResponseSchema = {
  type: Type.OBJECT,
  properties: {
    detectedLanguage: stringField,
    catalog: catalogFields,
    translations: {
      type: Type.OBJECT,
      properties: {
        en: catalogFields,
        kn: catalogFields,
        hi: catalogFields,
        ta: catalogFields,
        te: catalogFields,
        ml: catalogFields
      },
      required: ['en', 'kn', 'hi', 'ta', 'te', 'ml']
    }
  },
  required: [
    'detectedLanguage',
    'catalog',
    'translations'
  ]
};

// Artisan schema
const artisanFields = {
  type: Type.OBJECT,
  properties: {
    name: stringField,
    craft: stringField,
    region: stringField,
    experience: stringField,
    bio: stringField,
    badges: stringArrayField
  },
  required: [
    'name',
    'craft',
    'region',
    'experience',
    'bio',
    'badges'
  ]
};

const artisanResponseSchema = {
  type: Type.OBJECT,
  properties: {
    kn: artisanFields,
    hi: artisanFields,
    ta: artisanFields,
    te: artisanFields,
    ml: artisanFields
  },
  required: ['kn', 'hi', 'ta', 'te', 'ml']
};

// Product schema
const productFields = {
  type: Type.OBJECT,
  properties: {
    title: stringField,
    description: stringField,
    region: stringField,
    materials: stringArrayField,
    tags: stringArrayField,
    story: stringField,
    seo_keywords: stringField
  },
  required: [
    'title',
    'description',
    'region',
    'materials',
    'tags',
    'story',
    'seo_keywords'
  ]
};

// All-language product schema
const productResponseSchema = {
  type: Type.OBJECT,
  properties: {
    en: productFields,
    kn: productFields,
    hi: productFields,
    ta: productFields,
    te: productFields,
    ml: productFields
  },
  required: ['en', 'kn', 'hi', 'ta', 'te', 'ml']
};

// Single-language product schema
const singleProductResponseSchema = {
  type: Type.OBJECT,
  properties: {
    title: stringField,
    description: stringField,
    materials: stringArrayField,
    tags: stringArrayField,
    story: stringField,
    seo_keywords: stringField
  },
  required: [
    'title',
    'description',
    'materials',
    'tags',
    'story',
    'seo_keywords'
  ]
};

function getResponseSchema(schemaType) {
  switch (schemaType) {
    case 'catalog':
      return catalogResponseSchema;

    case 'artisan':
      return artisanResponseSchema;

    case 'product':
      return productResponseSchema;

    case 'productSingle':
      return singleProductResponseSchema;

    default:
      throw new Error(
        `Unknown Gemini response schema: ${schemaType}`
      );
  }
}

function parseGeminiJSON(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Gemini returned an empty response.');
  }

  try {
    const parsed = JSON.parse(text);

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed)
    ) {
      throw new Error('Response must be a JSON object.');
    }

    return parsed;
  } catch (error) {
    throw new Error(
      `Gemini returned invalid JSON: ${error.message}`
    );
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Queue requests so they do not hit Gemini simultaneously.
function generateContentQueued(ai, request) {
  const queuedRequest = requestQueue.then(async () => {
    const elapsed = Date.now() - lastGeminiRequestAt;

    const wait = Math.max(
      0,
      MIN_REQUEST_INTERVAL_MS - elapsed
    );

    if (wait > 0) {
      console.log(
        `Gemini request queued. Waiting ${Math.ceil(wait / 1000)} seconds...`
      );

      await sleep(wait);
    }

    lastGeminiRequestAt = Date.now();

    return ai.models.generateContent(request);
  });

  // Keep the queue usable even if an individual request fails.
  requestQueue = queuedRequest.catch(() => {});

  return queuedRequest;
}

function getErrorStatus(error) {
  return Number(
    error?.status ||
    error?.statusCode ||
    error?.code ||
    error?.response?.status ||
    0
  );
}

function isRetryableError(error) {
  return [429, 500, 502, 503, 504].includes(
    getErrorStatus(error)
  );
}

// Read retryDelay suggested by Google's API when available.
function getServerRetryDelay(error) {
  const message = String(error?.message || error || '');

  const patterns = [
    /"retryDelay"\s*:\s*"([\d.]+)s"/i,
    /retry\s+in\s+([\d.]+)\s*s/i,
    /retryDelay["']?\s*[:=]\s*["']?([\d.]+)\s*s/i
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);

    if (match) {
      return Math.ceil(Number(match[1]) * 1000);
    }
  }

  return 0;
}

export async function askGemini(
  prompt,
  json = false,
  schemaType = 'catalog'
) {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('A valid Gemini prompt is required.');
  }

  const ai = getGeminiClient();

  const model =
    process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

  const config = {
    temperature: 0.2
  };

  if (json) {
    config.responseMimeType = 'application/json';
    config.responseSchema = getResponseSchema(schemaType);
  }

  const maxAttempts = 4;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(
        `Gemini request: model=${model}, schema=${json ? schemaType : 'text'}, attempt=${attempt}/${maxAttempts}`
      );

      const response = await generateContentQueued(ai, {
        model,
        contents: prompt,
        config
      });

      const responseText = response.text;

      if (!responseText || !responseText.trim()) {
        throw new Error('Gemini returned an empty response.');
      }

      if (!json) {
        return responseText.trim();
      }

      return parseGeminiJSON(responseText);

    } catch (error) {
      const status = getErrorStatus(error);
      const retryable = isRetryableError(error);

      console.error(
        `Gemini request failed on attempt ${attempt}:`,
        error.message
      );

      if (!retryable || attempt === maxAttempts) {
        throw new Error(
          `Gemini API request failed: ${error.message}`
        );
      }

      const exponentialDelay =
        2000 * Math.pow(2, attempt - 1);

      const serverDelay = getServerRetryDelay(error);

      const delay =
        Math.max(exponentialDelay, serverDelay) +
        Math.floor(Math.random() * 500);

      console.log(
        `Gemini temporary error (${status}). Retrying in ${Math.ceil(delay / 1000)} seconds...`
      );

      await sleep(delay);
    }
  }

  throw new Error(
    'Gemini request failed after all retry attempts.'
  );
}
