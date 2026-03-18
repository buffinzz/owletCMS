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
      document.documentElement.style.setProperty('--purple-deep', settings.theme_primary_colour);
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
