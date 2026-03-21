import { useState, useEffect } from 'react';
import api from '../api';

interface PluginTab {
  id: string;
  label: string;
  roles: string[];
  pluginName: string;
}

interface PluginManifest {
  name: string;
  displayName: string;
  version: string;
  adminTabs?: PluginTab[];
  settings?: Array<{ key: string; label: string; default: string; type: string }>;
}

export function usePluginTabs(token: string) {
  const [tabs, setTabs] = useState<PluginTab[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api.get('/plugins/tabs', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setTabs(res.data))
      .catch(() => setTabs([]))
      .finally(() => setLoading(false));
  }, [token]);

  return { tabs, loading };
}

export function usePlugins() {
  const [plugins, setPlugins] = useState<PluginManifest[]>([]);

  useEffect(() => {
    api.get('/plugins').then(res => setPlugins(res.data));
  }, []);

  return plugins;
}
