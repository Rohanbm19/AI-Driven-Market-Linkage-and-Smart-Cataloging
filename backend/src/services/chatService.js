export function handleAdvisorChat({ message, language = 'en' }) {
  const query = (message || '').toLowerCase();

  // Knowledge base responses tailored for Indian traditional artisans
  if (query.includes('price') || query.includes('pricing') || query.includes('cost') || query.includes('दाम') || query.includes('ಬೆಲೆ')) {
    return {
      reply: 'To calculate a fair price, combine your Raw Material Cost + (Crafting Hours × ₹150/hr dignified skilled wage) + Packaging + 30% Artisan Profit Margin. Never sell below your production cost!'
    };
  }

  if (query.includes('export') || query.includes('buyer') || query.includes('abroad') || query.includes('विदेश') || query.includes('ವಿದೇಶ')) {
    return {
      reply: 'For export markets (EU, USA, UK), ensure products have non-toxic natural finishes (like EN71 certified shellac for toys), clean barcode/hangtags, and robust packaging to survive international transit.'
    };
  }

  if (query.includes('photo') || query.includes('picture') || query.includes('image') || query.includes('तस्वीर') || query.includes('ಚಿತ್ರ')) {
    return {
      reply: 'Great craft photos need soft daylight! Place your craft near a window on a clean, solid background. You can also use KalaSetu’s AI Image Studio Enhancer to generate clean e-commerce studio lighting.'
    };
  }

  if (query.includes('gi') || query.includes('geographical') || query.includes('tag')) {
    return {
      reply: 'GI (Geographical Indication) tags protect your ancestral cluster from imitation! KalaSetu automatically highlights certified GI crafts like Bankura Terracotta, Channapatna Toys, and Kanjivaram Silk with verified badges.'
    };
  }

  const multilingualGreetings = {
    hi: 'नमस्ते! मैं कलासेतु का शिल्प सलाहकार हूँ। मैं आपकी शिल्प की कीमत तय करने, विवरण लिखने या बाजार ढूंढने में कैसे मदद कर सकता हूँ?',
    kn: 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಕಲಾ ಸೇತು ಕರಕುಶಲ ಸಲಹೆಗಾರ. ಬೆಲೆ ನಿರ್ಧಾರ, ಕರಕುಶಲ ವಿವರಣೆ ಅಥವಾ ಮಾರುಕಟ್ಟೆ ಮಾಹಿತಿಯಲ್ಲಿ ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
    ta: 'வணக்கம்! நான் உங்கள் கலாசேது கைவினை ஆலோசகர். உங்கள் தயாரிப்பு விலை, கைவினை குறிப்புகள் அல்லது ஏற்றுமதி தகவல்களுக்கு நான் உதவலாமா?',
    te: 'నమస్కారం! నేను మీ కళాసేతు హస్తకళల సలహాదారుని. మీకు సరసమైన ధర నిర్ణయం మరియు మార్కెట్ సమాచారంలో ఎలా సహాయపడగలను?',
    ml: 'നമസ്കാരം! ഞാൻ കലാസേതു കരകൗശല ഉപദേശകനാണ്. ന്യായവില നിർണ്ണയത്തിലും വിപണി വിവരങ്ങളിലും ഞാൻ എങ്ങനെ സഹായിക്കണം?',
    en: 'Namaste! I am your KalaSetu Artisan Advisor. How can I assist with your craft pricing, multilingual descriptions, or buyer inquiries today?'
  };

  return {
    reply: multilingualGreetings[language] || multilingualGreetings.en
  };
}
