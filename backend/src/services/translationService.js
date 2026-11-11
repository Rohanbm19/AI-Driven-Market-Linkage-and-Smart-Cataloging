
const BHASINI_URL = 'https://mcp.bhasini.com/v1/translate';

export const SUPPORTED_LANGUAGES = {
  en: 'English',
  kn: 'Kannada',
  hi: 'Hindi',
  ml: 'Malayalam',
  ta: 'Tamil',
  te: 'Telugu'
};

// Translate one piece of text.
export async function translateText(text, targetLanguage) {
  if (!text || !String(text).trim()) {
    return text || '';
  }

  if (!SUPPORTED_LANGUAGES[targetLanguage]) {
    throw new Error(`Unsupported language: ${targetLanguage}`);
  }

  if (targetLanguage === 'en') {
    return text;
  }

  const cleanText = String(text);

  // Bhashini allows up to 5000 characters per request.
  if (cleanText.length > 5000) {
    throw new Error('Text exceeds the 5000-character translation limit.');
  }

  const response = await fetch(BHASINI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: cleanText,
      source: 'en',
      target: targetLanguage
    }),
    signal: AbortSignal.timeout(30000)
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error ||
      result.message ||
      `Bhashini request failed: ${response.status}`
    );
  }

  if (typeof result.translation !== 'string') {
    throw new Error('Bhashini returned an invalid translation.');
  }

  return result.translation;
}

// Translate a product's displayable text fields.
export async function translateProduct(product, language) {
  if (language === 'en') {
    return product;
  }

  if (!SUPPORTED_LANGUAGES[language]) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const [
    title,
    description,
    region,
    artisan_name,
    materials,
    tags
  ] = await Promise.all([
    translateText(product.title || '', language),
    translateText(product.description || '', language),
    translateText(product.region || '', language),
    translateText(product.artisan_name || '', language),

    Promise.all(
      (Array.isArray(product.materials) ? product.materials : [])
        .map(item => translateText(item, language))
    ),

    Promise.all(
      (Array.isArray(product.tags) ? product.tags : [])
        .map(item => translateText(item, language))
    )
  ]);

  return {
    ...product,
    title,
    description,
    region,
    artisan_name,
    materials,
    tags
  };
}
