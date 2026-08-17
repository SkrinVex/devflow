import React, { createContext, useContext, useState } from 'react';
import type { Language, Translations } from '../lib/i18n';
import { translations } from '../lib/i18n';

interface LanguageContextType {
  lang: Language;
  t: Translations;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('devflow_lang') as Language;
    if (saved === 'ru' || saved === 'en') return saved;
    if (typeof navigator !== 'undefined' && navigator.language) {
      if (navigator.language.toLowerCase().startsWith('ru')) {
        return 'ru';
      }
    }
    return 'en';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('devflow_lang', newLang);
  };

  const toggleLang = () => {
    setLang(lang === 'ru' ? 'en' : 'ru');
  };

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang], setLang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useI18n = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useI18n must be used within a LanguageProvider');
  }
  return context;
};
