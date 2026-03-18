import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '../api';

interface SiteSettings {
  library_name?: string;
  library_tagline?: string;
  library_email?: string;
  library_phone?: string;
  library_address?: string;
  library_city?: string;
  library_logo_url?: string;
  theme_primary_colour?: string;
}

interface SettingsContextType {
  settings: SiteSettings;
  loading: boolean;
  refresh: () => void;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: {},
  loading: true,
  refresh: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/settings/public')
      .then(res => setSettings(res.data))
      .catch(() => setSettings({}))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Apply theme colour as CSS variable whenever settings change
  useEffect(() => {
  if (settings.theme_primary_colour) {
    const hex = settings.theme_primary_colour;
    document.documentElement.style.setProperty('--purple-deep', hex);

    // Derive a lighter mid tone by reducing opacity
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    // Mid tone — slightly lighter
    const midR = Math.min(255, r + 40);
    const midG = Math.min(255, g + 30);
    const midB = Math.min(255, b + 50);
    const mid = `#${midR.toString(16).padStart(2,'0')}${midG.toString(16).padStart(2,'0')}${midB.toString(16).padStart(2,'0')}`;
    document.documentElement.style.setProperty('--purple-mid', mid);

    // Light tone for badges and accents
    const lightR = Math.min(255, r + 100);
    const lightG = Math.min(255, g + 90);
    const lightB = Math.min(255, b + 120);
    const light = `#${lightR.toString(16).padStart(2,'0')}${lightG.toString(16).padStart(2,'0')}${lightB.toString(16).padStart(2,'0')}`;
    document.documentElement.style.setProperty('--purple-light', light);
  }
  if (settings.library_name) {
    document.title = settings.library_name;
  }
}, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, loading, refresh: load }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
