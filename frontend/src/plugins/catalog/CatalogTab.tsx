import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../core/auth/AuthContext';
import api from '../../api';
import ImageUpload from '../../core/components/ImageUpload';
import CirculationTab from '../native-catalog/CirculationTab';
import HoldsTab from '../native-catalog/HoldsTab';

interface CatalogItem {
  id: number;
  title: string;
  author?: string;
  isbn?: string;
  summary?: string;
  coverUrl?: string;
  coverAlt?: string;
  publishedDate?: string;
  publisher?: string;
  subjects?: string[];
  format?: string;
  source: string;
  externalUrl?: string;
  isVisible: boolean;
  createdAt: string;
}

interface NativeCopy {
  id: number;
  itemId: number;
  barcode: string;
  location?: string;
  shelfLocation?: string;
  condition: string;
  status: string;
  notes?: string;
}

interface CopyCounts {
  total: number;
  available: number;
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

type CatalogView = 'items' | 'sync' | 'circulation' | 'holds';
type ItemMode = 'list' | 'create' | 'edit' | 'copies';

const FORMATS = [
  { value: 'book', label: '📖 Book' },
  { value: 'dvd', label: '🎬 DVD/Blu-ray' },
  { value: 'audiobook', label: '🎧 Audiobook' },
  { value: 'magazine', label: '📰 Magazine/Periodical' },
  { value: 'boardgame', label: '🎲 Board Game' },
  { value: 'equipment', label: '🔧 Equipment/Tool' },
  { value: 'seed', label: '🌱 Seed Library' },
  { value: 'other', label: '📦 Other' },
];

const CONDITIONS = ['new', 'good', 'fair', 'poor'];

const COPY_STATUSES = ['available', 'checked_out', 'on_hold', 'lost', 'withdrawn'];

const emptyForm = {
  title: '', author: '', isbn: '', publisher: '',
  publishedDate: '', summary: '', coverUrl: '', coverAlt: '',
  format: 'book', subjects: [] as string[], isVisible: true, source: 'native',
};

const emptyCopy = {
  barcode: '', location: '', shelfLocation: '',
  condition: 'good', status: 'available', notes: '',
};

const copyStatusColor = (status: string) => {
  switch (status) {
    case 'available': return 'var(--teal)';
    case 'checked_out': return 'var(--amber)';
    case 'on_hold': return 'var(--purple-mid)';
    case 'lost': return '#c0392b';
    default: return 'var(--ink-light)';
  }
};

export default function CatalogTab() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const authHeader = { headers: { Authorization: `Bearer ${user?.token}` } };

  const [view, setView] = useState<CatalogView>('items');
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [visibleFilter, setVisibleFilter] = useState('');

  // Bulk selection
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Item mode
  const [itemMode, setItemMode] = useState<ItemMode>('list');
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [subjectInput, setSubjectInput] = useState('');

  // ISBN lookup
  const [isbnInput, setIsbnInput] = useState('');
  const [isbnLoading, setIsbnLoading] = useState(false);
  const [isbnFound, setIsbnFound] = useState(false);
  const isbnRef = useRef<HTMLInputElement>(null);

