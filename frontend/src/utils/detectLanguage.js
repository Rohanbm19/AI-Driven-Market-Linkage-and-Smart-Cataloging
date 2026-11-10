export function detectLanguage(text) {
  if (!text || !text.trim()) return 'en';

  const scripts = [
    { code: 'kn', regex: /[\u0C80-\u0CFF]/ },
    { code: 'hi', regex: /[\u0900-\u097F]/ },
    { code: 'ta', regex: /[\u0B80-\u0BFF]/ },
    { code: 'te', regex: /[\u0C00-\u0C7F]/ },
    { code: 'ml', regex: /[\u0D00-\u0D7F]/ },
    { code: 'bn', regex: /[\u0980-\u09FF]/ }
  ];

  for (const script of scripts) {
    if (script.regex.test(text)) {
      return script.code;
    }
  }

  return 'en';
}
