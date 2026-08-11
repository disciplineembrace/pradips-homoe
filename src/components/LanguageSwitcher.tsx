'use client';
/**
 * Language Switcher — compact dropdown for language selection
 * 
 * Supports: English, Gujarati (ગુજરાતી), Hindi (हिन्दी)
 * - Instant switch (no page reload)
 * - Remembers selection (localStorage)
 * - Compact design that fits in Navbar
 */
import { useState, useRef, useEffect } from 'react';
import { useLanguage, Language } from '@/contexts/LanguageContext';

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'gu', label: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
];

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const current = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded transition-colors text-stone-200 hover:bg-[#2a5443] hover:text-[#C8A24A] whitespace-nowrap"
        title="Select Language"
      >
        <span className="text-sm">{current.flag}</span>
        <span className="hidden sm:inline">{current.label}</span>
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {open && (
        <div className="absolute right-0 mt-1 w-40 bg-[#173B2D] border border-[#C8A24A]/40 rounded-lg shadow-lg overflow-hidden z-50">
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${
                lang === l.code
                  ? 'bg-[#C8A24A]/20 text-[#C8A24A]'
                  : 'text-stone-200 hover:bg-[#2a5443]'
              }`}
            >
              <span className="text-sm">{l.flag}</span>
              <span>{l.label}</span>
              {lang === l.code && (
                <svg className="w-3 h-3 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
