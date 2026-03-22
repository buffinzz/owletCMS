import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from "../../api";

interface SiteSettings {
  library_name?: string;
  library_tagline?: string;
  library_email?: string;
  library_phone?: string;
  library_address?: string;
  library_city?: string;
  library_logo_url?: string;
  library_logo_alt?: string;
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

    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    // Mid tone — slightly lighter
    const midR = Math.min(255, r + 40);
    const midG = Math.min(255, g + 30);
    const midB = Math.min(255, b + 50);
    const mid = `#${midR.toString(16).padStart(2,'0')}${midG.toString(16).padStart(2,'0')}${midB.toString(16).padStart(2,'0')}`;
    document.documentElement.style.setProperty('--purple-mid', mid);

    // Convert to HSL — must happen BEFORE using h, s, l
    const toHsl = (r: number, g: number, b: number) => {
      const rn = r / 255, gn = g / 255, bn = b / 255;
      const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
      let h = 0, s = 0;
      const l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break;
          case gn: h = ((bn - rn) / d + 2) / 6; break;
          case bn: h = ((rn - gn) / d + 4) / 6; break;
        }
      }
      return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
    };

    const [h, s, l] = toHsl(r, g, b);

    // Light tone — always readable on dark backgrounds
    const lightL = Math.max(75, Math.min(l + 45, 88));
    document.documentElement.style.setProperty('--purple-light', `hsl(${h}, ${Math.max(s - 20, 20)}%, ${lightL}%)`);

    // Complementary accent colour (rotate hue -90°)
    const compHue = (h + 270) % 360;
    document.documentElement.style.setProperty('--teal', `hsl(${compHue}, ${s}%, ${Math.min(l + 10, 60)}%)`);
    document.documentElement.style.setProperty('--teal-light', `hsl(${compHue}, ${s}%, ${Math.min(l + 25, 75)}%)`);
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
