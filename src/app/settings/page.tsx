'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useReaderFeatures } from '@/hooks/use-reader-features';

const SETTINGS_KEY = 'ph_settings';

type Settings = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  readerWidth: 'narrow' | 'medium' | 'wide';
  brightness: number; // 50 - 100
  darkMode: boolean;
  theme: 'forest' | 'sepia' | 'classic' | 'midnight';
  language: string;
};

const DEFAULT_SETTINGS: Settings = {
  fontFamily: 'serif',
  fontSize: 16,
  lineHeight: 1.6,
  readerWidth: 'medium',
  brightness: 100,
  darkMode: false,
  theme: 'forest',
  language: 'en',
};

const FONT_OPTIONS = [
  { value: 'serif', label: 'Serif (Georgia)' },
  { value: 'sans', label: 'Sans (Inter)' },
  { value: 'mono', label: 'Mono (Menlo)' },
];
const WIDTH_OPTIONS = [
  { value: 'narrow', label: 'Narrow (640px)' },
  { value: 'medium', label: 'Medium (768px)' },
  { value: 'wide', label: 'Wide (1024px)' },
];
const THEME_OPTIONS = [
  { value: 'forest', label: 'Forest Green & Gold' },
  { value: 'sepia', label: 'Sepia Parchment' },
  { value: 'classic', label: 'Classic Ivory' },
  { value: 'midnight', label: 'Midnight Scholar' },
];
const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी (Hindi)' },
  { value: 'es', label: 'Español (Spanish)' },
  { value: 'de', label: 'Deutsch (German)' },
  { value: 'fr', label: 'Français (French)' },
];

function loadSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(s: Settings) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

