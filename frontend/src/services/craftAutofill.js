/**
 * craftAutofill.js
 * ----------------------------------------------------------------------------
 * Reads the artisan's craft story (English, Kannada, Hindi, Tamil, Telugu or
 * Malayalam) and works out everything else on the "Add Craft" form:
 *
 *   category, title, region/village, materials, tags, artisan name,
 *   labour hours, material cost and a fair selling price.
 *
 * It runs fully in the browser (no API key, works offline and instantly) and
 * returns text in the language the artisan has selected in the app, so the
 * result switches language together with the rest of the UI.
 *
 * Everything returned is a *suggestion*; the form keeps every field editable.
 */

const LANGS = ['en', 'kn', 'hi', 'ta', 'te', 'ml'];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const INDIC_DIGITS = [
  ['೦', '೧', '೨', '೩', '೪', '೫', '೬', '೭', '೮', '೯'], // Kannada
  ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'], // Devanagari
  ['௦', '௧', '௨', '௩', '௪', '௫', '௬', '௭', '௮', '௯'], // Tamil
  ['౦', '౧', '౨', '౩', '౪', '౫', '౬', '౭', '౮', '౯'], // Telugu
  ['൦', '൧', '൨', '൩', '൪', '൫', '൬', '൭', '൮', '൯'] // Malayalam
];

