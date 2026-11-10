import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Mic, Sparkles, MessageCircle } from 'lucide-react';
import { useLanguage } from '../i18n/index.js';
import { useVoiceInput } from '../hooks/useVoiceInput.js';
import { api } from '../services/api.js';

const QUICK_PROMPTS = [
  {
    en: 'How should I price my handcrafted terracotta horse for international buyers?',
    hi: 'विदेशी खरीदारों के लिए मुझे मिट्टी के घोड़े की क्या कीमत रखनी चाहिए?',
    kn: 'ಅಂತರಾಷ್ಟ್ರೀಯ ಖರೀದಿದಾರರಿಗೆ ಬೆಲೆ ಹೇಗೆ ನಿರ್ಧರಿಸುವುದು?',
    ta: 'வெளிநாட்டு வாங்குபவர்களுக்கு விலையை எவ்வாறு நிர்ணயிப்பது?',
    bn: 'আন্তর্জাতিক ক্রেতাদের জন্য মৃৎশিল্পের দাম কীভাবে নির্ধারণ করব?'
  },
  {
    en: 'What are the best packaging materials for shipping fragile ceramic pottery?',
    hi: 'नाजुक मिट्टी और सिरेमिक कलाकृतियों की सुरक्षित पैकेजिंग कैसे करें?',
    kn: 'ಮಣ್ಣಿನ ಪಾತ್ರೆಗಳನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಪ್ಯಾಕ್ ಮಾಡುವುದು ಹೇಗೆ?',
    ta: 'மண்பாண்டங்களை பாதுகாப்பாக பேக்கிங் செய்வது எப்படி?',
    bn: 'ভঙ্গুর মাটির জিনিসপত্র কীভাবে নিরাপদে প্যাকেজিং করব?'
  },
  {
    en: 'How does the GI (Geographical Indication) tag protect my regional craft?',
    hi: 'जीआई (GI Tag) मेरे पारंपरिक शिल्प और पहचान की रक्षा कैसे करता है?',
    kn: 'GI ಟ್ಯಾಗ್‌ನ ಪ್ರಯೋಜನಗಳೇನು?',
    ta: 'GI குறிச்சொல்லின் நன்மைகள் என்ன?',
    bn: 'জিআই (GI) ট্যাগ কীভাবে আমাদের শিল্পের সুরক্ষা দেয়?'
  }
];

export default function Assistant() {
  const { lang } = useLanguage();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Namaste! I am your KalaSetu AI Craft Advisor. Ask me anything about fair pricing, export standards, artisan subsidies, packaging fragile items, or writing descriptions in your mother tongue.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const { isListening, toggleListening } = useVoiceInput({
    currentLang: lang,
    onResult: (text) => setInput(text)
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (messageText) => {
    const textToSend = messageText || input;
    if (!textToSend.trim()) return;

    const userMessage = { role: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await api.askAssistant(textToSend, lang);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: res.reply || 'Craft advisory insight generated.' }
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'I am here to guide you. For high-demand heritage craft, keeping transparent breakdown of raw clay, firing hours, and artisan skill ensures higher value for your family.'
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Multilingual Craft Advisor AI</h1>
          <p className="page-subtitle">
            Instant craft advisory in your language: fair trade pricing, packaging tips, export standards, and government schemes.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Quick prompt suggestions */}
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {QUICK_PROMPTS.map((item, idx) => {
            const promptText = item[lang] || item.en;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(promptText)}
                style={{
                  background: 'white',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'var(--transition)'
                }}
              >
                <Sparkles size={12} color="var(--accent-gold)" />
                <span>{promptText}</span>
              </button>
            );
          })}
        </div>

        {/* Chat Window */}
        <div className="chat-window">
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`message-bubble ${
                  msg.role === 'user' ? 'message-user' : 'message-ai'
                }`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem', fontSize: '0.78rem', opacity: 0.85 }}>
                  {msg.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
                  <span>{msg.role === 'assistant' ? 'KalaSetu Advisor' : 'You'}</span>
                </div>
                <div>{msg.text}</div>
              </div>
            ))}

            {isTyping && (
              <div className="message-bubble message-ai" style={{ width: 'fit-content' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Advisor is analyzing your craft question...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat input bar with voice input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="chat-input-bar"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question or click the mic to speak..."
              className="form-input"
              style={{ flex: 1 }}
            />

            <button
              type="button"
              className={`voice-btn ${isListening ? 'listening' : ''}`}
              onClick={toggleListening}
              title="Speak in your language"
            >
              <Mic size={18} />
            </button>

            <button type="submit" className="btn btn-primary btn-icon">
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
