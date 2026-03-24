import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../core/auth/AuthContext';
import api from '../../api';
import ImageUpload from '../../core/components/ImageUpload';

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
  isVisible: boolean;
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

const emptyForm = {
  title: '', author: '', isbn: '', publisher: '',
  publishedDate: '', summary: '', coverUrl: '', coverAlt: '',
  format: 'book', subjects: [] as string[], isVisible: true,
};

const emptyCopy = {
  barcode: '', location: '', shelfLocation: '',
  condition: 'good', notes: '',
};

type Mode = 'list' | 'create' | 'edit' | 'copies';

export default function NativeCatalogTab() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const authHeader = { headers: { Authorization: `Bearer ${user?.token}` } };

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('list');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [subjectInput, setSubjectInput] = useState('');

  // ISBN lookup
  const [isbnInput, setIsbnInput] = useState('');
  const [isbnLoading, setIsbnLoading] = useState(false);
  const [isbnFound, setIsbnFound] = useState(false);
  const isbnRef = useRef<HTMLInputElement>(null);

  // Copies
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [copies, setCopies] = useState<NativeCopy[]>([]);
  const [copyForm, setCopyForm] = useState(emptyCopy);
  const [editingCopyId, setEditingCopyId] = useState<number | null>(null);

  // Search
  const [search, setSearch] = useState('');

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { fetchItems(); }, []);
  useEffect(() => { fetchItems(); }, [search]);

  const fetchItems = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('source', 'native');
    if (search) params.set('search', search);
    api.get(`/catalog?${params.toString()}`)
      .then(res => setItems(res.data))
      .finally(() => setLoading(false));
  };

  const fetchCopies = (itemId: number) => {
    api.get(`/catalog/copies/item/${itemId}`, authHeader)
      .then(res => setCopies(res.data));
  };

  const notify = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(''); }
    else { setSuccess(msg); setError(''); }
    setTimeout(() => { setSuccess(''); setError(''); }, 4000);
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
  const handleEdit = (item: CatalogItem) => {
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
    });
    setEditingId(item.id);
    setMode('edit');
  };

  const handleViewCopies = (item: CatalogItem) => {
    setSelectedItem(item);
    setCopyForm(emptyCopy);
    setEditingCopyId(null);
    fetchCopies(item.id);
    setMode('copies');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { ...form, source: 'native' };
      if (editingId) {
        await api.patch(`/catalog/${editingId}`, data, authHeader);
        notify('Item saved!');
      } else {
        await api.post('/catalog', data, authHeader);
        notify('Item created! 📚');
      }
      handleCancel();
      fetchItems();
    } catch {
      notify('Something went wrong.', true);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this item and all its copies?')) return;
    try {
      await api.delete(`/catalog/${id}`, authHeader);
      notify('Item deleted.');
      fetchItems();
    } catch {
      notify('Failed to delete.', true);
    }
  };

  const handleCancel = () => {
    setMode('list');
    setEditingId(null);
    setForm(emptyForm);
    setIsbnInput('');
    setIsbnFound(false);
    setSubjectInput('');
  };

  // ── Copy CRUD ──
  const handleSaveCopy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      if (editingCopyId) {
        await api.patch(`/catalog/copies/${editingCopyId}`, copyForm, authHeader);
        notify('Copy updated!');
      } else {
        await api.post('/catalog/copies', { ...copyForm, itemId: selectedItem.id }, authHeader);
        notify('Copy added!');
      }
      setCopyForm(emptyCopy);
      setEditingCopyId(null);
      fetchCopies(selectedItem.id);
    } catch {
      notify('Failed to save copy.', true);
    }
  };

  const handleDeleteCopy = async (copyId: number) => {
    if (!confirm('Delete this copy?')) return;
    try {
      await api.delete(`/catalog/copies/${copyId}`, authHeader);
      notify('Copy deleted.');
      if (selectedItem) fetchCopies(selectedItem.id);
    } catch {
      notify('Failed to delete copy.', true);
    }
  };

  const addSubject = (s: string) => {
    if (!s.trim() || form.subjects.includes(s.trim())) return;
    setForm(prev => ({ ...prev, subjects: [...prev.subjects, s.trim()] }));
    setSubjectInput('');
  };

  const removeSubject = (s: string) => {
    setForm(prev => ({ ...prev, subjects: prev.subjects.filter(x => x !== s) }));
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'available': return 'var(--teal)';
      case 'checked_out': return 'var(--amber)';
      case 'on_hold': return 'var(--purple-mid)';
      case 'lost': return '#c0392b';
      default: return 'var(--ink-light)';
    }
  };

  return (
    <div>
      {success && <div className="owlet-alert owlet-alert-success">{success}</div>}
      {error && <div className="owlet-alert owlet-alert-error">{error}</div>}

      {/* ── LIST ── */}
      {mode === 'list' && (
        <>
          <div className="owlet-catalog-filters">
            <input
              className="owlet-catalog-search"
              placeholder="Search native catalog..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button
              className="owlet-btn owlet-btn-primary owlet-btn-new"
              onClick={() => { setForm(emptyForm); setIsbnInput(''); setMode('create'); }}
            >
              + Add Item
            </button>
          </div>

          <div className="owlet-admin-list">
            {loading ? (
              <div className="owlet-loading"><span /><span /><span /></div>
            ) : items.length === 0 ? (
              <div className="owlet-empty">
                <p>No native catalog items yet — add your first item!</p>
              </div>
            ) : items.map(item => (
              <div key={item.id} className={`owlet-admin-item ${!item.isVisible ? 'owlet-catalog-item-hidden' : ''}`}>
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
                      {FORMATS.find(f => f.value === item.format)?.label || item.format}
                    </span>
                  </h3>
                  <p>
                    {item.author && <span>{item.author}</span>}
                    {item.isbn && <span> · ISBN: {item.isbn}</span>}
                  </p>
                </div>
                <div className="owlet-admin-item-actions">
                  <button className="owlet-btn-action owlet-btn-edit"
                    onClick={() => handleViewCopies(item)}>
                    📋 Copies
                  </button>
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
            ))}
          </div>
        </>
      )}

      {/* ── CREATE / EDIT FORM ── */}
      {(mode === 'create' || mode === 'edit') && (
        <form className="owlet-admin-form" onSubmit={handleSubmit}>
          <h3 className="owlet-form-title">
            {editingId ? '✏️ Edit Item' : '📚 Add Item'}
          </h3>

          {/* ISBN lookup — only on create */}
          {mode === 'create' && (
            <div className="owlet-isbn-lookup">
              <p className="owlet-form-section-label">ISBN Lookup</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  ref={isbnRef}
                  className="owlet-catalog-search"
                  placeholder="Scan or enter ISBN..."
                  value={isbnInput}
                  onChange={e => setIsbnInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleIsbnLookup(); } }}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="owlet-btn owlet-btn-primary"
                  style={{ width: 'auto' }}
                  onClick={handleIsbnLookup}
                  disabled={isbnLoading}
                >
                  {isbnLoading ? '⏳ Looking up...' : '🔍 Look Up'}
                </button>
              </div>
              {isbnFound && (
                <p style={{ fontSize: '0.8rem', color: 'var(--teal)', marginTop: '0.4rem' }}>
                  ✓ Data loaded — review and edit below
                </p>
              )}
              <p style={{ fontSize: '0.75rem', color: 'var(--ink-light)', marginTop: '0.25rem' }}>
                Or fill in manually below
              </p>
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
              {editingId ? 'Save Changes' : 'Add to Catalog'} 📚
            </button>
            <button type="button" className="owlet-btn owlet-btn-ghost" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── COPIES VIEW ── */}
      {mode === 'copies' && selectedItem && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <button className="owlet-btn owlet-btn-ghost" style={{ width: 'auto' }}
              onClick={() => { setMode('list'); setSelectedItem(null); }}>
              ← Back
            </button>
            <div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', color: 'var(--purple-deep)', margin: 0 }}>
                {selectedItem.title}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--ink-light)', margin: 0 }}>
                {copies.length} cop{copies.length !== 1 ? 'ies' : 'y'}
              </p>
            </div>
          </div>

          {/* Copies list */}
          {copies.length > 0 && (
            <div className="owlet-admin-list" style={{ marginBottom: '1.5rem' }}>
              {copies.map(copy => (
                <div key={copy.id} className="owlet-admin-item">
                  <div className="owlet-admin-item-info" style={{ flex: 1 }}>
                    <h3>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                        {copy.barcode}
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--white)',
                        background: statusColor(copy.status),
                        borderRadius: '4px',
                        padding: '1px 6px',
                        marginLeft: '0.5rem',
                        textTransform: 'capitalize',
                      }}>
                        {copy.status.replace('_', ' ')}
                      </span>
                    </h3>
                    <p>
                      {copy.condition} condition
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
                <label>Barcode <span style={{ fontWeight: 300, textTransform: 'none', fontSize: '0.75rem' }}>(leave blank to auto-generate)</span></label>
                <input value={copyForm.barcode}
                  onChange={e => setCopyForm({ ...copyForm, barcode: e.target.value })}
                  placeholder="OWL000001" />
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
    </div>
  );
}