function normalizeText(text) {
  let out = String(text || '');
  INDIC_DIGITS.forEach((set) => {
    set.forEach((ch, i) => {
      out = out.split(ch).join(String(i));
    });
  });
  return out;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const ASCII_ONLY = /^[a-z0-9 '&-]+$/i;

/**
 * Keyword match.
 *  - Latin words match as whole words (plural "s"/"es" allowed): "pot" ≠ "pottery"
 *  - Latin words ending in "*" match as prefixes: "weav*" → weaving, weaver
 *  - Indic words match as substrings (they inflect heavily)
 */
function hasKeyword(lowerText, keyword) {
  const kw = keyword.toLowerCase();
  if (kw.endsWith('*')) {
    return new RegExp(`\\b${escapeRegExp(kw.slice(0, -1))}`, 'i').test(lowerText);
  }
  if (ASCII_ONLY.test(kw)) {
    return new RegExp(`\\b${escapeRegExp(kw)}(?:s|es)?\\b`, 'i').test(lowerText);
  }
  // Indic words inflect ("ತಂಜಾವೂರು" -> "ತಂಜಾವೂರಿನಲ್ಲಿ"): drop a trailing virama and match the stem.
  const stem = kw.replace(/[\u0BCD\u0CCD\u094D\u0C4D\u0D4D]$/, '');
  return lowerText.includes(stem.length > 1 ? stem : kw);
}

function countMatches(lowerText, keywords) {
  return keywords.reduce((n, kw) => (hasKeyword(lowerText, kw) ? n + 1 : n), 0);
}

const pick = (map, lang) => map[lang] || map.en;

/* -------------------------------------------------------------------------- */
/* Category                                                                   */
/* -------------------------------------------------------------------------- */

const CATEGORY_RULES = [
  {
    key: 'pottery',
    words: [
      'terracotta', 'clay', 'pottery', 'potter', 'ceramic*', 'kiln', 'earthen*',
      'ಮಣ್ಣಿನ', 'ಕುಂಬಾರ', 'ಟೆರಾಕೋಟಾ', 'ಜೇಡಿ', 'ಮಡಿಕೆ',
      'मिट्टी', 'कुम्हार', 'टेराकोटा', 'मृदा',
      'மண்', 'குயவர்', 'மட்பாண்ட', 'களிமண்', 'டெரகோட்டா',
      'మట్టి', 'కుమ్మరి', 'టెర్రాకోట', 'కుండ',
      'കളിമണ്', 'കുശവ', 'ടെറാക്കോട്ട', 'മൺപാത്ര'
    ]
  },
  {
    key: 'textiles',
    words: [
      'saree', 'sari', 'silk', 'handloom', 'weav*', 'loom', 'textile*', 'cotton', 'zari', 'khadi', 'fabric',
      'ಸೀರೆ', 'ರೇಷ್ಮೆ', 'ನೇಯ್ಗೆ', 'ಕೈಮಗ್ಗ', 'ಹತ್ತಿ', 'ಜರಿ',
      'साड़ी', 'साडी', 'रेशम', 'बुनकर', 'हथकरघा', 'बुनाई', 'सूती', 'ज़री',
      'சேலை', 'பட்டு', 'நெசவு', 'கைத்தறி', 'பருத்தி',
      'పట్టు', 'చీర', 'నేత', 'చేనేత', 'పత్తి',
      'സാരി', 'പട്ട്', 'നെയ്ത്', 'കൈത്തറി', 'പരുത്തി'
    ]
  },
  {
    key: 'metal',
    words: [
      'brass', 'bronze', 'bell metal', 'copper', 'metal*', 'dokra', 'bidri', 'bidriware', 'silverware', 'cast*',
      'ಹಿತ್ತಾಳೆ', 'ಕಂಚು', 'ತಾಮ್ರ', 'ಲೋಹ', 'ಬಿದ್ರಿ',
      'पीतल', 'कांसा', 'काँसा', 'तांबा', 'धातु', 'ढोकरा',
      'பித்தளை', 'வெண்கல', 'செம்பு', 'உலோக',
      'ఇత్తడి', 'కంచు', 'రాగి', 'లోహ',
      'പിച്ചള', 'വെങ്കല', 'ചെമ്പ്', 'ലോഹ'
    ]
  },
  {
    key: 'woodwork',
    words: [
      'wood*', 'carv*', 'teak', 'rosewood', 'sandalwood', 'lacquer*', 'channapatna', 'timber', 'bamboo', 'cane',
      'ಮರ', 'ಕೆತ್ತನೆ', 'ಆಟಿಕೆ', 'ಚನ್ನಪಟ್ಟಣ', 'ಶ್ರೀಗಂಧ', 'ಬಿದಿರು',
      'लकड़ी', 'काष्ठ', 'नक्काशी', 'खिलौन', 'चंदन', 'बांस',
      'மரம்', 'மர ', 'செதுக்கு', 'பொம்மை', 'சந்தன', 'மூங்கில்',
      'చెక్క', 'చెక్కడ', 'బొమ్మ', 'వెదురు',
      'മരം', 'കൊത്തുപണി', 'തടി', 'ചന്ദന', 'മുള'
    ]
  },
  {
    key: 'painting',
    words: [
      'paint*', 'pattachitra', 'madhubani', 'warli', 'kalamkari', 'tanjore', 'miniature', 'canvas', 'scroll',
      'ಚಿತ್ರಕಲೆ', 'ಚಿತ್ರ ಬಿಡಿ', 'ಕೈಚಿತ್ರ',
      'चित्रकला', 'पेंटिंग', 'मधुबनी', 'वारली', 'पट्टचित्र', 'चित्रकारी',
      'ஓவிய', 'ஓவியம்', 'கலம்காரி', 'தஞ்சாவூர் ஓவிய',
      'చిత్రకళ', 'పెయింటింగ్', 'కలంకారీ', 'చిత్ర',
      'ചിത്രകല', 'ചിത്രം വര', 'ചുമർചിത്ര'
    ]
  }
];

/** Returns 'pottery' | 'textiles' | 'metal' | 'woodwork' | 'painting' | null */
export function detectCategoryKey(text) {
  const lower = normalizeText(text).toLowerCase();
  if (!lower.trim()) return null;
  let best = null;
  let bestScore = 0;
  CATEGORY_RULES.forEach((rule) => {
    const score = countMatches(lower, rule.words);
    if (score > bestScore) {
      best = rule.key;
      bestScore = score;
    }
  });
  return best;
}

const CATEGORY_NOUN = {
  pottery: {
    en: 'Handmade Terracotta Piece', kn: 'ಕೈಯಿಂದ ಮಾಡಿದ ಮಣ್ಣಿನ ಕಲಾಕೃತಿ', hi: 'हस्तनिर्मित मिट्टी की कलाकृति',
    ta: 'கைவினை மண்பாண்ட கலைப்பொருள்', te: 'చేతితో చేసిన మట్టి కళాకృతి', ml: 'കൈകൊണ്ട് നിർമ്മിച്ച കളിമൺ കലാരൂപം'
  },
  textiles: {
    en: 'Handwoven Heritage Textile', kn: 'ಕೈಮಗ್ಗದ ಪಾರಂಪರಿಕ ವಸ್ತ್ರ', hi: 'हथकरघा विरासत वस्त्र',
    ta: 'கைத்தறி பாரம்பரிய துணி', te: 'చేనేత సంప్రదాయ వస్త్రం', ml: 'കൈത്തറി പൈതൃക വസ്ത്രം'
  },
  metal: {
    en: 'Hand-Cast Metal Craft', kn: 'ಕೈಯಿಂದ ಎರಕ ಹೊಯ್ದ ಲೋಹದ ಕಲೆ', hi: 'हस्त-ढलित धातु शिल्प',
    ta: 'கையால் வார்த்த உலோக கைவினை', te: 'చేతితో పోత పోసిన లోహ కళ', ml: 'കൈകൊണ്ട് വാർത്ത ലോഹ കരകൗശലം'
  },
  woodwork: {
    en: 'Hand-Carved Wooden Craft', kn: 'ಕೈಯಿಂದ ಕೆತ್ತಿದ ಮರದ ಕಲೆ', hi: 'हाथ से नक्काशीदार लकड़ी शिल्प',
    ta: 'கையால் செதுக்கிய மரக் கைவினை', te: 'చేతితో చెక్కిన చెక్క కళ', ml: 'കൈകൊണ്ട് കൊത്തിയ തടി കരകൗശലം'
  },
  painting: {
    en: 'Traditional Handpainted Artwork', kn: 'ಸಾಂಪ್ರದಾಯಿಕ ಕೈಚಿತ್ರ', hi: 'पारंपरिक हस्तचित्रित कलाकृति',
    ta: 'பாரம்பரிய கைவண்ண ஓவியம்', te: 'సంప్రదాయ చేతి చిత్రకళ', ml: 'പരമ്പരാഗത കൈച്ചിത്രം'
  },
  other: {
    en: 'Traditional Handmade Craft', kn: 'ಸಾಂಪ್ರದಾಯಿಕ ಕೈಕೆಲಸದ ಕಲೆ', hi: 'पारंपरिक हस्तनिर्मित शिल्प',
    ta: 'பாரம்பரிய கைவினைப் பொருள்', te: 'సంప్రదాయ చేతి కళ', ml: 'പരമ്പരാഗത കരകൗശല വസ്തു'
  }
};

// Typical effort / material cost when the story doesn't say (shown as AI estimates).
const CATEGORY_DEFAULTS = {
  pottery: { hours: 5, materialCost: 150, materials: ['clay'] },
  textiles: { hours: 24, materialCost: 1200, materials: ['silk', 'zari'] },
  metal: { hours: 12, materialCost: 900, materials: ['brass'] },
  woodwork: { hours: 8, materialCost: 250, materials: ['wood', 'lac'] },
  painting: { hours: 10, materialCost: 300, materials: ['dyes'] },
  other: { hours: 6, materialCost: 300, materials: [] }
};

/* -------------------------------------------------------------------------- */
/* Products (give a more specific title than the category)                    */
/* -------------------------------------------------------------------------- */

const PRODUCTS = [
  {
    id: 'saree', category: 'textiles',
    words: ['saree', 'sari', 'ಸೀರೆ', 'साड़ी', 'साडी', 'சேலை', 'చీర', 'സാരി'],
    name: {
      en: 'Handwoven Saree', kn: 'ಕೈಮಗ್ಗದ ಸೀರೆ', hi: 'हथकरघा साड़ी',
      ta: 'கைத்தறிச் சேலை', te: 'చేనేత చీర', ml: 'കൈത്തറി സാരി'
    }
  },
  {
    id: 'toy', category: 'woodwork',
    words: ['toy', 'doll', 'ಆಟಿಕೆ', 'ಬೊಂಬೆ', 'खिलौन', 'गुड़िया', 'பொம்மை', 'బొమ్మ', 'കളിപ്പാട്ട', 'പാവ'],
    name: {
      en: 'Handcrafted Toy', kn: 'ಕೈಯಿಂದ ಮಾಡಿದ ಆಟಿಕೆ', hi: 'हस्तनिर्मित खिलौना',
      ta: 'கைவினைப் பொம்மை', te: 'చేతితో చేసిన బొమ్మ', ml: 'കൈകൊണ്ട് നിർമ്മിച്ച കളിപ്പാട്ടം'
    }
  },
  {
    id: 'lamp', category: null,
    words: ['lamp', 'diya', 'lantern', 'ದೀಪ', 'दीपक', 'दीया', 'விளக்கு', 'దీపం', 'വിളക്ക്'],
    name: {
      en: 'Traditional Lamp', kn: 'ಸಾಂಪ್ರದಾಯಿಕ ದೀಪ', hi: 'पारंपरिक दीपक',
      ta: 'பாரம்பரிய விளக்கு', te: 'సంప్రదాయ దీపం', ml: 'പരമ്പരാഗത വിളക്ക്'
    }
  },
  {
    id: 'pot', category: null,
    words: ['pot', 'vessel', 'jar', 'urn', 'kalash', 'ಮಡಿಕೆ', 'ಕುಡಿಕೆ', 'ಪಾತ್ರೆ', 'घड़ा', 'मटका', 'बर्तन', 'பானை', 'குடம்', 'பாத்திரம்', 'కుండ', 'పాత్ర', 'കലം', 'പാത്രം'],
    name: {
      en: 'Handmade Pot', kn: 'ಕೈಯಿಂದ ಮಾಡಿದ ಮಡಿಕೆ', hi: 'हस्तनिर्मित बर्तन',
      ta: 'கைவினைப் பானை', te: 'చేతితో చేసిన కుండ', ml: 'കൈകൊണ്ട് നിർമ്മിച്ച കലം'
    }
  },
  {
    id: 'statue', category: null,
    words: ['statue', 'idol', 'sculpture', 'figurine', 'horse', 'ಮೂರ್ತಿ', 'ವಿಗ್ರಹ', 'मूर्ति', 'प्रतिमा', 'घोड़ा', 'சிலை', 'విగ్రహం', 'ശില്പം', 'പ്രതിമ'],
    name: {
      en: 'Handcrafted Sculpture', kn: 'ಕೈಯಿಂದ ಮಾಡಿದ ಮೂರ್ತಿ', hi: 'हस्तनिर्मित मूर्ति',
      ta: 'கைவினைச் சிலை', te: 'చేతితో చేసిన విగ్రహం', ml: 'കൈകൊണ്ട് നിർമ്മിച്ച പ്രതിമ'
    }
  },
  {
    id: 'basket', category: 'other',
    words: ['basket', 'ಬುಟ್ಟಿ', 'टोकरी', 'கூடை', 'బుట్ట', 'കൊട്ട'],
    name: {
      en: 'Handwoven Basket', kn: 'ಕೈಯಿಂದ ನೇದ ಬುಟ್ಟಿ', hi: 'हाथ से बुनी टोकरी',
      ta: 'கையால் பின்னிய கூடை', te: 'చేతితో అల్లిన బుట్ట', ml: 'കൈകൊണ്ട് നെയ്ത കൊട്ട'
    }
  },
  {
    id: 'jewellery', category: 'metal',
    words: ['jewellery', 'jewelry', 'necklace', 'earring*', 'bangle*', 'ornament*', 'ಆಭರಣ', 'आभूषण', 'गहने', 'நகை', 'ஆபரணம்', 'ఆభరణం', 'నగలు', 'ആഭരണം'],
    name: {
      en: 'Handcrafted Jewellery', kn: 'ಕೈಯಿಂದ ಮಾಡಿದ ಆಭರಣ', hi: 'हस्तनिर्मित आभूषण',
      ta: 'கைவினை நகை', te: 'చేతితో చేసిన ఆభరణం', ml: 'കൈകൊണ്ട് നിർമ്മിച്ച ആഭരണം'
    }
  }
];

function detectProduct(lower) {
  let best = null;
  let bestScore = 0;
  PRODUCTS.forEach((p) => {
    const score = countMatches(lower, p.words);
    if (score > bestScore) {
      best = p;
      bestScore = score;
    }
  });
  return best;
}

/* -------------------------------------------------------------------------- */
/* Materials                                                                  */
/* -------------------------------------------------------------------------- */

const MATERIALS = [
  {
    id: 'clay', words: ['clay', 'mud', 'terracotta', 'ಜೇಡಿ', 'ಮಣ್ಣು', 'मिट्टी', 'களிமண்', 'మట్టి', 'കളിമണ്'],
    name: { en: 'Natural Clay', kn: 'ನೈಸರ್ಗಿಕ ಜೇಡಿಮಣ್ಣು', hi: 'प्राकृतिक मिट्टी', ta: 'இயற்கை களிமண்', te: 'సహజ మట్టి', ml: 'പ്രകൃതിദത്ത കളിമണ്ണ്' }
  },
  {
    id: 'silk', words: ['silk', 'ರೇಷ್ಮೆ', 'रेशम', 'பட்டு', 'పట్టు', 'പട്ട്'],
    name: { en: 'Pure Silk', kn: 'ಶುದ್ಧ ರೇಷ್ಮೆ', hi: 'शुद्ध रेशम', ta: 'தூய பட்டு', te: 'స్వచ్ఛమైన పట్టు', ml: 'ശുദ്ധമായ പട്ട്' }
  },
  {
    id: 'cotton', words: ['cotton', 'khadi', 'ಹತ್ತಿ', 'सूती', 'कपास', 'பருத்தி', 'పత్తి', 'പരുത്തി'],
    name: { en: 'Handspun Cotton', kn: 'ಕೈನೂಲಿನ ಹತ್ತಿ', hi: 'हाथ से काता सूती धागा', ta: 'கைநூல் பருத்தி', te: 'చేతితో వడికిన పత్తి', ml: 'കൈനൂൽ പരുത്തി' }
  },
  {
    id: 'zari', words: ['zari', 'ಜರಿ', 'ज़री', 'जरी', 'ஜரிகை', 'జరీ', 'സരി'],
    name: { en: 'Zari', kn: 'ಜರಿ', hi: 'ज़री', ta: 'ஜரிகை', te: 'జరీ', ml: 'സരി' }
  },
  {
    id: 'brass', words: ['brass', 'ಹಿತ್ತಾಳೆ', 'पीतल', 'பித்தளை', 'ఇత్తడి', 'പിച്ചള'],
    name: { en: 'Brass', kn: 'ಹಿತ್ತಾಳೆ', hi: 'पीतल', ta: 'பித்தளை', te: 'ఇత్తడి', ml: 'പിച്ചള' }
  },
  {
    id: 'bronze', words: ['bronze', 'bell metal', 'ಕಂಚು', 'कांसा', 'काँसा', 'வெண்கல', 'కంచు', 'വെങ്കല'],
    name: { en: 'Bell Metal', kn: 'ಕಂಚು', hi: 'कांसा', ta: 'வெண்கலம்', te: 'కంచు', ml: 'വെങ്കലം' }
  },
  {
    id: 'copper', words: ['copper', 'ತಾಮ್ರ', 'तांबा', 'செம்பு', 'రాగి', 'ചെമ്പ്'],
    name: { en: 'Copper', kn: 'ತಾಮ್ರ', hi: 'तांबा', ta: 'செம்பு', te: 'రాగి', ml: 'ചെമ്പ്' }
  },
  {
    id: 'silver', words: ['silver', 'ಬೆಳ್ಳಿ', 'चांदी', 'வெள்ளி', 'వెండి', 'വെള്ളി'],
    name: { en: 'Silver', kn: 'ಬೆಳ್ಳಿ', hi: 'चांदी', ta: 'வெள்ளி', te: 'వెండి', ml: 'വെള്ളി' }
  },
  {
    id: 'wood', words: ['wood*', 'timber', 'teak', 'ಮರ', 'लकड़ी', 'மரம்', 'చెక్క', 'തടി', 'മരം'],
    name: { en: 'Seasoned Wood', kn: 'ಒಣಗಿದ ಮರ', hi: 'सूखी लकड़ी', ta: 'பதப்படுத்திய மரம்', te: 'ఆరబెట్టిన చెక్క', ml: 'ഉണക്കിയ തടി' }
  },
  {
    id: 'sandalwood', words: ['sandalwood', 'ಶ್ರೀಗಂಧ', 'चंदन', 'சந்தன', 'చందన', 'ചന്ദന'],
    name: { en: 'Sandalwood', kn: 'ಶ್ರೀಗಂಧ', hi: 'चंदन', ta: 'சந்தனம்', te: 'చందనం', ml: 'ചന്ദനം' }
  },
  {
    id: 'lac', words: ['lac', 'lacquer*', 'ಲ್ಯಾಕ್', 'ಅರಗು', 'लाख', 'அரக்கு', 'లక్క', 'അരക്ക്'],
    name: { en: 'Natural Lac', kn: 'ನೈಸರ್ಗಿಕ ಲ್ಯಾಕ್', hi: 'प्राकृतिक लाख', ta: 'இயற்கை அரக்கு', te: 'సహజ లక్క', ml: 'പ്രകൃതിദത്ത അരക്ക്' }
  },
  {
    id: 'dyes', words: ['dye*', 'natural color*', 'natural colour*', 'vegetable color*', 'vegetable colour*', 'pigment*', 'ನೈಸರ್ಗಿಕ ಬಣ್ಣ', 'प्राकृतिक रंग', 'இயற்கை சாயம்', 'సహజ రంగు', 'പ്രകൃതിദത്ത നിറ'],
    name: { en: 'Natural Dyes', kn: 'ನೈಸರ್ಗಿಕ ಬಣ್ಣಗಳು', hi: 'प्राकृतिक रंग', ta: 'இயற்கை சாயங்கள்', te: 'సహజ రంగులు', ml: 'പ്രകൃതിദത്ത നിറങ്ങൾ' }
  },
  {
    id: 'bamboo', words: ['bamboo', 'cane', 'ಬಿದಿರು', 'बांस', 'மூங்கில்', 'వెదురు', 'മുള'],
    name: { en: 'Bamboo', kn: 'ಬಿದಿರು', hi: 'बांस', ta: 'மூங்கில்', te: 'వెదురు', ml: 'മുള' }
  },
  {
    id: 'jute', words: ['jute', 'ಸೆಣಬು', 'जूट', 'சணல்', 'జనపనార', 'ചണം'],
    name: { en: 'Jute', kn: 'ಸೆಣಬು', hi: 'जूट', ta: 'சணல்', te: 'జనపనార', ml: 'ചണം' }
  },
  {
    id: 'leather', words: ['leather', 'ಚರ್ಮ', 'चमड़ा', 'தோல்', 'తోలు', 'തുകൽ'],
    name: { en: 'Leather', kn: 'ಚರ್ಮ', hi: 'चमड़ा', ta: 'தோல்', te: 'తోలు', ml: 'തുകൽ' }
  },
  {
    id: 'stone', words: ['stone', 'marble', 'ಕಲ್ಲು', 'पत्थर', 'கல்', 'రాయి', 'കല്ല്'],
    name: { en: 'Stone', kn: 'ಕಲ್ಲು', hi: 'पत्थर', ta: 'கல்', te: 'రాయి', ml: 'കല്ല്' }
  }
];

function detectMaterials(lower) {
  return MATERIALS.filter((m) => countMatches(lower, m.words) > 0);
}

/* -------------------------------------------------------------------------- */
/* Places                                                                     */
/* -------------------------------------------------------------------------- */

const STATES = {
  karnataka: { en: 'Karnataka', kn: 'ಕರ್ನಾಟಕ', hi: 'कर्नाटक', ta: 'கர்நாடகா', te: 'కర్ణాటక', ml: 'കർണാടക' },
  tamilnadu: { en: 'Tamil Nadu', kn: 'ತಮಿಳುನಾಡು', hi: 'तमिलनाडु', ta: 'தமிழ்நாடு', te: 'తమిళనాడు', ml: 'തമിഴ്‌നാട്' },
  kerala: { en: 'Kerala', kn: 'ಕೇರಳ', hi: 'केरल', ta: 'கேரளா', te: 'కేరళ', ml: 'കേരളം' },
  andhra: { en: 'Andhra Pradesh', kn: 'ಆಂಧ್ರ ಪ್ರದೇಶ', hi: 'आंध्र प्रदेश', ta: 'ஆந்திரப் பிரதேசம்', te: 'ఆంధ్రప్రదేశ్', ml: 'ആന്ധ്രാപ്രദേശ്' },
  telangana: { en: 'Telangana', kn: 'ತೆಲಂಗಾಣ', hi: 'तेलंगाना', ta: 'தெலங்கானா', te: 'తెలంగాణ', ml: 'തെലങ്കാന' },
  westbengal: { en: 'West Bengal', kn: 'ಪಶ್ಚಿಮ ಬಂಗಾಳ', hi: 'पश्चिम बंगाल', ta: 'மேற்கு வங்கம்', te: 'పశ్చిమ బెంగాల్', ml: 'പശ്ചിമ ബംഗാൾ' },
  up: { en: 'Uttar Pradesh', kn: 'ಉತ್ತರ ಪ್ರದೇಶ', hi: 'उत्तर प्रदेश', ta: 'உத்தரப் பிரதேசம்', te: 'ఉత్తర ప్రదేశ్', ml: 'ഉത്തർപ്രദേശ്' },
  rajasthan: { en: 'Rajasthan', kn: 'ರಾಜಸ್ಥಾನ', hi: 'राजस्थान', ta: 'ராஜஸ்தான்', te: 'రాజస్థాన్', ml: 'രാജസ്ഥാൻ' },
  gujarat: { en: 'Gujarat', kn: 'ಗುಜರಾತ್', hi: 'गुजरात', ta: 'குஜராத்', te: 'గుజరాత్', ml: 'ഗുജറാത്ത്' },
  odisha: { en: 'Odisha', kn: 'ಒಡಿಶಾ', hi: 'ओडिशा', ta: 'ஒடிசா', te: 'ఒడిశా', ml: 'ഒഡീഷ' },
  bihar: { en: 'Bihar', kn: 'ಬಿಹಾರ', hi: 'बिहार', ta: 'பீகார்', te: 'బీహార్', ml: 'ബിഹാർ' },
  jk: { en: 'Jammu & Kashmir', kn: 'ಜಮ್ಮು ಮತ್ತು ಕಾಶ್ಮೀರ', hi: 'जम्मू और कश्मीर', ta: 'ஜம்மு காஷ்மீர்', te: 'జమ్మూ కాశ్మీర్', ml: 'ജമ്മു കശ്മീർ' },
  maharashtra: { en: 'Maharashtra', kn: 'ಮಹಾರಾಷ್ಟ್ರ', hi: 'महाराष्ट्र', ta: 'மகாராஷ்டிரா', te: 'మహారాష్ట్ర', ml: 'മഹാരാഷ്ട്ര' },
  assam: { en: 'Assam', kn: 'ಅಸ್ಸಾಂ', hi: 'असम', ta: 'அசாம்', te: 'అస్సాం', ml: 'അസം' }
};

// Famous craft hubs. `names` are the display names per language (English is the fallback);
// `match` lists extra spellings (any script) that identify the place in a story.
const PLACES = [
  { state: 'karnataka', names: { en: 'Channapatna', kn: 'ಚನ್ನಪಟ್ಟಣ', hi: 'चन्नपट्टन', ta: 'சென்னப்பட்டணா', te: 'చెన్నపట్టణ', ml: 'ചന്നപട്ടണ' }, match: ['channapatna', 'channapattana'] },
  { state: 'karnataka', names: { en: 'Bidar', kn: 'ಬೀದರ್', hi: 'बीदर', ta: 'பிதார்', te: 'బీదర్', ml: 'ബിദർ' }, match: ['bidar'] },
  { state: 'karnataka', names: { en: 'Mysuru', kn: 'ಮೈಸೂರು', hi: 'मैसूर', ta: 'மைசூர்', te: 'మైసూరు', ml: 'മൈസൂരു' }, match: ['mysuru', 'mysore'] },
  { state: 'karnataka', names: { en: 'Bengaluru', kn: 'ಬೆಂಗಳೂರು', hi: 'बेंगलुरु', ta: 'பெங்களூரு', te: 'బెంగళూరు', ml: 'ബെംഗളൂരു' }, match: ['bengaluru', 'bangalore'] },
  { state: 'karnataka', names: { en: 'Kinnal', kn: 'ಕಿನ್ನಾಳ' }, match: ['kinnal', 'kinhal'] },
  { state: 'karnataka', names: { en: 'Ilkal', kn: 'ಇಳಕಲ್' }, match: ['ilkal', 'ilkal'] },
  { state: 'karnataka', names: { en: 'Udupi', kn: 'ಉಡುಪಿ', hi: 'उडुपी', ta: 'உடுப்பி', te: 'ఉడుపి', ml: 'ഉഡുപ്പി' }, match: ['udupi'] },
  { state: 'karnataka', names: { en: 'Dharwad', kn: 'ಧಾರವಾಡ', hi: 'धारवाड़' }, match: ['dharwad'] },
  { state: 'karnataka', names: { en: 'Belagavi', kn: 'ಬೆಳಗಾವಿ', hi: 'बेलगावी' }, match: ['belagavi', 'belgaum'] },
  { state: 'tamilnadu', names: { en: 'Kanchipuram', kn: 'ಕಾಂಚೀಪುರಂ', hi: 'कांचीपुरम', ta: 'காஞ்சிபுரம்', te: 'కాంచీపురం', ml: 'കാഞ്ചീപുരം' }, match: ['kanchipuram', 'kanjivaram', 'kancheepuram', 'conjeevaram'] },
  { state: 'tamilnadu', names: { en: 'Thanjavur', kn: 'ತಂಜಾವೂರು', hi: 'तंजावुर', ta: 'தஞ்சாவூர்', te: 'తంజావూరు', ml: 'തഞ്ചാവൂർ' }, match: ['thanjavur', 'tanjore'] },
  { state: 'tamilnadu', names: { en: 'Madurai', kn: 'ಮಧುರೈ', hi: 'मदुरै', ta: 'மதுரை', te: 'మధురై', ml: 'മധുര' }, match: ['madurai'] },
  { state: 'tamilnadu', names: { en: 'Mahabalipuram', kn: 'ಮಹಾಬಲಿಪುರಂ', hi: 'महाबलीपुरम', ta: 'மகாபலிபுரம்', te: 'మహాబలిపురం', ml: 'മഹാബലിപുരം' }, match: ['mahabalipuram', 'mamallapuram'] },
  { state: 'tamilnadu', names: { en: 'Kumbakonam', kn: 'ಕುಂಭಕೋಣಂ', hi: 'कुंभकोणम', ta: 'கும்பகோணம்' }, match: ['kumbakonam'] },
  { state: 'telangana', names: { en: 'Pochampally', kn: 'ಪೋಚಂಪಲ್ಲಿ', hi: 'पोचमपल्ली', ta: 'போச்சம்பள்ளி', te: 'పోచంపల్లి', ml: 'പോച്ചമ്പള്ളി' }, match: ['pochampally', 'pochampalli', 'pochampalli'] },
  { state: 'telangana', names: { en: 'Hyderabad', kn: 'ಹೈದರಾಬಾದ್', hi: 'हैदराबाद', ta: 'ஹைதராபாத்', te: 'హైదరాబాద్', ml: 'ഹൈദരാബാദ്' }, match: ['hyderabad'] },
  { state: 'telangana', names: { en: 'Nirmal', te: 'నిర్మల్' }, match: ['nirmal'] },
  { state: 'andhra', names: { en: 'Srikalahasti', kn: 'ಶ್ರೀಕಾಳಹಸ್ತಿ', hi: 'श्रीकालहस्ती', te: 'శ్రీకాళహస్తి' }, match: ['srikalahasti', 'kalahasti'] },
  { state: 'andhra', names: { en: 'Kondapalli', kn: 'ಕೊಂಡಪಲ್ಲಿ', te: 'కొండపల్లి' }, match: ['kondapalli'] },
  { state: 'andhra', names: { en: 'Etikoppaka', te: 'ఏటికొప్పాక' }, match: ['etikoppaka'] },
  { state: 'andhra', names: { en: 'Machilipatnam', te: 'మచిలీపట్నం' }, match: ['machilipatnam', 'masulipatnam'] },
  { state: 'kerala', names: { en: 'Aranmula', kn: 'ಆರನ್ಮುಳ', hi: 'अरनमुला', ta: 'ஆரன்முளா', te: 'ఆరన్ముళ', ml: 'ആറന്മുള' }, match: ['aranmula'] },
  { state: 'kerala', names: { en: 'Alappuzha', kn: 'ಆಲಪ್ಪುಳ', hi: 'अलप्पुझा', ta: 'ஆலப்புழா', te: 'ఆలప్పుళ', ml: 'ആലപ്പുഴ' }, match: ['alappuzha', 'alleppey'] },
  { state: 'kerala', names: { en: 'Kozhikode', kn: 'ಕೋಝಿಕ್ಕೋಡ್', hi: 'कोझिकोड', ta: 'கோழிக்கோடு', te: 'కోజికోడ్', ml: 'കോഴിക്കോട്' }, match: ['kozhikode', 'calicut'] },
  { state: 'kerala', names: { en: 'Kannur', kn: 'ಕಣ್ಣೂರು', hi: 'कन्नूर', ta: 'கண்ணூர்', te: 'కన్నూర్', ml: 'കണ്ണൂർ' }, match: ['kannur', 'cannanore'] },
  { state: 'westbengal', names: { en: 'Bishnupur', kn: 'ಬಿಷ್ಣುಪುರ', hi: 'बिष्णुपुर', ta: 'பிஷ்ணுபூர்', te: 'బిష్ణుపూర్', ml: 'ബിഷ്ണുപൂർ' }, match: ['bishnupur', 'vishnupur'] },
  { state: 'westbengal', names: { en: 'Bankura', kn: 'ಬಂಕುರಾ', hi: 'बांकुरा', ta: 'பாங்குரா', te: 'బంకురా', ml: 'ബാങ്കുറ' }, match: ['bankura'] },
  { state: 'westbengal', names: { en: 'Santiniketan', kn: 'ಶಾಂತಿನಿಕೇತನ', hi: 'शांतिनिकेतन', ta: 'சாந்திநிகேதன்', te: 'శాంతినికేతన్', ml: 'ശാന്തിനികേതൻ' }, match: ['santiniketan', 'shantiniketan'] },
  { state: 'up', names: { en: 'Varanasi', kn: 'ವಾರಣಾಸಿ', hi: 'वाराणसी', ta: 'வாரணாசி', te: 'వారణాసి', ml: 'വാരണാസി' }, match: ['varanasi', 'banaras', 'benares', 'बनारस'] },
  { state: 'up', names: { en: 'Lucknow', kn: 'ಲಕ್ನೋ', hi: 'लखनऊ', ta: 'லக்னோ', te: 'లక్నో', ml: 'ലഖ്നൗ' }, match: ['lucknow'] },
  { state: 'up', names: { en: 'Moradabad', hi: 'मुरादाबाद' }, match: ['moradabad'] },
  { state: 'up', names: { en: 'Khurja', hi: 'खुर्जा' }, match: ['khurja'] },
  { state: 'rajasthan', names: { en: 'Jaipur', kn: 'ಜೈಪುರ', hi: 'जयपुर', ta: 'ஜெய்ப்பூர்', te: 'జైపూర్', ml: 'ജയ്പൂർ' }, match: ['jaipur'] },
  { state: 'rajasthan', names: { en: 'Jodhpur', kn: 'ಜೋಧ್‌ಪುರ', hi: 'जोधपुर', ta: 'ஜோத்பூர்', te: 'జోధ్‌పూర్', ml: 'ജോധ്പൂർ' }, match: ['jodhpur'] },
  { state: 'rajasthan', names: { en: 'Udaipur', kn: 'ಉದಯಪುರ', hi: 'उदयपुर', ta: 'உதய்ப்பூர்', te: 'ఉదయపూర్', ml: 'ഉദയ്പൂർ' }, match: ['udaipur'] },
  { state: 'gujarat', names: { en: 'Kutch', kn: 'ಕಚ್', hi: 'कच्छ', ta: 'கட்ச்', te: 'కచ్', ml: 'കച്ച്' }, match: ['kutch', 'kachchh', 'bhuj', 'भुज'] },
  { state: 'gujarat', names: { en: 'Patan', hi: 'पाटन' }, match: ['patan'] },
  { state: 'odisha', names: { en: 'Puri', kn: 'ಪುರಿ', hi: 'पुरी', ta: 'பூரி', te: 'పూరి', ml: 'പുരി' }, match: ['puri', 'raghurajpur', 'pipli'] },
  { state: 'odisha', names: { en: 'Cuttack', hi: 'कटक' }, match: ['cuttack'] },
  { state: 'bihar', names: { en: 'Madhubani', kn: 'ಮಧುಬನಿ', hi: 'मधुबनी', ta: 'மதுபனி', te: 'మధుబని', ml: 'മധുബനി' }, match: ['madhubani'] },
  { state: 'bihar', names: { en: 'Bhagalpur', hi: 'भागलपुर' }, match: ['bhagalpur'] },
  { state: 'jk', names: { en: 'Srinagar', kn: 'ಶ್ರೀನಗರ', hi: 'श्रीनगर', ta: 'ஸ்ரீநகர்', te: 'శ్రీనగర్', ml: 'ശ്രീനഗർ' }, match: ['srinagar', 'kashmir', 'कश्मीर', 'ಕಾಶ್ಮೀರ', 'காஷ்மீர்', 'కశ్మీర్', 'കശ്മീർ'] },
  { state: 'maharashtra', names: { en: 'Kolhapur', kn: 'ಕೊಲ್ಹಾಪುರ', hi: 'कोल्हापुर' }, match: ['kolhapur'] },
  { state: 'maharashtra', names: { en: 'Sawantwadi' }, match: ['sawantwadi'] },
  { state: 'assam', names: { en: 'Sualkuchi' }, match: ['sualkuchi'] }
];

const PLACE_STOPWORDS = new Set([
  'India', 'Indian', 'The', 'My', 'Our', 'This', 'That', 'It', 'We', 'I', 'A', 'An', 'Every', 'Each', 'Today', 'Yesterday',
  'Karnataka', 'Kerala', 'Tamil', 'Telangana', 'Andhra', 'Bengal', 'Odisha', 'Rajasthan', 'Gujarat', 'Bihar'
]);

function placeCandidates(place) {
  return [...place.match, ...Object.values(place.names)].map((c) => c.toLowerCase());
}

/** Remove known place names from the text so they are not mistaken for materials/products. */
function maskPlaces(lower) {
  let out = lower;
  PLACES.forEach((place) => {
    placeCandidates(place).forEach((c) => {
      const stem = c.replace(/[\u0BCD\u0CCD\u094D\u0C4D\u0D4D]$/, '');
      if (stem.length > 2) out = out.split(stem).join(' ');
    });
  });
  return out;
}

function detectPlace(originalText, lower, lang) {
  // 1) Known craft hubs in any script
  for (const place of PLACES) {
    if (placeCandidates(place).some((c) => hasKeyword(lower, c))) {
      const name = pick(place.names, lang);
      const state = pick(STATES[place.state], lang);
      return { text: `${name}, ${state}`, short: name };
    }
  }

  // 2) "in/from/at/near/village of  <Capitalised Name>" in Latin text
  const re = /\b(?:in|from|at|near|village of|town of|district of)\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?)/g;
  let m;
  while ((m = re.exec(originalText)) !== null) {
    const first = m[1].split(' ')[0];
    if (!PLACE_STOPWORDS.has(first)) {
      return { text: m[1], short: m[1] };
    }
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Artisan name                                                               */
/* -------------------------------------------------------------------------- */

const NAME_PATTERNS = [
  {
    re: /(?:[Mm]y name is|[Ii] am|[Ii]'m|[Mm]ade by|[Cc]rafted by)\s+([A-Z][\p{L}.'-]+(?:\s+[A-Z][\p{L}.'-]+){0,2})/u,
    stop: []
  },
  { re: /ನನ್ನ ಹೆಸರು\s+([\u0C80-\u0CFF]+(?:\s+[\u0C80-\u0CFF]+)?)/, stop: ['ನಾನು', 'ಮತ್ತು', 'ಇದು', 'ನಾನೊಬ್ಬ', 'ಎಂದು'] },
  { re: /मेरा नाम\s+([\u0900-\u097F]+(?:\s+[\u0900-\u097F]+)?)/, stop: ['है', 'हूँ', 'हूं', 'और', 'मैं', 'से'] },
  { re: /என் பெயர்\s+([\u0B80-\u0BFF]+(?:\s+[\u0B80-\u0BFF]+)?)/, stop: ['ஆகும்', 'நான்', 'மற்றும்', 'என்று'] },
  { re: /నా పేరు\s+([\u0C00-\u0C7F]+(?:\s+[\u0C00-\u0C7F]+)?)/, stop: ['నేను', 'మరియు', 'అని'] },
  { re: /എന്റെ പേര്\s+([\u0D00-\u0D7F]+(?:\s+[\u0D00-\u0D7F]+)?)/, stop: ['ഞാൻ', 'ആണ്', 'എന്ന്'] }
];

function detectArtisanName(text) {
  for (const { re, stop } of NAME_PATTERNS) {
    const m = text.match(re);
    if (m) {
      const words = m[1].trim().split(/\s+/)
        .map((w) => w.replace(/[.,।!?;:]+$/u, ''))
        .filter(Boolean);
      const cleaned = words.filter((w, i) => i === 0 || !stop.includes(w)).filter((w) => !stop.includes(w));
      if (cleaned.length) return cleaned.join(' ');
    }
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Numbers: hours and money                                                   */
/* -------------------------------------------------------------------------- */

const HOUR_UNITS = '(?:hours?|hrs?|ಗಂಟೆ\\S*|घंटे|घण्टे|घंटा|மணி\\S*|గంట\\S*|മണിക്കൂർ\\S*)';
const DAY_UNITS = '(?:days?|ದಿನ\\S*|दिन|நாள்\\S*|நாட்கள்|రోజు\\S*|ദിവസ\\S*)';
const WEEK_UNITS = '(?:weeks?|ವಾರ\\S*|सप्ताह|हफ्ते|हफ़्ते|வாரம்\\S*|வாரங்கள்|వారం\\S*|ആഴ്ച\\S*)';

function detectHours(text) {
  const t = normalizeText(text);
  const grab = (units, multiplier) => {
    const re = new RegExp(`(\\d+(?:\\.\\d+)?)(?:\\s*(?:-|–|to)\\s*(\\d+(?:\\.\\d+)?))?\\s*${units}`, 'i');
    const m = t.match(re);
    if (!m) return null;
    const a = parseFloat(m[1]);
    const b = m[2] ? parseFloat(m[2]) : a;
    return ((a + b) / 2) * multiplier;
  };
  const hours = grab(HOUR_UNITS, 1)
    ?? grab(DAY_UNITS, 8)
    ?? grab(WEEK_UNITS, 40);
  return hours && hours > 0 ? Math.round(hours * 2) / 2 : null;
}

const CURRENCY_BEFORE = '(?:₹|rs\\.?|inr|rupees?|ರೂ\\.?|ರೂಪಾಯಿ|रु\\.?|रुपये|रुपए|ரூ\\.?|ரூபாய்|రూ\\.?|రూపాయలు|രൂപ)';
const PRICE_WORDS = /price|sell|sale|worth|ಬೆಲೆ|ಮಾರಾಟ|कीमत|मूल्य|बेच|விலை|விற்|ధర|అమ్|വില|വിൽ/i;
const COST_WORDS = /material|clay|cost of|spent|ingredient|ಸಾಮಗ್ರಿ|ಖರ್ಚು|सामग्री|लागत|खर्च|பொருள்|செலவு|పదార్థ|ఖర్చు|വസ്തു|ചെലവ്/i;

function detectMoney(text) {
  const t = normalizeText(text);
  const found = [];
  const patterns = [
    new RegExp(`${CURRENCY_BEFORE}\\s*(\\d[\\d,]*(?:\\.\\d+)?)`, 'gi'),
    new RegExp(`(\\d[\\d,]*(?:\\.\\d+)?)\\s*${CURRENCY_BEFORE}`, 'gi')
  ];
  patterns.forEach((re) => {
    let m;
    while ((m = re.exec(t)) !== null) {
      const value = Number(String(m[1]).replace(/,/g, ''));
      if (value > 0) {
        const around = t.slice(Math.max(0, m.index - 35), m.index + m[0].length + 35);
        found.push({ value, around });
      }
    }
  });

  let price = null;
  let materialCost = null;
  found.forEach(({ value, around }) => {
    if (PRICE_WORDS.test(around) && price === null) price = value;
    else if (COST_WORDS.test(around) && materialCost === null) materialCost = value;
  });
  if (price === null && materialCost === null && found.length === 1) price = found[0].value;
  return { price, materialCost };
}

/* -------------------------------------------------------------------------- */
/* Tags                                                                       */
/* -------------------------------------------------------------------------- */

const BASE_TAGS = {
  en: ['Handmade', 'GI Tagged', 'Fair Trade', 'Heritage Craft'],
  kn: ['ಕೈಯಿಂದ ಮಾಡಿದ', 'ಜಿಐ ಟ್ಯಾಗ್', 'ನ್ಯಾಯಯುತ ವ್ಯಾಪಾರ', 'ಪಾರಂಪರಿಕ ಕಲೆ'],
  hi: ['हस्तनिर्मित', 'जीआई टैग', 'फेयर ट्रेड', 'विरासत शिल्प'],
  ta: ['கைவினை', 'ஜிஐ குறியீடு', 'நியாயமான வர்த்தகம்', 'பாரம்பரிய கலை'],
  te: ['చేతితో చేసిన', 'జిఐ ట్యాగ్', 'ఫెయిర్ ట్రేడ్', 'వారసత్వ కళ'],
  ml: ['കൈകൊണ്ട് നിർമ്മിച്ച', 'ജിഐ ടാഗ്', 'ഫെയർ ട്രേഡ്', 'പൈതൃക കല']
};

/* -------------------------------------------------------------------------- */
/* Main entry point                                                           */
/* -------------------------------------------------------------------------- */

export const MIN_STORY_LENGTH = 20;

export function computeFairPrice({ materialCost = 0, hours = 0, wage = 150, packaging = 0 }) {
  const labour = hours * wage;
  const total = materialCost + labour + packaging;
  const margin = Math.round(total * 0.3);
  return Math.round(total + margin);
}

/**
 * @param {string} story  the artisan's description (any supported language)
 * @param {object} opts   { lang, t, wage, packaging }
 * @returns {{ fields: object, estimated: string[], count: number }}
 *   fields may contain: category, title, region, materials, tags, artisanName,
 *   laborHours, materialCost, price   (only the ones that could be worked out)
 */
export function analyzeStory(story, opts = {}) {
  const lang = LANGS.includes(opts.lang) ? opts.lang : 'en';
  const t = opts.t || {};
  const wage = Number(opts.wage) || 150;
  const packaging = Number(opts.packaging) || 0;

  const original = String(story || '').trim();
  const empty = { fields: {}, estimated: [], count: 0 };
  if (original.length < MIN_STORY_LENGTH) return empty;

  const normalized = normalizeText(original);
  const lower = normalized.toLowerCase();

  const masked = maskPlaces(lower);
  const product = detectProduct(masked);
  let categoryKey = detectCategoryKey(original);
  if (!categoryKey && product?.category) categoryKey = product.category;
  // Saree etc. should win when the story never mentions the craft word itself.
  if (product?.category && product.category !== 'other' && categoryKey !== product.category && !categoryKey) {
    categoryKey = product.category;
  }

  const place = detectPlace(normalized, lower, lang);
  const materials = detectMaterials(masked);
  const artisanName = detectArtisanName(original);
  const hoursFound = detectHours(original);
  const money = detectMoney(original);

  const fields = {};
  const estimated = [];

  // Category
  if (categoryKey) {
    const label = t.catalogForm?.categories?.[categoryKey] || categoryKey;
    fields.category = label;
  }

  // Title
  const noun = product
    ? pick(product.name, lang)
    : (categoryKey ? pick(CATEGORY_NOUN[categoryKey], lang) : null);
  if (noun) {
    fields.title = place ? `${place.short} ${noun}` : noun;
  }

  // Region
  if (place) fields.region = place.text;

  // Artisan name
  if (artisanName) fields.artisanName = artisanName;

  // Materials
  const defaults = CATEGORY_DEFAULTS[categoryKey || 'other'];
  let materialList = materials;
  if (!materialList.length && categoryKey) {
    materialList = defaults.materials
      .map((id) => MATERIALS.find((m) => m.id === id))
      .filter(Boolean);
    if (materialList.length) estimated.push('materials');
  }
  if (materialList.length) {
    fields.materials = materialList.map((m) => pick(m.name, lang)).join(', ');
  }

  // Hours & cost (estimated unless the story says so)
  const hours = hoursFound ?? (categoryKey ? defaults.hours : null);
  if (hours !== null) {
    fields.laborHours = String(hours);
    if (hoursFound === null) estimated.push('laborHours');
  }

  const materialCost = money.materialCost ?? (categoryKey ? defaults.materialCost : null);
  if (materialCost !== null) {
    fields.materialCost = String(materialCost);
    if (money.materialCost === null) estimated.push('materialCost');
  }

  // Price: the one in the story, otherwise the fair-trade price from the calculator
  if (money.price) {
    fields.price = String(Math.round(money.price));
  } else if (hours !== null && materialCost !== null) {
    const fair = computeFairPrice({ materialCost, hours, wage, packaging });
    if (fair > 0) {
      fields.price = String(fair);
      estimated.push('price');
    }
  }

  // Tags
  const tagSet = [];
  const push = (v) => {
    const clean = String(v || '').trim();
    if (clean && !tagSet.some((x) => x.toLowerCase() === clean.toLowerCase())) tagSet.push(clean);
  };
  if (fields.category) push(fields.category);
  if (place) push(place.short);
  materialList.slice(0, 3).forEach((m) => push(pick(m.name, lang)));
  pick(BASE_TAGS, lang).forEach(push);
  if (tagSet.length) fields.tags = tagSet.slice(0, 8).join(', ');

  return { fields, estimated, count: Object.keys(fields).length };
}