  // Copies
  const [copiesItem, setCopiesItem] = useState<CatalogItem | null>(null);
  const [copies, setCopies] = useState<NativeCopy[]>([]);
  const [copyCounts, setCopyCounts] = useState<Record<number, CopyCounts>>({});
  const [copyForm, setCopyForm] = useState(emptyCopy);
  const [editingCopyId, setEditingCopyId] = useState<number | null>(null);

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { fetchItems(); fetchSyncLogs(); }, []);
  useEffect(() => { fetchItems(); }, [search, sourceFilter, visibleFilter]);

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

  const fetchSyncLogs = () => {
    api.get('/catalog/sync-history', authHeader)
      .then(res => setSyncLogs(res.data))
      .catch(() => {});
  };

  const fetchCopies = (itemId: number) => {
    api.get(`/catalog/copies/item/${itemId}`, authHeader)
      .then(res => setCopies(res.data))
      .catch(() => setCopies([]));
  };

  const fetchCopyCounts = () => {
    api.get('/catalog/copies', authHeader)
      .then(res => {
        const counts = (res.data as NativeCopy[]).reduce<Record<number, CopyCounts>>((acc, copy) => {
          const current = acc[copy.itemId] || { total: 0, available: 0 };
          current.total += 1;
          if (copy.status === 'available') current.available += 1;
          acc[copy.itemId] = current;
          return acc;
        }, {});
        setCopyCounts(counts);
      })
      .catch(() => setCopyCounts({}));
  };

  useEffect(() => {
    if (user?.token) fetchCopyCounts();
    else setCopyCounts({});
  }, [user?.token, items.length]);

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

  // ── Bulk ──
  const toggleSelect = (id: number) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const selectAll = () => {
    selected.size === items.length
      ? setSelected(new Set())
      : setSelected(new Set(items.map(i => i.id)));
  };

  const handleBulkVisibility = async (isVisible: boolean) => {
    if (!selected.size) return;
    try {
      await api.patch('/catalog/bulk-visibility', { ids: Array.from(selected), isVisible }, authHeader);
      notify(`${selected.size} items ${isVisible ? 'shown' : 'hidden'}.`);
      setSelected(new Set());
      fetchItems();
    } catch { notify('Bulk action failed.', true); }
  };

  const handleBulkDelete = async () => {
    if (!selected.size) return;
    if (!confirm(`Delete ${selected.size} items?`)) return;
    try {
      await api.delete('/catalog/bulk-delete', { ...authHeader, data: { ids: Array.from(selected) } });
      notify(`${selected.size} items deleted.`);
      setSelected(new Set());
      fetchItems();
    } catch { notify('Bulk delete failed.', true); }
  };

  // ── ISBN Lookup ──
  const handleIsbnLookup = async () => {
    if (!isbnInput.trim()) return;
    setIsbnLoading(true);
    setIsbnFound(false);
    try {
      const res = await api.get(`/catalog/isbn/${isbnInput.trim()}`, authHeader);
      if (res.data) {
        setForm(prev => ({
          ...prev,
          title: res.data.title || prev.title,
          author: res.data.author || prev.author,
          isbn: res.data.isbn || isbnInput.trim(),
          publisher: res.data.publisher || prev.publisher,
          publishedDate: res.data.publishedYear || prev.publishedDate,
          summary: res.data.description || prev.summary,
          coverUrl: res.data.coverUrl || prev.coverUrl,
          subjects: res.data.subjects || prev.subjects,
        }));
        setIsbnFound(true);
        notify('📚 Book data loaded from Open Library!');
      } else {
        notify('No data found for that ISBN — fill in manually.', true);
      }
    } catch {
      notify('ISBN lookup failed.', true);
    } finally {
      setIsbnLoading(false);
    }
  };

  // ── Item CRUD ──
  const handleNewItem = () => {
    setForm(emptyForm);
    setIsbnInput('');
    setIsbnFound(false);
    setSubjectInput('');
    setEditingItem(null);
    setItemMode('create');
  };

  const handleEditItem = (item: CatalogItem) => {
    setForm({
      title: item.title,
      author: item.author || '',
      isbn: item.isbn || '',
      publisher: (item as any).publisher || '',
      publishedDate: item.publishedDate || '',
      summary: item.summary || '',
      coverUrl: item.coverUrl || '',
      coverAlt: item.coverAlt || '',
      format: item.format || 'book',
      subjects: item.subjects || [],
      isVisible: item.isVisible,
      source: item.source,
    });
    setEditingItem(item);
    setItemMode('edit');
  };

  const handleViewCopies = (item: CatalogItem) => {
    setCopiesItem(item);
    setCopyForm(emptyCopy);
    setEditingCopyId(null);
    fetchCopies(item.id);
    setItemMode('copies');
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.patch(`/catalog/item/${editingItem.id}`, form, authHeader);
        notify('Item saved!');
      } else {
        const newItem = await api.post('/catalog', form, authHeader);
        notify('Item added! 📚');
        // Offer to add copies immediately for native items
        if (form.source === 'native') {
          handleViewCopies(newItem.data);
          return;
        }
      }
      handleCancelItem();
      fetchItems();
    } catch { notify('Something went wrong.', true); }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Delete this item?')) return;
    try {
      await api.delete(`/catalog/item/${id}`, authHeader);
      notify('Item deleted.');
      fetchItems();
    } catch { notify('Failed to delete.', true); }
  };

  const handleCancelItem = () => {
    setItemMode('list');
    setEditingItem(null);
    setForm(emptyForm);
    setIsbnInput('');
    setIsbnFound(false);
    setSubjectInput('');
  };

  const addSubject = (s: string) => {
    if (!s.trim() || form.subjects.includes(s.trim())) return;
    setForm(prev => ({ ...prev, subjects: [...prev.subjects, s.trim()] }));
    setSubjectInput('');
  };

  const removeSubject = (s: string) => {
    setForm(prev => ({ ...prev, subjects: prev.subjects.filter(x => x !== s) }));
  };

  // ── Copy CRUD ──
  const handleSaveCopy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copiesItem) return;
    try {
      if (editingCopyId) {
        await api.patch(`/catalog/copies/${editingCopyId}`, copyForm, authHeader);
        notify('Copy updated!');
      } else {
        await api.post('/catalog/copies', { ...copyForm, itemId: copiesItem.id }, authHeader);
        notify('Copy added!');
      }
      setCopyForm(emptyCopy);
      setEditingCopyId(null);
      fetchCopies(copiesItem.id);
      fetchCopyCounts();
    } catch { notify('Failed to save copy.', true); }
  };

  const handleDeleteCopy = async (copyId: number) => {
    if (!confirm('Delete this copy?')) return;
    try {
      await api.delete(`/catalog/copies/${copyId}`, authHeader);
      notify('Copy deleted.');
      if (copiesItem) fetchCopies(copiesItem.id);
      fetchCopyCounts();
    } catch { notify('Failed to delete copy.', true); }
  };

  // Safety guard
  if (itemMode === 'edit' && !editingItem) {
    setItemMode('list');
    return null;
  }

  const isNativeForm = form.source === 'native' || itemMode === 'create';

  return (
    <div className="owlet-catalog-tab">
      {success && <div className="owlet-alert owlet-alert-success">{success}</div>}
      {error && <div className="owlet-alert owlet-alert-error">{error}</div>}

      {/* Sub-navigation */}
      <div className="owlet-catalog-nav">
        <button className={`owlet-tab ${view === 'items' ? 'active' : ''}`}
          onClick={() => { setView('items'); setItemMode('list'); }}>
          📚 Items ({items.length})
        </button>
        <button className={`owlet-tab ${view === 'circulation' ? 'active' : ''}`}
          onClick={() => setView('circulation')}>
          🔄 Circulation
        </button>
        <button className={`owlet-tab ${view === 'holds' ? 'active' : ''}`}
          onClick={() => setView('holds')}>
          📋 Holds
        </button>
        <button className={`owlet-tab ${view === 'sync' ? 'active' : ''}`}
          onClick={() => { setView('sync'); setItemMode('list'); }}>
          🔄 Sync History
        </button>
        ...
      </div>

      {/* ── ITEMS LIST ── */}
      {view === 'items' && itemMode === 'list' && (
        <>
          <div className="owlet-catalog-filters">
            <input
              className="owlet-catalog-search"
              placeholder="Search title, author, ISBN..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className="owlet-select owlet-select-sm" value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value)}>
              <option value="">All sources</option>
              <option value="native">📖 Native</option>
              <option value="evergreen">Evergreen</option>
              <option value="koha">Koha</option>
            </select>
            <select className="owlet-select owlet-select-sm" value={visibleFilter}
              onChange={e => setVisibleFilter(e.target.value)}>
              <option value="">All visibility</option>
              <option value="true">Visible</option>
              <option value="false">Hidden</option>
            </select>
            <button
              className="owlet-btn owlet-btn-primary owlet-btn-new"
              onClick={handleNewItem}
            >
              + Add Item
            </button>
          </div>

          {selected.size > 0 && (
            <div className="owlet-bulk-actions">
              <span>{selected.size} selected</span>
              <button className="owlet-btn-action owlet-btn-edit"
                onClick={() => handleBulkVisibility(true)}>👁️ Show</button>
              <button className="owlet-btn-action owlet-btn-edit"
                onClick={() => handleBulkVisibility(false)}>🚫 Hide</button>
              {isAdmin && (
                <button className="owlet-btn-action owlet-btn-delete"
                  onClick={handleBulkDelete}>🗑️ Delete</button>
              )}
              <button className="owlet-btn-action owlet-btn-edit"
                onClick={() => setSelected(new Set())}>✕ Clear</button>
            </div>
          )}

          <div className="owlet-admin-list">
            <div className="owlet-catalog-select-all">
              <input type="checkbox"
                checked={selected.size === items.length && items.length > 0}
                onChange={selectAll} />
              <span>{items.length} items</span>
            </div>

            {loading ? (
              <div className="owlet-loading"><span /><span /><span /></div>
            ) : items.length === 0 ? (
              <div className="owlet-empty">
                <p>No items found.
                  {!sourceFilter && (
                    <> Try <button className="owlet-link-btn" onClick={handleNewItem}>adding an item</button> or syncing from your catalog provider.</>
                  )}
                </p>
              </div>
            ) : items.map(item => (
              <div key={item.id}
                className={`owlet-admin-item owlet-catalog-item ${!item.isVisible ? 'owlet-catalog-item-hidden' : ''}`}>
                <input type="checkbox" checked={selected.has(item.id)}
                  onChange={() => toggleSelect(item.id)}
                  onClick={e => e.stopPropagation()} />
                <div className="owlet-catalog-thumb-wrap">
                  {item.coverUrl && (
                    <img src={item.coverUrl} alt={item.coverAlt || item.title}
                      onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
                  )}
                </div>
                <div className="owlet-admin-item-info" style={{ flex: 1, minWidth: 0 }}>
                  <h3>
                    {item.title}
                    {!item.isVisible && <span className="owlet-catalog-hidden-badge">hidden</span>}
                    <span className="owlet-catalog-source" style={{ marginLeft: '0.5rem' }}>
                      {item.source === 'native'
                        ? (FORMATS.find(f => f.value === item.format)?.label.split(' ').slice(1).join(' ') || 'Native')
                        : item.source}
                    </span>
                  </h3>
                  <p>
                    {item.author && <span>{item.author}</span>}
                    {item.isbn && <span> · ISBN: {item.isbn}</span>}
                    {item.source === 'native' && copyCounts[item.id]?.total > 0 && (
                      <span>
                        {' '}· {copyCounts[item.id].total} cop{copyCounts[item.id].total !== 1 ? 'ies' : 'y'}
                        {copyCounts[item.id].available > 0 && ` (${copyCounts[item.id].available} available)`}
                      </span>
                    )}
                  </p>
                </div>
                <div className="owlet-admin-item-actions">
                  {item.source === 'native' && (
                    <button className="owlet-btn-action owlet-btn-edit"
                      onClick={() => handleViewCopies(item)}>
                      📋 Copies{copyCounts[item.id]?.total ? ` (${copyCounts[item.id].total})` : ''}
                    </button>
                  )}
                  <button className="owlet-btn-action owlet-btn-edit"
                    onClick={() => handleEditItem(item)}>
                    ✏️ Edit
                  </button>
                  {isAdmin && (
                    <button className="owlet-btn-action owlet-btn-delete"
                      onClick={() => handleDeleteItem(item.id)}>
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── CREATE / EDIT FORM ── */}
      {view === 'items' && (itemMode === 'create' || itemMode === 'edit') && (
        <form className="owlet-admin-form" onSubmit={handleSaveItem}>
          <h3 className="owlet-form-title">
            {editingItem ? '✏️ Edit Item' : '📚 Add Item'}
          </h3>

          {/* Source selector — only on create */}
          {itemMode === 'create' && (
            <div className="owlet-field" style={{ marginBottom: '1rem' }}>
              <label>Source</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className={`owlet-media-filter ${form.source === 'native' ? 'active' : ''}`}
                  onClick={() => setForm({ ...form, source: 'native' })}
                >
                  📖 Native (add to our collection)
                </button>
                <button
                  type="button"
                  className={`owlet-media-filter ${form.source === 'external' ? 'active' : ''}`}
                  onClick={() => setForm({ ...form, source: 'external' })}
                >
                  🔗 External (link only)
                </button>
              </div>
            </div>
          )}

          {/* ISBN lookup — native items only, create mode */}
          {itemMode === 'create' && form.source === 'native' && (
            <div className="owlet-isbn-lookup">
              <p className="owlet-form-section-label">📖 ISBN Lookup</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  ref={isbnRef}
                  className="owlet-catalog-search"
                  placeholder="Scan or enter ISBN..."
                  value={isbnInput}
                  onChange={e => setIsbnInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleIsbnLookup(); } }}
                  style={{ flex: 1 }}
                  autoFocus
                />
                <button
                  type="button"
                  className="owlet-btn owlet-btn-primary"
                  style={{ width: 'auto' }}
                  onClick={handleIsbnLookup}
                  disabled={isbnLoading}
                >
                  {isbnLoading ? '⏳' : '🔍 Look Up'}
                </button>
              </div>
              {isbnFound ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--teal)', marginTop: '0.35rem' }}>
                  ✓ Data loaded from Open Library — review and edit below
                </p>
              ) : (
                <p style={{ fontSize: '0.75rem', color: 'var(--ink-light)', marginTop: '0.25rem' }}>
                  Press Enter to look up, or fill in the form below manually
                </p>
              )}
            </div>
          )}

          <p className="owlet-form-section-label" style={{ marginTop: '1rem' }}>Details</p>
          <div className="owlet-field-row">
            <div className="owlet-field">
              <label>Title *</label>
              <input value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                required />
            </div>
            <div className="owlet-field">
              <label>Author</label>
              <input value={form.author}
                onChange={e => setForm({ ...form, author: e.target.value })} />
            </div>
          </div>
          <div className="owlet-field-row">
            <div className="owlet-field">
              <label>Format</label>
              <select className="owlet-select" value={form.format}
                onChange={e => setForm({ ...form, format: e.target.value })}>
                {FORMATS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div className="owlet-field">
              <label>ISBN</label>
              <input value={form.isbn}
                onChange={e => setForm({ ...form, isbn: e.target.value })} />
            </div>
          </div>
          <div className="owlet-field-row">
            <div className="owlet-field">
              <label>Publisher</label>
              <input value={form.publisher}
                onChange={e => setForm({ ...form, publisher: e.target.value })} />
            </div>
            <div className="owlet-field">
              <label>Published Date</label>
              <input value={form.publishedDate}
                onChange={e => setForm({ ...form, publishedDate: e.target.value })} />
            </div>
          </div>

          {/* External URL — for non-native items */}
          {form.source !== 'native' && (
            <div className="owlet-field">
              <label>Catalog Link</label>
              <input value={(form as any).externalUrl || ''}
                onChange={e => setForm({ ...form, ...(form as any), externalUrl: e.target.value } as any)}
                placeholder="https://catalog.library.org/record/12345" />
            </div>
          )}

          <div className="owlet-field">
            <label>Description</label>
            <textarea value={form.summary}
              onChange={e => setForm({ ...form, summary: e.target.value })}
              rows={4} />
          </div>

          <ImageUpload
            currentUrl={form.coverUrl}
            currentAlt={form.coverAlt}
            onUpload={(url, alt) => setForm({ ...form, coverUrl: url, coverAlt: alt || '' })}
            label="Cover Image"
            size="small"
          />

          {/* Subjects */}
          <div className="owlet-field" style={{ marginTop: '0.75rem' }}>
            <label>Subjects / Tags</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.4rem' }}>
              {form.subjects.map(s => (
                <span key={s} className="owlet-book-subject" style={{ cursor: 'pointer' }}
                  onClick={() => removeSubject(s)}>
                  {s} ✕
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <input
                value={subjectInput}
                onChange={e => setSubjectInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubject(subjectInput); } }}
                placeholder="Add subject..."
                style={{ flex: 1, border: '1px solid var(--cream-dark)', borderRadius: '6px', padding: '0.4rem 0.6rem', fontSize: '0.85rem', fontFamily: 'Source Serif 4, serif' }}
              />
              <button type="button" className="owlet-btn-action owlet-btn-edit"
                onClick={() => addSubject(subjectInput)}>Add</button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
            <input type="checkbox" id="itemVisible"
              checked={form.isVisible}
              onChange={e => setForm({ ...form, isVisible: e.target.checked })} />
            <label htmlFor="itemVisible"
              style={{ fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'Source Serif 4, serif' }}>
              Visible on public site
            </label>
          </div>

          <div className="owlet-form-actions" style={{ marginTop: '1.5rem' }}>
            <button type="submit" className="owlet-btn owlet-btn-primary" style={{ width: 'auto' }}>
              {editingItem ? 'Save Changes' : 'Add to Catalog'} 📚
            </button>
            <button type="button" className="owlet-btn owlet-btn-ghost" onClick={handleCancelItem}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── COPIES PANEL ── */}
      {view === 'items' && itemMode === 'copies' && copiesItem && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <button className="owlet-btn owlet-btn-ghost" style={{ width: 'auto' }}
              onClick={() => { setItemMode('list'); setCopiesItem(null); setCopies([]); }}>
              ← Back
            </button>
            <div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', color: 'var(--purple-deep)', margin: 0 }}>
                {copiesItem.title}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--ink-light)', margin: 0 }}>
                {copies.length} cop{copies.length !== 1 ? 'ies' : 'y'}
                {copies.filter(c => c.status === 'available').length > 0 && (
                  <span style={{ color: 'var(--teal)' }}>
                    {' '}· {copies.filter(c => c.status === 'available').length} available
                  </span>
                )}
              </p>
            </div>
            <button className="owlet-btn owlet-btn-ghost" style={{ width: 'auto', marginLeft: 'auto' }}
              onClick={() => handleEditItem(copiesItem)}>
              ✏️ Edit Item
            </button>
          </div>

          {/* Copies list */}
          {copies.length > 0 && (
            <div className="owlet-admin-list" style={{ marginBottom: '1.5rem' }}>
              {copies.map(copy => (
                <div key={copy.id} className="owlet-admin-item">
                  <div className="owlet-admin-item-info" style={{ flex: 1 }}>
                    <h3>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.95rem' }}>
                        {copy.barcode}
                      </span>
                      <span style={{
                        fontSize: '0.72rem',
                        color: 'var(--white)',
                        background: copyStatusColor(copy.status),
                        borderRadius: '4px',
                        padding: '1px 6px',
                        marginLeft: '0.5rem',
                        textTransform: 'capitalize',
                      }}>
                        {copy.status.replace('_', ' ')}
                      </span>
                    </h3>
                    <p>
                      <span style={{ textTransform: 'capitalize' }}>{copy.condition} condition</span>
                      {copy.location && ` · ${copy.location}`}
                      {copy.shelfLocation && ` · ${copy.shelfLocation}`}
                      {copy.notes && ` · ${copy.notes}`}
                    </p>
                  </div>
                  <div className="owlet-admin-item-actions">
                    <button className="owlet-btn-action owlet-btn-edit"
                      onClick={() => {
                        setCopyForm({
                          barcode: copy.barcode,
                          location: copy.location || '',
                          shelfLocation: copy.shelfLocation || '',
                          condition: copy.condition,
                          status: copy.status,
                          notes: copy.notes || '',
                        });
                        setEditingCopyId(copy.id);
                      }}>
                      ✏️ Edit
                    </button>
                    {isAdmin && (
                      <button className="owlet-btn-action owlet-btn-delete"
                        onClick={() => handleDeleteCopy(copy.id)}>
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add / edit copy form */}
          <form className="owlet-admin-form" onSubmit={handleSaveCopy}
            style={{ background: 'var(--cream)', border: '1px solid var(--cream-dark)' }}>
            <h4 style={{ fontFamily: 'Playfair Display, serif', color: 'var(--purple-deep)', marginBottom: '1rem' }}>
              {editingCopyId ? '✏️ Edit Copy' : '+ Add Copy'}
            </h4>
            <div className="owlet-field-row">
              <div className="owlet-field">
                <label>
                  Barcode
                  <span style={{ fontWeight: 300, textTransform: 'none', fontSize: '0.75rem' }}>
                    {' '}(leave blank to auto-generate)
                  </span>
                </label>
                <input value={copyForm.barcode}
                  onChange={e => setCopyForm({ ...copyForm, barcode: e.target.value })}
                  placeholder="OWL000001"
                  autoFocus />
              </div>
              <div className="owlet-field">
                <label>Condition</label>
                <select className="owlet-select" value={copyForm.condition}
                  onChange={e => setCopyForm({ ...copyForm, condition: e.target.value })}>
                  {CONDITIONS.map(c => (
                    <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="owlet-field-row">
              <div className="owlet-field">
                <label>Location</label>
                <input value={copyForm.location}
                  onChange={e => setCopyForm({ ...copyForm, location: e.target.value })}
                  placeholder="Main Branch" />
              </div>
              <div className="owlet-field">
                <label>Shelf Location</label>
                <input value={copyForm.shelfLocation}
                  onChange={e => setCopyForm({ ...copyForm, shelfLocation: e.target.value })}
                  placeholder="FIC ATW" />
              </div>
            </div>
            {editingCopyId && (
              <div className="owlet-field">
                <label>Status</label>
                <select className="owlet-select" value={copyForm.status}
                  onChange={e => setCopyForm({ ...copyForm, status: e.target.value })}>
                  {COPY_STATUSES.map(s => (
                    <option key={s} value={s} style={{ textTransform: 'capitalize' }}>
                      {s.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="owlet-field">
              <label>Notes</label>
              <input value={copyForm.notes}
                onChange={e => setCopyForm({ ...copyForm, notes: e.target.value })}
                placeholder="Ex libris sticker, library binding..." />
            </div>
            <div className="owlet-form-actions">
              <button type="submit" className="owlet-btn owlet-btn-primary" style={{ width: 'auto' }}>
                {editingCopyId ? 'Save Copy' : 'Add Copy'}
              </button>
              {editingCopyId && (
                <button type="button" className="owlet-btn owlet-btn-ghost"
                  onClick={() => { setCopyForm(emptyCopy); setEditingCopyId(null); }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ── SYNC HISTORY ── */}
      {view === 'sync' && (
        <div className="owlet-admin-list">
          {syncLogs.length === 0
            ? <div className="owlet-empty"><p>No sync history yet.</p></div>
            : syncLogs.map(log => (
              <div key={log.id}
                className={`owlet-admin-item ${log.error ? 'owlet-sync-error' : ''}`}>
                <div className="owlet-admin-item-info">
                  <h3>
                    {log.error ? '❌' : '✅'} {log.provider}
                    <span className="owlet-catalog-source" style={{ marginLeft: '0.5rem' }}>
                      {log.trigger}
                    </span>
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
      {view === 'circulation' && <CirculationTab />}
      {view === 'holds' && <HoldsTab />}
    </div>
  );
}
