
import { askGemini } from './gemini.js';

const languages = {
  en: 'English',
  kn: 'Kannada',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  ml: 'Malayalam'
};

export async function handleAdvisorChat({
  message,
  language = 'en'
}) {
  if (!message || !message.trim()) {
    throw new Error('Please enter a message');
  }

  const targetLanguage = languages[language] || 'English';

  const prompt = `
You are KalaSetu's friendly Craft Advisor.

You help Indian artisans with:
- Product descriptions and catalog creation
- Fair pricing methods
- Craft photography
- Packaging and selling
- Marketing and finding buyers
- Export preparation
- General traditional craft questions

USER QUESTION:
${message}

INSTRUCTIONS:
1. Understand the user's language.
2. Answer in ${targetLanguage}.
3. Use simple, practical language.
4. Be friendly and respectful.
5. Do not invent government schemes, certifications, market prices or legal requirements.
6. If you are unsure, clearly say so.
7. Give useful steps instead of generic greetings.
8. Keep the answer reasonably short.

Return only the answer text.
`;

  const reply = await askGemini(prompt);

  return { reply };
}
