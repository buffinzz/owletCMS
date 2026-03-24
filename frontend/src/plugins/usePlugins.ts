import { useState, useEffect } from 'react';
import api from '../api';

export interface PluginTab {
  id: string;
  label: string;
  roles: string[];
  pluginName: string;
}

export interface PluginManifest {
  name: string;
  displayName: string;
  version: string;
  description?: string;
  adminTabs?: PluginTab[];
  settings?: Array<{ key: string; label: string; default: string; type: string }>;
}

interface PluginsState {
  plugins: PluginManifest[];
  loading: boolean;
}

// Shared state so we only fetch once across all hook instances
let sharedPlugins: PluginManifest[] = [];
let sharedLoading = true;
let sharedFetched = false;
const listeners: Array<(state: PluginsState) => void> = [];

function notifyListeners() {
  listeners.forEach(fn => fn({ plugins: sharedPlugins, loading: sharedLoading }));
}

function fetchPluginsOnce() {
  if (sharedFetched) return;
  sharedFetched = true;
  api.get('/plugins')
    .then(res => {
      sharedPlugins = res.data;
      sharedLoading = false;
      notifyListeners();
    })
    .catch(() => {
      sharedPlugins = [];
      sharedLoading = false;
      notifyListeners();
    });
}

export function usePlugins(): PluginsState {
  const [state, setState] = useState<PluginsState>({
    plugins: sharedPlugins,
    loading: sharedLoading,
  });

  useEffect(() => {
    const listener = (s: PluginsState) => setState(s);
    listeners.push(listener);
    fetchPluginsOnce();

    // If already loaded, sync immediately
    if (!sharedLoading) {
      setState({ plugins: sharedPlugins, loading: false });
    }

    return () => {
      const idx = listeners.indexOf(listener);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, []);

  return state;
}

export function useIsPluginEnabled(pluginName: string): boolean | null {
  const { plugins, loading } = usePlugins();
  if (loading) return null; // null = still loading
  return plugins.some(p => p.name === pluginName);
}

export function usePluginTabs(token: string): { tabs: PluginTab[]; loading: boolean } {
  const [tabs, setTabs] = useState<PluginTab[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.get('/plugins/tabs', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setTabs(res.data))
      .catch(() => setTabs([]))
      .finally(() => setLoading(false));
  }, [token]);

  return { tabs, loading };
}

export function refreshPlugins() {
  sharedFetched = false;
  sharedLoading = true;
  fetchPluginsOnce();
}
