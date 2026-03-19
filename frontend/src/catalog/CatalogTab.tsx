import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import api from '../api';

interface CatalogItem {
  id: number;
  title: string;
  author?: string;
  isbn?: string;
  summary?: string;
  coverUrl?: string;
  publishedDate?: string;
  subjects?: string[];
  format?: string;
  source: string;
  isVisible: boolean;
  createdAt: string;
}

interface SyncLog {
  id: number;
  provider: string;
  synced: number;
  skipped: number;
  error?: string;
  trigger: string;
  createdAt: string;
}

interface Collection {
  id: number;
  name: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  isVisible: boolean;
  createdAt: string;
}

type CatalogView = 'items' | 'collections' | 'sync';
type ItemMode = 'list' | 'edit';

const emptyCollection = {
  name: '', slug: '', description: '', coverUrl: '', isVisible: true,
};

export default function CatalogTab() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const authHeader = { headers: { Authorization: `Bearer ${user?.token}` } };

  const [view, setView] = useState<CatalogView>('items');
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [visibleFilter, setVisibleFilter] = useState('');

  // Bulk selection
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Edit mode
  const [editMode, setEditMode] = useState<ItemMode>('list');
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [editingCollection, setEditingCollection] = useState<Partial<Collection> | null>(null);
  const [collectionMode, setCollectionMode] = useState<'list' | 'create' | 'edit'>('list');

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { fetchItems(); }, [search, sourceFilter, visibleFilter]);

  const fetchAll = () => {
    fetchItems();
    fetchCollections();
    fetchSyncLogs();
  };

  const fetchItems = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (sourceFilter) params.set('source', sourceFilter);
    if (visibleFilter) params.set('visible', visibleFilter);
    api.get(`/catalog?${params.toString()}`)
      .then(res => setItems(res.data))
      .finally(() => setLoading(false));
  };

  const fetchCollections = () => {
    api.get('/collections/admin/all', authHeader)
      .then(res => setCollections(res.data))
      .catch(() => {});
  };

  const fetchSyncLogs = () => {
    api.get('/catalog/sync-history', authHeader)
      .then(res => setSyncLogs(res.data))
      .catch(() => {});
  };

  const notify = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(''); }
    else { setSuccess(msg); setError(''); }
    setTimeout(() => { setSuccess(''); setError(''); }, 4000);
  };

  // ── Sync ──
  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await api.post('/catalog/sync', {}, authHeader);
      notify(`Sync complete! ${res.data.synced} new items, ${res.data.skipped} skipped.`);
      fetchItems();
      fetchSyncLogs();
    } catch {
      notify('Sync failed.', true);
    } finally {
      setSyncing(false);
    }
  };

  // ── Bulk actions ──
  const toggleSelect = (id: number) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const selectAll = () => {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map(i => i.id)));
    }
  };

  const handleBulkVisibility = async (isVisible: boolean) => {
    if (selected.size === 0) return;
    try {
      await api.patch('/catalog/bulk-visibility', { ids: Array.from(selected), isVisible }, authHeader);
      notify(`${selected.size} items ${isVisible ? 'shown' : 'hidden'}.`);
      setSelected(new Set());
      fetchItems();
    } catch {
      notify('Bulk action failed.', true);
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} items? This cannot be undone.`)) return;
    try {
      await api.delete('/catalog/bulk-delete', { ...authHeader, data: { ids: Array.from(selected) } });
      notify(`${selected.size} items deleted.`);
      setSelected(new Set());
      fetchItems();
    } catch {
      notify('Bulk delete failed.', true);
    }
  };

  // ── Item edit ──
  const handleSaveItem = async () => {
    if (!editingItem) return;
    try {
      await api.patch(`/catalog/${editingItem.id}`, editingItem, authHeader);
      notify('Item saved!');
      setEditMode('list');
      setEditingItem(null);
      fetchItems();
    } catch {
      notify('Failed to save item.', true);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Delete this item?')) return;
    try {
      await api.delete(`/catalog/${id}`, authHeader);
      notify('Item deleted.');
      fetchItems();
    } catch {
      notify('Failed to delete item.', true);
    }
  };

  // ── Collections ──
  const handleSaveCollection = async () => {
    if (!editingCollection) return;
    try {
      if ('id' in editingCollection && editingCollection.id) {
        await api.patch(`/collections/${editingCollection.id}`, editingCollection, authHeader);
        notify('Collection saved!');
      } else {
        await api.post('/collections', editingCollection, authHeader);
        notify('Collection created!');
      }
      setCollectionMode('list');
      setEditingCollection(null);
      fetchCollections();
    } catch {
      notify('Failed to save collection.', true);
    }
  };

  const handleDeleteCollection = async (id: number) => {
    if (!confirm('Delete this collection?')) return;
    try {
      await api.delete(`/collections/${id}`, authHeader);
      notify('Collection deleted.');
      fetchCollections();
    } catch {
      notify('Failed to delete collection.', true);
    }
  };

  return (
    <div className="owlet-catalog-tab">
      {success && <div className="owlet-alert owlet-alert-success">{success}</div>}
      {error && <div className="owlet-alert owlet-alert-error">{error}</div>}

      {/* Sub-navigation */}
      <div className="owlet-catalog-nav">
        <button className={`owlet-tab ${view === 'items' ? 'active' : ''}`} onClick={() => setView('items')}>
          📚 Items ({items.length})
        </button>
        <button className={`owlet-tab ${view === 'collections' ? 'active' : ''}`} onClick={() => setView('collections')}>
          🗂️ Collections ({collections.length})
        </button>
        <button className={`owlet-tab ${view === 'sync' ? 'active' : ''}`} onClick={() => setView('sync')}>
          🔄 Sync History
        </button>
        <button
          className="owlet-btn owlet-btn-primary owlet-btn-new"
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? 'Syncing...' : '🔄 Sync Now'}
        </button>
      </div>

      {/* ── ITEMS VIEW ── */}
      {view === 'items' && editMode === 'list' && (
        <>
          {/* Filters */}
          <div className="owlet-catalog-filters">
            <input
              className="owlet-catalog-search"
              placeholder="Search title, author, ISBN..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="owlet-select owlet-select-sm"
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value)}
            >
              <option value="">All sources</option>
              <option value="evergreen">Evergreen</option>
              <option value="native">Native</option>
              <option value="koha">Koha</option>
            </select>
            <select
              className="owlet-select owlet-select-sm"
              value={visibleFilter}
              onChange={e => setVisibleFilter(e.target.value)}
            >
              <option value="">All visibility</option>
              <option value="true">Visible</option>
              <option value="false">Hidden</option>
            </select>
          </div>

          {/* Bulk actions */}
          {selected.size > 0 && (
            <div className="owlet-bulk-actions">
              <span>{selected.size} selected</span>
              <button className="owlet-btn-action owlet-btn-edit" onClick={() => handleBulkVisibility(true)}>👁️ Show</button>
              <button className="owlet-btn-action owlet-btn-edit" onClick={() => handleBulkVisibility(false)}>🚫 Hide</button>
              {isAdmin && <button className="owlet-btn-action owlet-btn-delete" onClick={handleBulkDelete}>🗑️ Delete</button>}
              <button className="owlet-btn-action owlet-btn-edit" onClick={() => setSelected(new Set())}>✕ Clear</button>
            </div>
          )}

          {/* Items list */}
          <div className="owlet-admin-list">
            {/* Select all header */}
            <div className="owlet-catalog-select-all">
              <input
                type="checkbox"
                checked={selected.size === items.length && items.length > 0}
                onChange={selectAll}
              />
              <span>{items.length} items</span>
            </div>

            {loading ? (
              <div className="owlet-loading"><span /><span /><span /></div>
            ) : items.length === 0 ? (
              <div className="owlet-empty"><p>No items found.</p></div>
            ) : items.map(item => (
              <div key={item.id} className={`owlet-admin-item owlet-catalog-item ${!item.isVisible ? 'owlet-catalog-item-hidden' : ''}`}>
                <input
                  type="checkbox"
                  checked={selected.has(item.id)}
                  onChange={() => toggleSelect(item.id)}
                  onClick={e => e.stopPropagation()}
                />
                <div className="owlet-catalog-thumb-wrap">
                  {item.coverUrl ? (
                    <img
                      src={item.coverUrl}
                      alt={item.title}
                      className="owlet-catalog-thumb"
                      onError={e => (e.target as HTMLImageElement).style.display = 'none'}
                    />
                  ) : null}
                </div>
                <div className="owlet-admin-item-info">
                  <h3>
                    {item.title}
                    {!item.isVisible && <span className="owlet-catalog-hidden-badge">hidden</span>}
                  </h3>
                  <p>
                    {item.author && <span>{item.author} · </span>}
                    {item.isbn && <span>ISBN: {item.isbn} · </span>}
                    <span className="owlet-catalog-source">{item.source}</span>
                  </p>
                </div>
                <div className="owlet-admin-item-actions">
                  <button
                    className="owlet-btn-action owlet-btn-edit"
                    onClick={() => { setEditingItem(item); setEditMode('edit'); }}
                  >✏️ Edit</button>
                  {isAdmin && (
                    <button
                      className="owlet-btn-action owlet-btn-delete"
                      onClick={() => handleDeleteItem(item.id)}
                    >🗑️</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── ITEM EDIT FORM ── */}
      {view === 'items' && editMode === 'edit' && editingItem && (
        <form className="owlet-admin-form" onSubmit={e => { e.preventDefault(); handleSaveItem(); }}>
          <h3 className="owlet-form-title">✏️ Edit Item</h3>
          <div className="owlet-field-row">
            <div className="owlet-field">
              <label>Title</label>
              <input value={editingItem.title} onChange={e => setEditingItem({ ...editingItem, title: e.target.value })} required />
            </div>
            <div className="owlet-field">
              <label>Author</label>
              <input value={editingItem.author || ''} onChange={e => setEditingItem({ ...editingItem, author: e.target.value })} />
            </div>
          </div>
          <div className="owlet-field-row">
            <div className="owlet-field">
              <label>ISBN</label>
              <input value={editingItem.isbn || ''} onChange={e => setEditingItem({ ...editingItem, isbn: e.target.value })} />
            </div>
            <div className="owlet-field">
              <label>Published Date</label>
              <input value={editingItem.publishedDate || ''} onChange={e => setEditingItem({ ...editingItem, publishedDate: e.target.value })} />
            </div>
            <div className="owlet-field">
              <label>Format</label>
              <select className="owlet-select" value={editingItem.format || ''} onChange={e => setEditingItem({ ...editingItem, format: e.target.value })}>
                <option value="">Unknown</option>
                <option value="book">Book</option>
                <option value="ebook">eBook</option>
                <option value="audiobook">Audiobook</option>
                <option value="dvd">DVD</option>
                <option value="magazine">Magazine</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="owlet-field">
            <label>Cover URL</label>
            <input value={editingItem.coverUrl || ''} onChange={e => setEditingItem({ ...editingItem, coverUrl: e.target.value })} />
          </div>
          <div className="owlet-field">
            <label>Summary</label>
            <textarea value={editingItem.summary || ''} onChange={e => setEditingItem({ ...editingItem, summary: e.target.value })} rows={4} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <input
              type="checkbox"
              id="itemIsVisible"
              checked={editingItem.isVisible}
              onChange={e => setEditingItem({ ...editingItem, isVisible: e.target.checked })}
            />
            <label htmlFor="itemIsVisible" style={{ fontSize: '0.9rem', color: 'var(--ink)', cursor: 'pointer', fontFamily: 'Source Serif 4, serif' }}>
              Visible on public site
            </label>
          </div>
          <div className="owlet-form-actions">
            <button type="submit" className="owlet-btn owlet-btn-primary" style={{ width: 'auto' }}>Save Changes</button>
            <button type="button" className="owlet-btn owlet-btn-ghost" onClick={() => { setEditMode('list'); setEditingItem(null); }}>Cancel</button>
          </div>
        </form>
      )}

      {/* ── COLLECTIONS VIEW ── */}
      {view === 'collections' && collectionMode === 'list' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="owlet-btn owlet-btn-primary owlet-btn-new"
              onClick={() => { setEditingCollection(emptyCollection); setCollectionMode('create'); }}>
              + New Collection
            </button>
          </div>
          <div className="owlet-admin-list">
            {collections.length === 0
              ? <div className="owlet-empty"><p>No collections yet.</p></div>
              : collections.map(col => (
                <div key={col.id} className="owlet-admin-item">
                  <div className="owlet-admin-item-info">
                    <h3>
                      {col.name}
                      {!col.isVisible && <span className="owlet-catalog-hidden-badge">hidden</span>}
                    </h3>
                    <p>/{col.slug}{col.description && ` · ${col.description}`}</p>
                  </div>
                  <div className="owlet-admin-item-actions">
                    <button className="owlet-btn-action owlet-btn-edit"
                      onClick={() => { setEditingCollection(col); setCollectionMode('edit'); }}>
                      ✏️ Edit
                    </button>
                    {isAdmin && (
                      <button className="owlet-btn-action owlet-btn-delete"
                        onClick={() => handleDeleteCollection(col.id)}>
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                </div>
              ))
            }
          </div>
        </>
      )}

      {/* ── COLLECTION FORM ── */}
      {view === 'collections' && (collectionMode === 'create' || collectionMode === 'edit') && editingCollection && (
        <form className="owlet-admin-form" onSubmit={e => { e.preventDefault(); handleSaveCollection(); }}>
          <h3 className="owlet-form-title">{collectionMode === 'edit' ? '✏️ Edit Collection' : '🗂️ New Collection'}</h3>
          <div className="owlet-field-row">
            <div className="owlet-field">
              <label>Name</label>
              <input value={editingCollection.name || ''} onChange={e => setEditingCollection({ ...editingCollection, name: e.target.value })} placeholder="Summer Reading 2026" required />
            </div>
            <div className="owlet-field">
              <label>Slug</label>
              <input value={editingCollection.slug || ''} onChange={e => setEditingCollection({ ...editingCollection, slug: e.target.value })} placeholder="summer-reading-2026" required />
            </div>
          </div>
          <div className="owlet-field">
            <label>Description</label>
            <textarea value={editingCollection.description || ''} onChange={e => setEditingCollection({ ...editingCollection, description: e.target.value })} rows={3} placeholder="A curated collection of..." />
          </div>
          <div className="owlet-field">
            <label>Cover Image URL</label>
            <input value={editingCollection.coverUrl || ''} onChange={e => setEditingCollection({ ...editingCollection, coverUrl: e.target.value })} placeholder="https://..." />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <input
              type="checkbox"
              id="collectionIsVisible"
              checked={editingCollection.isVisible ?? true}
              onChange={e => setEditingCollection({ ...editingCollection, isVisible: e.target.checked })}
            />
            <label htmlFor="collectionIsVisible" style={{ fontSize: '0.9rem', color: 'var(--ink)', cursor: 'pointer', fontFamily: 'Source Serif 4, serif' }}>
              Visible on public site
            </label>
          </div>
          <div className="owlet-form-actions">
            <button type="submit" className="owlet-btn owlet-btn-primary" style={{ width: 'auto' }}>
              {collectionMode === 'edit' ? 'Save Changes' : 'Create Collection'} 🗂️
            </button>
            <button type="button" className="owlet-btn owlet-btn-ghost" onClick={() => { setCollectionMode('list'); setEditingCollection(null); }}>Cancel</button>
          </div>
        </form>
      )}

      {/* ── SYNC HISTORY ── */}
      {view === 'sync' && (
        <div className="owlet-admin-list">
          {syncLogs.length === 0
            ? <div className="owlet-empty"><p>No sync history yet.</p></div>
            : syncLogs.map(log => (
              <div key={log.id} className={`owlet-admin-item ${log.error ? 'owlet-sync-error' : ''}`}>
                <div className="owlet-admin-item-info">
                  <h3>
                    {log.error ? '❌' : '✅'} {log.provider}
                    <span className="owlet-catalog-source" style={{ marginLeft: '0.5rem' }}>{log.trigger}</span>
                  </h3>
                  <p>
                    {log.synced} new · {log.skipped} skipped · {new Date(log.createdAt).toLocaleString()}
                    {log.error && <span style={{ color: '#c0392b' }}> · {log.error}</span>}
                  </p>
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