function download(filename: string, content: string) {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function SettingsPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState('');
  const reader = useReaderFeatures();

  // Auth check
  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) { router.push('/login'); return; }
        setSession(d);
      })
      .catch(() => router.push('/login'));
  }, [router]);

  // Load settings after mount
  useEffect(() => {
    setSettings(loadSettings());
    setHydrated(true);
  }, []);

  // Persist settings on change
  useEffect(() => {
    if (hydrated) saveSettings(settings);
  }, [settings, hydrated]);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings(s => ({ ...s, [key]: value }));
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  function exportBookmarks() {
    download('ph_bookmarks.json', JSON.stringify(reader.bookmarks, null, 2));
    showToast('Bookmarks exported');
  }
  function exportFavorites() {
    download('ph_favorites.json', JSON.stringify(reader.favorites, null, 2));
    showToast('Favorites exported');
  }
  function exportNotes() {
    download('ph_notes.json', JSON.stringify(reader.notes, null, 2));
    showToast('Notes exported');
  }
  function clearCache() {
    if (typeof window === 'undefined') return;
    // Only clear non-auth, non-settings localStorage keys
    const preserve = new Set([SETTINGS_KEY, 'ph_reader_settings']);
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && !preserve.has(k) && k.startsWith('ph_')) keys.push(k);
    }
    keys.forEach(k => window.localStorage.removeItem(k));
    showToast(`Cleared ${keys.length} cache entries`);
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-[#7C8F6E]">Loading Settings...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const fontFamilyClass = settings.fontFamily === 'serif' ? 'font-serif' : settings.fontFamily === 'mono' ? 'font-mono' : 'font-sans';

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-6 w-full">
        {/* Page header */}
        <header className="mb-6">
          <h1 className="font-serif text-3xl text-[#173B2D]">Settings</h1>
          <p className="text-xs uppercase tracking-widest text-[#7C8F6E] mt-1">Customise your reading experience — all preferences saved locally</p>
          <div className="w-16 h-0.5 bg-[#C8A24A] mt-3"></div>
        </header>

        {toast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#173B2D] text-[#F5EFE0] px-4 py-2 rounded-lg shadow-lg text-sm">
            {toast}
          </div>
        )}

        {/* Appearance */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-serif text-xl text-[#173B2D] mb-1">Appearance</h2>
          <p className="text-xs text-[#7C8F6E] mb-5">Font, layout, and theme preferences</p>

          <div className="space-y-5">
            {/* Font family */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C8F6E] mb-2">Font Family</label>
              <select
                value={settings.fontFamily}
                onChange={e => update('fontFamily', e.target.value)}
                className="w-full px-3 py-2 border border-[#E8DCC3] rounded-lg text-sm text-[#173B2D] bg-white focus:outline-none focus:border-[#173B2D]"
              >
                {FONT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Font size */}
            <div>
              <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#7C8F6E] mb-2">
                <span>Font Size</span>
                <span className="text-[#173B2D]">{settings.fontSize}px</span>
              </label>
              <input
                type="range"
                min={12}
                max={24}
                value={settings.fontSize}
                onChange={e => update('fontSize', Number(e.target.value))}
                className="w-full accent-[#173B2D]"
              />
            </div>

            {/* Line height */}
            <div>
              <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#7C8F6E] mb-2">
                <span>Line Height</span>
                <span className="text-[#173B2D]">{settings.lineHeight.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min={1.2}
                max={2.0}
                step={0.05}
                value={settings.lineHeight}
                onChange={e => update('lineHeight', Number(e.target.value))}
                className="w-full accent-[#173B2D]"
              />
            </div>

            {/* Reader width */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C8F6E] mb-2">Reader Width</label>
              <div className="grid grid-cols-3 gap-2">
                {WIDTH_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    onClick={() => update('readerWidth', o.value as Settings['readerWidth'])}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                      settings.readerWidth === o.value
                        ? 'bg-[#173B2D] text-[#F5EFE0] border-[#173B2D]'
                        : 'bg-white text-[#7C8F6E] border-[#E8DCC3] hover:bg-[#F5EFE0]'
                    }`}
                  >{o.label}</button>
                ))}
              </div>
            </div>

            {/* Brightness */}
            <div>
              <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#7C8F6E] mb-2">
                <span>Brightness</span>
                <span className="text-[#173B2D]">{settings.brightness}%</span>
              </label>
              <input
                type="range"
                min={50}
                max={100}
                value={settings.brightness}
                onChange={e => update('brightness', Number(e.target.value))}
                className="w-full accent-[#173B2D]"
              />
            </div>

            {/* Dark mode */}
            <div className="flex items-center justify-between border border-[#E8DCC3] rounded-lg p-3">
              <div>
                <div className="text-sm font-semibold text-[#173B2D]">Dark Mode</div>
                <div className="text-xs text-[#7C8F6E]">Use dark backgrounds throughout the site</div>
              </div>
              <input
                type="checkbox"
                checked={settings.darkMode}
                onChange={e => update('darkMode', e.target.checked)}
                className="w-5 h-5 accent-[#173B2D] cursor-pointer"
              />
            </div>

            {/* Theme select */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C8F6E] mb-2">Theme</label>
              <select
                value={settings.theme}
                onChange={e => update('theme', e.target.value as Settings['theme'])}
                className="w-full px-3 py-2 border border-[#E8DCC3] rounded-lg text-sm text-[#173B2D] bg-white focus:outline-none focus:border-[#173B2D]"
              >
                {THEME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Language select */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C8F6E] mb-2">Language</label>
              <select
                value={settings.language}
                onChange={e => update('language', e.target.value)}
                className="w-full px-3 py-2 border border-[#E8DCC3] rounded-lg text-sm text-[#173B2D] bg-white focus:outline-none focus:border-[#173B2D]"
              >
                {LANGUAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-6 pt-4 border-t border-[#E8DCC3]">
            <div className="text-[0.65rem] uppercase tracking-widest text-[#7C8F6E] mb-2">Preview</div>
            <div
              className="bg-[#F5EFE0] rounded-lg p-4 border border-[#E8DCC3]"
              style={{ filter: `brightness(${settings.brightness}%)` }}
            >
              <p
                className={`text-[#173B2D] ${fontFamilyClass}`}
                style={{ fontSize: `${settings.fontSize}px`, lineHeight: settings.lineHeight }}
              >
                The physician&apos;s high and only mission is to restore the sick to health, to cure, as it is termed.
                The highest ideal of cure is rapid, gentle and permanent restoration of the health.
              </p>
            </div>
          </div>
        </section>

        {/* Data management */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-serif text-xl text-[#173B2D] mb-1">Data Management</h2>
          <p className="text-xs text-[#7C8F6E] mb-5">Export your data or clear the browser cache</p>

          <div className="space-y-3">
            <button
              onClick={exportBookmarks}
              className="w-full flex items-center justify-between px-4 py-3 border border-[#E8DCC3] rounded-lg hover:bg-[#F5EFE0] transition-colors text-left"
            >
              <div>
                <div className="text-sm font-semibold text-[#173B2D]">Export Bookmarks</div>
                <div className="text-xs text-[#7C8F6E]">{reader.bookmarks.length} bookmark{reader.bookmarks.length !== 1 ? 's' : ''} saved locally</div>
              </div>
              <span className="text-[#C8A24A] font-semibold text-sm">Download →</span>
            </button>

            <button
              onClick={exportFavorites}
              className="w-full flex items-center justify-between px-4 py-3 border border-[#E8DCC3] rounded-lg hover:bg-[#F5EFE0] transition-colors text-left"
            >
              <div>
                <div className="text-sm font-semibold text-[#173B2D]">Export Favorites</div>
                <div className="text-xs text-[#7C8F6E]">{reader.favorites.length} favorite{reader.favorites.length !== 1 ? 's' : ''} saved locally</div>
              </div>
              <span className="text-[#C8A24A] font-semibold text-sm">Download →</span>
            </button>

            <button
              onClick={exportNotes}
              className="w-full flex items-center justify-between px-4 py-3 border border-[#E8DCC3] rounded-lg hover:bg-[#F5EFE0] transition-colors text-left"
            >
              <div>
                <div className="text-sm font-semibold text-[#173B2D]">Export Notes</div>
                <div className="text-xs text-[#7C8F6E]">{reader.notes.length} note{reader.notes.length !== 1 ? 's' : ''} saved locally</div>
              </div>
              <span className="text-[#C8A24A] font-semibold text-sm">Download →</span>
            </button>

            <button
              onClick={clearCache}
              className="w-full flex items-center justify-between px-4 py-3 border border-[#6E2A3A]/30 bg-[#6E2A3A]/5 rounded-lg hover:bg-[#6E2A3A]/10 transition-colors text-left"
            >
              <div>
                <div className="text-sm font-semibold text-[#6E2A3A]">Clear Cache</div>
                <div className="text-xs text-[#7C8F6E]">Remove history, highlights, and other local data (preserves settings)</div>
              </div>
              <span className="text-[#6E2A3A] font-semibold text-sm">Clear →</span>
            </button>
          </div>
        </section>

        <p className="text-center text-xs text-[#7C8F6E]">
          All settings stored in <code className="text-[#173B2D] bg-[#F5EFE0] px-1.5 py-0.5 rounded">localStorage</code> under key <code className="text-[#173B2D] bg-[#F5EFE0] px-1.5 py-0.5 rounded">ph_settings</code>
        </p>
      </main>
      <Footer />
    </div>
  );
}
