import { useState, useEffect, useRef, useCallback } from 'react';

export const VOICE_LANGUAGES = [
  { code: 'en', bcp47: 'en-IN', name: 'English (India)', native: 'English' },
  { code: 'kn', bcp47: 'kn-IN', name: 'ಕನ್ನಡ (Kannada)', native: 'ಕನ್ನಡ' },
  { code: 'hi', bcp47: 'hi-IN', name: 'हिन्दी (Hindi)', native: 'हिन्दी' },
  { code: 'ta', bcp47: 'ta-IN', name: 'தமிழ் (Tamil)', native: 'தமிழ்' },
  { code: 'te', bcp47: 'te-IN', name: 'తెలుగు (Telugu)', native: 'తెలుగు' },
  { code: 'ml', bcp47: 'ml-IN', name: 'മലയാളം (Malayalam)', native: 'മലയാളം' }
];

export const langMap = {
  en: 'en-IN',
  'en-IN': 'en-IN',
  kn: 'kn-IN',
  'kn-IN': 'kn-IN',
  hi: 'hi-IN',
  'hi-IN': 'hi-IN',
  ta: 'ta-IN',
  'ta-IN': 'ta-IN',
  te: 'te-IN',
  'te-IN': 'te-IN',
  ml: 'ml-IN',
  'ml-IN': 'ml-IN'
};

export function useVoiceInput({ onResult, currentLang = 'en' } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');

  const recognitionRef = useRef(null);
  const callbackRef = useRef(onResult);
  const listeningRef = useRef(false);
  const currentLangRef = useRef(currentLang);

  useEffect(() => {
    callbackRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    currentLangRef.current = currentLang;
  }, [currentLang]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Speech recognition is unavailable in this browser. Please use Chrome or Edge for voice input.');
      return;
    }

    setIsSupported(true);
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      listeningRef.current = true;
      setIsListening(true);
      setError('');
    };

    recognition.onresult = (event) => {
      let sessionText = '';
      for (let i = 0; i < event.results.length; i++) {
        sessionText += event.results[i][0].transcript;
      }

      setTranscript(sessionText);
      callbackRef.current?.(sessionText);
    };

    recognition.onerror = (event) => {
      const errorMap = {
        'not-allowed': 'Microphone permission was denied. Please allow microphone access in your browser settings.',
        'service-not-allowed': 'Speech recognition service is currently unavailable in this browser.',
        'no-speech': 'No speech was detected. Please try speaking closer to your microphone.',
        'audio-capture': 'No microphone found. Please connect an audio input device.',
        'network': 'Network error contacting speech service. Please check your internet connection.',
        'language-not-supported': 'The selected language speech model is not installed on this browser engine.'
      };

      if (event.error === 'no-speech') {
        return;
      }

      setError(errorMap[event.error] || `Voice error: ${event.error}`);
      listeningRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      listeningRef.current = false;
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      listeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  const startListening = useCallback((language) => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    // If already running, abort and re-start with new language
    if (listeningRef.current) {
      try {
        recognition.abort();
      } catch {
        // ignore
      }
    }

    const langToUse = language || currentLangRef.current || 'en';
    recognition.lang = langMap[langToUse] || 'en-IN';

    setError('');
    setTranscript('');

    try {
      recognition.start();
    } catch (err) {
      console.warn('Recognition start caught error:', err);
      try {
        recognition.stop();
        setTimeout(() => {
          try {
            recognition.start();
          } catch (innerErr) {
            setError('Could not start microphone. Please try again.');
          }
        }, 150);
      } catch (retryErr) {
        setError('Could not start microphone. Please try again.');
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && listeningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    listeningRef.current = false;
    setIsListening(false);
  }, []);

  const toggleListening = useCallback((language) => {
    if (listeningRef.current) {
      stopListening();
    } else {
      startListening(language);
    }
  }, [startListening, stopListening]);

  return {
    isListening,
    isSupported,
    transcript,
    error,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript: () => setTranscript('')
  };
}
