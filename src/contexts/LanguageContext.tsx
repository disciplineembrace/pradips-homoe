'use client';
/**
 * Language Context — Multilingual support (English / Gujarati / Hindi)
 * 
 * - Stores selected language in localStorage
 * - Provides t() function for UI string translation
 * - Does NOT modify remedy names, Latin names, author names, or OCR data
 * - Only translates UI elements (labels, buttons, headings, navigation)
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Language = 'en' | 'gu' | 'hi';

type LanguageContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    // Load saved language from localStorage
    const saved = localStorage.getItem('ph_lang') as Language;
    if (saved && ['en', 'gu', 'hi'].includes(saved)) {
      setLangState(saved);
    }
  }, []);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('ph_lang', newLang);
  }, []);

  const t = useCallback((key: string) => {
    return translate(key, lang);
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

// Translation function — loads from dictionaries
import { en } from '@/lib/translations/en';
import { gu } from '@/lib/translations/gu';
import { hi } from '@/lib/translations/hi';

const dictionaries: Record<Language, Record<string, string>> = {
  en,
  gu,
  hi,
};

function translate(key: string, lang: Language): string {
  const dict = dictionaries[lang] || dictionaries.en;
  return dict[key] || dictionaries.en[key] || key;
}
