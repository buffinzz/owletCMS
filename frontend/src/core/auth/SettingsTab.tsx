import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useSettings } from '../settings/SettingsContext';
import api from '../../api';

const THEME_COLOURS = [
  { label: 'Owlet Purple', value: '#3d1f6e' },
  { label: 'Library Teal', value: '#2a9d8f' },
  { label: 'Archive Navy', value: '#1a2744' },
  { label: 'Reading Red', value: '#8b1a1a' },
  { label: 'Forest Green', value: '#2d5a27' },
  { label: 'Amber Gold', value: '#b45309' },
];

interface PluginInfo {
  name: string;
  displayName: string;
  version: string;
  description: string;
  enabled: boolean;
  loaded: boolean;
}

export default function SettingsTab() {
  const { user } = useAuth();
  const { settings, refresh } = useSettings();
  const authHeader = { headers: { Authorization: `Bearer ${user?.token}` } };

  const [form, setForm] = useState({
    library_name: '',
    library_tagline: '',
    library_email: '',
    library_phone: '',
    library_address: '',
    library_city: '',
    library_logo_url: '',
    library_logo_alt: '',
    theme_primary_colour: '#3d1f6e',
  });

  const [pluginList, setPluginList] = useState<PluginInfo[]>([]);
  const [restartNeeded, setRestartNeeded] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Populate form from current settings
  useEffect(() => {
    setForm({
      library_name: settings.library_name || '',
      library_tagline: settings.library_tagline || '',
      library_email: settings.library_email || '',
      library_phone: settings.library_phone || '',
      library_address: settings.library_address || '',
      library_city: settings.library_city || '',
      library_logo_url: settings.library_logo_url || '',
      library_logo_alt: (settings as any).library_logo_alt || '',
      theme_primary_colour: settings.theme_primary_colour || '#3d1f6e',
    });
  }, [settings]);

  // Load plugin list
  useEffect(() => {
    api.get('/plugins/all', authHeader)
      .then(res => setPluginList(res.data))
      .catch(() => {});
  }, []);

  const notify = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(''); }
    else { setSuccess(msg); setError(''); }
    setTimeout(() => { setSuccess(''); setError(''); }, 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.patch('/settings', form, authHeader);
      refresh();
      notify('Settings saved! 🎉');
    } catch {
      notify('Failed to save settings.', true);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePlugin = async (pluginName: string, enabled: boolean) => {
    try {
      const res = await api.post('/plugins/toggle', { name: pluginName, enabled }, authHeader);
      setPluginList(prev => prev.map(p =>
        p.name === pluginName ? { ...p, enabled } : p
      ));
      if (res.data.requiresRestart) setRestartNeeded(true);
    } catch {
      notify('Failed to toggle plugin.', true);
    }
  };

  return (
    <form className="owlet-admin-form" onSubmit={handleSubmit}>
      {success && <div className="owlet-alert owlet-alert-success">{success}</div>}
      {error && <div className="owlet-alert owlet-alert-error">{error}</div>}

      {/* ── Library Info ── */}
      <p className="owlet-form-section-label">Library Info</p>
      <div className="owlet-field-row">
        <div className="owlet-field">
          <label>Library Name</label>
          <input
            value={form.library_name}
            onChange={e => setForm({ ...form, library_name: e.target.value })}
            placeholder="Franklin County Public Library"
          />
        </div>
        <div className="owlet-field">
          <label>Tagline</label>
          <input
            value={form.library_tagline}
            onChange={e => setForm({ ...form, library_tagline: e.target.value })}
            placeholder="Your community knowledge space"
          />
        </div>
      </div>

      {/* ── Contact & Location ── */}
      <p className="owlet-form-section-label" style={{ marginTop: '1rem' }}>
        Contact & Location
      </p>
      <div className="owlet-field-row">
        <div className="owlet-field">
          <label>Email</label>
          <input
            type="email"
            value={form.library_email}
            onChange={e => setForm({ ...form, library_email: e.target.value })}
            placeholder="info@library.org"
          />
        </div>
        <div className="owlet-field">
          <label>Phone</label>
          <input
            value={form.library_phone}
            onChange={e => setForm({ ...form, library_phone: e.target.value })}
            placeholder="555-0100"
          />
        </div>
      </div>
      <div className="owlet-field-row">
        <div className="owlet-field">
          <label>Street Address</label>
          <input
            value={form.library_address}
            onChange={e => setForm({ ...form, library_address: e.target.value })}
            placeholder="123 Main Street"
          />
        </div>
        <div className="owlet-field">
          <label>City / Region</label>
          <input
            value={form.library_city}
            onChange={e => setForm({ ...form, library_city: e.target.value })}
            placeholder="Springfield, ON"
          />
        </div>
      </div>

      {/* ── Appearance ── */}
      <p className="owlet-form-section-label" style={{ marginTop: '1rem' }}>
        Appearance
      </p>
      <div className="owlet-field">
        <label>Theme Colour</label>
        <div className="owlet-colour-grid">
          {THEME_COLOURS.map(colour => (
            <button
              key={colour.value}
              type="button"
              className={`owlet-colour-swatch ${form.theme_primary_colour === colour.value ? 'selected' : ''}`}
              style={{ background: colour.value }}
              onClick={() => setForm({ ...form, theme_primary_colour: colour.value })}
              title={colour.label}
            >
              {form.theme_primary_colour === colour.value && '✓'}
            </button>
          ))}
        </div>
        <p className="owlet-image-hint" style={{ marginTop: '0.5rem' }}>
          Selected: {THEME_COLOURS.find(c => c.value === form.theme_primary_colour)?.label || 'Custom'}
        </p>
      </div>
      <div className="owlet-field-row">
        <div className="owlet-field">
          <label>Logo URL</label>
          <input
            value={form.library_logo_url}
            onChange={e => setForm({ ...form, library_logo_url: e.target.value })}
            placeholder="https://your-library.org/logo.png"
          />
        </div>
        <div className="owlet-field">
          <label>Logo Alt Text</label>
          <input
            value={form.library_logo_alt}
            onChange={e => setForm({ ...form, library_logo_alt: e.target.value })}
            placeholder="Franklin County Public Library logo"
          />
        </div>
      </div>

      {/* ── Plugins ── */}
      <p className="owlet-form-section-label" style={{ marginTop: '2rem' }}>
        🧩 Plugins
      </p>

      {restartNeeded && (
        <div className="owlet-alert owlet-alert-error" style={{ marginBottom: '1rem' }}>
          ⚠️ Plugin changes require a server restart to take effect.
        </div>
      )}

      {pluginList.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--ink-light)' }}>
          No plugins found.
        </p>
      ) : (
        <div className="owlet-plugin-list">
          {pluginList.map(plugin => (
            <div key={plugin.name} className="owlet-plugin-item">
              <div className="owlet-plugin-info">
                <h4>
                  {plugin.displayName}
                  <span className="owlet-media-meta"> v{plugin.version}</span>
                  {!plugin.loaded && plugin.enabled && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--amber)', marginLeft: '0.5rem' }}>
                      ⚠️ restart required
                    </span>
                  )}
                  {!plugin.enabled && (
                    <span className="owlet-catalog-hidden-badge">disabled</span>
                  )}
                </h4>
                <p>{plugin.description}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                <input
                  type="checkbox"
                  id={`plugin-${plugin.name}`}
                  checked={plugin.enabled}
                  onChange={e => handleTogglePlugin(plugin.name, e.target.checked)}
                />
                <label
                  htmlFor={`plugin-${plugin.name}`}
                  style={{
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    fontFamily: 'Source Serif 4, serif',
                    color: plugin.enabled ? 'var(--teal)' : 'var(--ink-light)',
                  }}
                >
                  {plugin.enabled ? 'Enabled' : 'Disabled'}
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* ── Save button ── */}
      <div className="owlet-form-actions" style={{ marginTop: '1rem' }}>
        <button
          type="submit"
          className="owlet-btn owlet-btn-primary"
          style={{ width: 'auto' }}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings ⚙️'}
        </button>
      </div>
    </form>
  );
}
