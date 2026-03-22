import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigation } from '../navigation/NavigationContext';
import type { NavItem } from '../navigation/NavigationContext';
import api from '../../api';

const NAV_TYPES = [
  { value: 'url', label: '🔗 Custom URL' },
  { value: 'page', label: '📄 Page' },
  { value: 'collection', label: '🗂️ Collection' },
  { value: 'events', label: '📅 Events' },
  { value: 'staff', label: '👥 Staff Directory' },
  { value: 'digital_resources', label: '💻 Digital Resources' },
  { value: 'anchor', label: '⚓ Anchor Link' },
];

const emptyForm = {
  label: '',
  type: 'url',
  value: '',
  target: '',
  parentId: null as number | null,
  isVisible: true,
};

export default function NavigationTab() {
  const { user } = useAuth();
  const { refresh: refreshNav } = useNavigation();
  const isAdmin = user?.role === 'admin';
  const authHeader = { headers: { Authorization: `Bearer ${user?.token}` } };

  const [items, setItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { fetchNav(); }, []);

  const fetchNav = () => {
    setLoading(true);
    api.get('/navigation', authHeader)
      .then(res => setItems(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const notify = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(''); }
    else { setSuccess(msg); setError(''); }
    setTimeout(() => { setSuccess(''); setError(''); }, 4000);
  };

  const handleEdit = (item: NavItem) => {
    setForm({
      label: item.label,
      type: item.type,
      value: item.value || '',
      target: item.target || '',
      parentId: item.parentId || null,
      isVisible: item.isVisible,
    });
    setEditingId(item.id);
    setMode('edit');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this nav item? Any children will also be deleted.')) return;
    try {
      await api.delete(`/navigation/${id}`, authHeader);
      notify('Item deleted.');
      fetchNav();
      refreshNav();
    } catch {
      notify('Failed to delete.', true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...form,
        parentId: form.parentId || undefined,
        area: 'header',
      };
      if (editingId) {
        await api.patch(`/navigation/${editingId}`, data, authHeader);
        notify('Nav item updated! 🎉');
      } else {
        await api.post('/navigation', data, authHeader);
        notify('Nav item created! 🎉');
      }
      handleCancel();
      fetchNav();
      refreshNav();
    } catch {
      notify('Something went wrong.', true);
    }
  };

  const handleCancel = () => {
    setMode('list');
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleMoveUp = async (item: NavItem, siblings: NavItem[]) => {
    const idx = siblings.findIndex(s => s.id === item.id);
    if (idx === 0) return;
    const prev = siblings[idx - 1];
    await api.patch(`/navigation/${item.id}`, { sortOrder: prev.sortOrder }, authHeader);
    await api.patch(`/navigation/${prev.id}`, { sortOrder: item.sortOrder }, authHeader);
    fetchNav();
    refreshNav();
  };

  const handleMoveDown = async (item: NavItem, siblings: NavItem[]) => {
    const idx = siblings.findIndex(s => s.id === item.id);
    if (idx === siblings.length - 1) return;
    const next = siblings[idx + 1];
    await api.patch(`/navigation/${item.id}`, { sortOrder: next.sortOrder }, authHeader);
    await api.patch(`/navigation/${next.id}`, { sortOrder: item.sortOrder }, authHeader);
    fetchNav();
    refreshNav();
  };

  const handleIndent = async (item: NavItem, siblings: NavItem[]) => {
    const idx = siblings.findIndex(s => s.id === item.id);
    if (idx === 0) return;
    const newParent = siblings[idx - 1];
    await api.patch(`/navigation/${item.id}`, { parentId: newParent.id, sortOrder: 99 }, authHeader);
    notify(`Moved under "${newParent.label}"`);
    fetchNav();
    refreshNav();
  };

  const handleOutdent = async (item: NavItem) => {
    await api.patch(`/navigation/${item.id}`, { parentId: null }, authHeader);
    notify('Moved to top level');
    fetchNav();
    refreshNav();
  };

  const needsValue = (type: string) =>
    !['events', 'staff', 'digital_resources'].includes(type);

  const valuePlaceholder = (type: string) => {
    switch (type) {
      case 'url': return 'https://example.com or /path';
      case 'page': return 'about-us';
      case 'collection': return 'summer-reading';
      case 'anchor': return 'section-id';
      default: return '';
    }
  };

  const valueLabel = (type: string) => {
    switch (type) {
      case 'url': return 'URL or Path';
      case 'page': return 'Page Slug';
      case 'collection': return 'Collection Slug';
      case 'anchor': return 'Anchor ID';
      default: return 'Value';
    }
  };

  // Render tree recursively
  const renderItem = (item: NavItem, siblings: NavItem[], depth = 0): React.ReactNode => (
    <div key={item.id}>
      <div
        className={`owlet-admin-item owlet-nav-item ${!item.isVisible ? 'owlet-catalog-item-hidden' : ''}`}
        style={{ marginLeft: depth * 24 }}
      >
        <div className="owlet-nav-item-handle">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <button
              className="owlet-nav-arrow"
              onClick={() => handleMoveUp(item, siblings)}
              disabled={siblings.indexOf(item) === 0}
              title="Move up"
            >▲</button>
            <button
              className="owlet-nav-arrow"
              onClick={() => handleMoveDown(item, siblings)}
              disabled={siblings.indexOf(item) === siblings.length - 1}
              title="Move down"
            >▼</button>
          </div>
        </div>

        <div className="owlet-admin-item-info" style={{ flex: 1, minWidth: 0 }}>
          <h3>
            {depth > 0 && <span style={{ color: 'var(--ink-light)', marginRight: '0.4rem' }}>↳</span>}
            {item.label}
            {!item.isVisible && <span className="owlet-catalog-hidden-badge">hidden</span>}
            <span className="owlet-catalog-source" style={{ marginLeft: '0.5rem' }}>
              {NAV_TYPES.find(t => t.value === item.type)?.label.split(' ').slice(1).join(' ') || item.type}
            </span>
          </h3>
          <p>
            {item.value && <span>{item.value}</span>}
            {item.children?.length > 0 && (
              <span style={{ color: 'var(--teal)' }}> · {item.children.length} child{item.children.length !== 1 ? 'ren' : ''}</span>
            )}
          </p>
        </div>

        <div className="owlet-admin-item-actions">
          {depth === 0 && siblings.indexOf(item) > 0 && (
            <button className="owlet-btn-action owlet-btn-edit"
              onClick={() => handleIndent(item, siblings)}
              title="Make child of item above">
              →
            </button>
          )}
          {depth > 0 && (
            <button className="owlet-btn-action owlet-btn-edit"
              onClick={() => handleOutdent(item)}
              title="Move to top level">
              ←
            </button>
          )}
          <button className="owlet-btn-action owlet-btn-edit"
            onClick={() => handleEdit(item)}>
            ✏️ Edit
          </button>
          {isAdmin && (
            <button className="owlet-btn-action owlet-btn-delete"
              onClick={() => handleDelete(item.id)}>
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Render children */}
      {item.children?.map(child =>
        renderItem(child, item.children, depth + 1)
      )}
    </div>
  );

  return (
    <div>
      {success && <div className="owlet-alert owlet-alert-success">{success}</div>}
      {error && <div className="owlet-alert owlet-alert-error">{error}</div>}

      {/* ── LIST ── */}
      {mode === 'list' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button
              className="owlet-btn owlet-btn-primary owlet-btn-new"
              onClick={() => { setForm(emptyForm); setMode('create'); }}
            >
              + New Navigation Item
            </button>
          </div>

          {loading ? (
            <div className="owlet-loading"><span /><span /><span /></div>
          ) : items.length === 0 ? (
            <div className="owlet-empty">
              <p>No navigation items yet.</p>
            </div>
          ) : (
            <div className="owlet-admin-list">
              {items.map(item => renderItem(item, items))}
            </div>
          )}

          <p style={{ fontSize: '0.8rem', color: 'var(--ink-light)', marginTop: '1rem', fontStyle: 'italic' }}>
            💡 Use ▲▼ to reorder. Use → to nest under the item above. Use ← to move back to top level.
          </p>
        </>
      )}

      {/* ── CREATE / EDIT FORM ── */}
      {(mode === 'create' || mode === 'edit') && (
        <form className="owlet-admin-form" onSubmit={handleSubmit}>
          <h3 className="owlet-form-title">
            {editingId ? '✏️ Edit Navigation Item' : '🧭 New Navigation Item'}
          </h3>

          <div className="owlet-field-row">
            <div className="owlet-field">
              <label>Label</label>
              <input
                value={form.label}
                onChange={e => setForm({ ...form, label: e.target.value })}
                placeholder="Collections"
                required
              />
            </div>
            <div className="owlet-field">
              <label>Type</label>
              <select
                className="owlet-select"
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value, value: '' })}
              >
                {NAV_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {needsValue(form.type) && (
            <div className="owlet-field">
              <label>{valueLabel(form.type)}</label>
              <input
                value={form.value}
                onChange={e => setForm({ ...form, value: e.target.value })}
                placeholder={valuePlaceholder(form.type)}
              />
            </div>
          )}

          {form.type === 'url' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <input
                type="checkbox"
                id="openNewTab"
                checked={form.target === '_blank'}
                onChange={e => setForm({ ...form, target: e.target.checked ? '_blank' : '' })}
              />
              <label htmlFor="openNewTab"
                style={{ fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'Source Serif 4, serif' }}>
                Open in new tab
              </label>
            </div>
          )}

          <div className="owlet-field" style={{ marginTop: '0.75rem' }}>
            <label>Parent Item <span style={{ fontWeight: 300, textTransform: 'none', fontSize: '0.75rem' }}>(optional — makes this a dropdown child)</span></label>
            <select
              className="owlet-select"
              value={form.parentId || ''}
              onChange={e => setForm({ ...form, parentId: e.target.value ? +e.target.value : null })}
            >
              <option value="">Top level</option>
              {items
                .filter(i => i.id !== editingId)
                .map(i => (
                  <option key={i.id} value={i.id}>{i.label}</option>
                ))
              }
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
            <input
              type="checkbox"
              id="navIsVisible"
              checked={form.isVisible}
              onChange={e => setForm({ ...form, isVisible: e.target.checked })}
            />
            <label htmlFor="navIsVisible"
              style={{ fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'Source Serif 4, serif' }}>
              Visible
            </label>
          </div>

          <div className="owlet-form-actions" style={{ marginTop: '1.5rem' }}>
            <button type="submit" className="owlet-btn owlet-btn-primary" style={{ width: 'auto' }}>
              {editingId ? 'Save Changes' : 'Create Navigation Item'} 🧭
            </button>
            <button type="button" className="owlet-btn owlet-btn-ghost" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
