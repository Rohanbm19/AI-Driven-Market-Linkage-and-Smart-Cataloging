import React, { useEffect, useRef, useState } from 'react';
import { Send, Bot, User, Mic, Sparkles } from 'lucide-react';
import { useLanguage } from '../i18n/index.jsx';
import { useVoiceInput } from '../hooks/useVoiceInput.js';
import { api } from '../services/api.js';

export default function Assistant() {
  const { lang, t } = useLanguage();
  const text = t.assistant || {};
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMessages((current) => {
      if (current.length === 0 || (current.length === 1 && current[0].role === 'assistant')) {
        return [{ role: 'assistant', text: text.welcome }];
      }
      return current;
    });
  }, [lang, text.welcome]);

  const { isListening, toggleListening } = useVoiceInput({ currentLang: lang, onResult: setInput });
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  const handleSend = async (messageText) => {
    const textToSend = (messageText ?? input).trim();
    if (!textToSend || isTyping) return;
    setMessages((prev) => [...prev, { role: 'user', text: textToSend }]);
    setInput('');
    setIsTyping(true);
    try {
      const response = await api.askAssistant(textToSend, lang);
      setMessages((prev) => [...prev, { role: 'assistant', text: response?.reply || text.fallback }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', text: text.error }]);
    } finally {
      setIsTyping(false);
    }
  };

  return <div>
    <div className="page-header"><div><h1 className="page-title">{text.title}</h1><p className="page-subtitle">{text.desc}</p></div></div>
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="assistant-prompts">
        {(text.prompts || []).map((prompt, index) => <button key={index} type="button" className="assistant-prompt" onClick={() => handleSend(prompt)}><Sparkles size={12} color="var(--accent-gold)" /><span>{prompt}</span></button>)}
      </div>
      <div className="card assistant-chat-panel" style={{ minHeight: '420px', display: 'flex', flexDirection: 'column', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}><Bot size={20} color="var(--primary)" /><strong>{text.label}</strong></div>
        <div style={{ flex: 1, padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.9rem', maxHeight: '420px', overflowY: 'auto' }}>
          {messages.map((message, index) => <div key={index} style={{ display: 'flex', justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start', gap: '0.5rem' }}>
            {message.role === 'assistant' && <Bot size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: 5 }} />}
            <div className={`assistant-message-bubble ${message.role === 'user' ? 'assistant-message-user' : 'assistant-message-response'}`}>{message.text}</div>
            {message.role === 'user' && <User size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: 5 }} />}
          </div>)}
          {isTyping && <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{text.typing}</div>}
          <div ref={messagesEndRef} />
        </div>
        <form className="assistant-composer" onSubmit={(event) => { event.preventDefault(); handleSend(); }}>
          <input value={input} onChange={(event) => setInput(event.target.value)} placeholder={text.placeholder} className="form-input assistant-input" />
          <button type="button" className={`btn btn-secondary ${isListening ? 'listening' : ''}`} onClick={toggleListening} title={text.speak}><Mic size={18} /></button>
          <button type="submit" className="btn btn-primary" disabled={!input.trim() || isTyping}><Send size={17} /><span>{text.send}</span></button>
        </form>
      </div>
    </div>
  </div>;
}

