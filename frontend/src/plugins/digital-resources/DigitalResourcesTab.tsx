import { useState, useEffect } from 'react';
import { useAuth } from '../../core/auth/AuthContext';
import api from '../../api';
import ImageUpload from '../../core/components/ImageUpload';
import MediaPicker from '../../core/media/MediaPicker';

interface DigitalResource {
  id: number;
  title: string;
  slug: string;
  description?: string;
  url?: string;
  mediaId?: number;
  category: string;
  icon?: string;
  accessInstructions?: string;
  coverUrl?: string;
  coverAlt?: string;
  tags?: string[];
  isVisible: boolean;
  requiresCardNumber: boolean;
}

const CATEGORIES = [
  { value: 'ebook', label: '📚 eBooks' },
  { value: 'database', label: '🗃️ Databases' },
  { value: 'streaming', label: '🎬 Streaming' },
  { value: 'tool', label: '🔧 Tools' },
  { value: 'local', label: '📍 Local Resources' },
  { value: 'government', label: '🏛️ Government' },
  { value: 'other', label: '📎 Other' },
];

const emptyResource = {
  title: '',
  slug: '',
  description: '',
  url: '',
  mediaId: undefined as number | undefined,
  category: 'other',
  icon: '',
  accessInstructions: '',
  coverUrl: '',
  coverAlt: '',
  tags: [] as string[],
  isVisible: true,
  requiresCardNumber: false,
};

export default function DigitalResourcesTab() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const authHeader = { headers: { Authorization: `Bearer ${user?.token}` } };

  const [resources, setResources] = useState<DigitalResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyResource);
  const [tagInput, setTagInput] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [selectedMediaName, setSelectedMediaName] = useState('');

  useEffect(() => { fetchResources(); }, []);

  const fetchResources = () => {
    setLoading(true);
    api.get('/digital-resources/admin/all', authHeader)
      .then(res => setResources(res.data))
      .finally(() => setLoading(false));
  };

  const notify = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(''); }
    else { setSuccess(msg); setError(''); }
    setTimeout(() => { setSuccess(''); setError(''); }, 4000);
  };

  const handleEdit = (resource: DigitalResource) => {
    setForm({
      title: resource.title,
      slug: resource.slug,
      description: resource.description || '',
      url: resource.url || '',
      mediaId: resource.mediaId,
      category: resource.category,
      icon: resource.icon || '',
      accessInstructions: resource.accessInstructions || '',
      coverUrl: resource.coverUrl || '',
      coverAlt: resource.coverAlt || '',
      tags: resource.tags || [],
      isVisible: resource.isVisible,
      requiresCardNumber: resource.requiresCardNumber,
    });
    setSelectedMediaName(''); // reset — will show "File #X" until browsed
    setEditingId(resource.id);
    setMode('edit');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this resource?')) return;
    try {
      await api.delete(`/digital-resources/${id}`, authHeader);
      notify('Resource deleted.');
      fetchResources();
    } catch {
      notify('Failed to delete.', true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.patch(`/digital-resources/${editingId}`, form, authHeader);
        notify('Resource updated! 🎉');
      } else {
        await api.post('/digital-resources', form, authHeader);
        notify('Resource created! 🎉');
      }
      setMode('list');
      setEditingId(null);
      setForm(emptyResource);
      fetchResources();
    } catch {
      notify('Something went wrong.', true);
    }
  };

  const handleCancel = () => {
    setMode('list');
    setEditingId(null);
    setForm(emptyResource);
    setTagInput('');
  };

  const addTag = (tag: string) => {
    if (!tag.trim()) return;
    if (!form.tags.includes(tag.trim())) {
      setForm({ ...form, tags: [...form.tags, tag.trim()] });
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setForm({ ...form, tags: form.tags.filter(t => t !== tag) });
  };

  const filtered = filterCategory
    ? resources.filter(r => r.category === filterCategory)
    : resources;

  return (
    <div>
      {success && <div className="owlet-alert owlet-alert-success">{success}</div>}
      {error && <div className="owlet-alert owlet-alert-error">{error}</div>}

      {/* ── LIST ── */}
      {mode === 'list' && (
        <>
          <div className="owlet-catalog-filters" style={{ marginBottom: '1rem' }}>
            <select
              className="owlet-select owlet-select-sm"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="">All categories</option>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <button
              className="owlet-btn owlet-btn-primary owlet-btn-new"
              onClick={() => { setForm(emptyResource); setMode('create'); }}
            >
              + New Resource
            </button>
          </div>

          <div className="owlet-admin-list">
            {loading ? (
              <div className="owlet-loading"><span /><span /><span /></div>
            ) : filtered.length === 0 ? (
              <div className="owlet-empty">
                <p>No digital resources yet.</p>
              </div>
            ) : filtered.map(resource => (
              <div key={resource.id} className={`owlet-admin-item ${!resource.isVisible ? 'owlet-catalog-item-hidden' : ''}`}>
                <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>
                  {resource.icon || CATEGORIES.find(c => c.value === resource.category)?.label.split(' ')[0] || '📎'}
                </div>
                <div className="owlet-admin-item-info" style={{ flex: 1, minWidth: 0 }}>
                  <h3>
                    {resource.title}
                    {!resource.isVisible && <span className="owlet-catalog-hidden-badge">hidden</span>}
                    {resource.requiresCardNumber && <span className="owlet-catalog-hidden-badge" style={{ background: 'var(--teal)' }}>card required</span>}
                  </h3>
                  <p>
                    <span className="owlet-catalog-source">{resource.category}</span>
                    {resource.url && ` · ${resource.url}`}
                    {resource.mediaId && ` · uploaded file #${resource.mediaId}`}
                  </p>
                </div>
                <div className="owlet-admin-item-actions">
                  <button className="owlet-btn-action owlet-btn-edit"
                    onClick={() => handleEdit(resource)}>✏️ Edit</button>
                  {isAdmin && (
                    <button className="owlet-btn-action owlet-btn-delete"
                      onClick={() => handleDelete(resource.id)}>🗑️</button>
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
            {editingId ? '✏️ Edit Resource' : '📎 New Digital Resource'}
          </h3>

          <p className="owlet-form-section-label">Basic Info</p>
          <div className="owlet-field-row">
            <div className="owlet-field">
              <label>Title</label>
              <input value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="OverDrive / Libby" required />
            </div>
            <div className="owlet-field">
              <label>Slug</label>
              <input value={form.slug}
                onChange={e => setForm({ ...form, slug: e.target.value })}
                placeholder="overdrive-libby" required />
            </div>
          </div>
          <div className="owlet-field-row">
            <div className="owlet-field">
              <label>Category</label>
              <select className="owlet-select" value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="owlet-field">
              <label>Icon <span style={{ fontWeight: 300, textTransform: 'none', fontSize: '0.75rem' }}>(emoji)</span></label>
              <input value={form.icon}
                onChange={e => setForm({ ...form, icon: e.target.value })}
                placeholder="📚" />
            </div>
          </div>
          <div className="owlet-field">
            <label>Description</label>
            <textarea value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3} placeholder="What is this resource?" />
          </div>

          <p className="owlet-form-section-label" style={{ marginTop: '1rem' }}>Access</p>
          <div className="owlet-field">
            <label>External URL <span style={{ fontWeight: 300, textTransform: 'none', fontSize: '0.75rem' }}>(for online resources)</span></label>
            <input value={form.url}
              onChange={e => setForm({ ...form, url: e.target.value })}
              placeholder="https://libbyapp.com/..." />
          </div>
          <div className="owlet-field">
            <label>Media File <span style={{ fontWeight: 300, textTransform: 'none', fontSize: '0.75rem' }}>(for uploaded files like PDFs)</span></label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {form.mediaId ? (
                <div style={{ flex: 1, padding: '0.6rem 1rem', background: 'var(--cream)', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid var(--cream-dark)' }}>
                  📁 {selectedMediaName || `File #${form.mediaId}`}
                </div>
              ) : (
                <div style={{ flex: 1, padding: '0.6rem 1rem', background: 'var(--cream)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--ink-light)', border: '1px solid var(--cream-dark)' }}>
                  No file selected
                </div>
              )}
              <button
                type="button"
                className="owlet-btn-action owlet-btn-edit"
                onClick={() => setShowMediaPicker(true)}
              >
                📁 Browse
              </button>
              {form.mediaId && (
                <button
                  type="button"
                  className="owlet-btn-action owlet-btn-delete"
                  onClick={() => { setForm({ ...form, mediaId: undefined }); setSelectedMediaName(''); }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <div className="owlet-field">
            <label>Access Instructions</label>
            <textarea value={form.accessInstructions}
              onChange={e => setForm({ ...form, accessInstructions: e.target.value })}
              rows={2} placeholder="Sign in with your library card number..." />
          </div>

          <p className="owlet-form-section-label" style={{ marginTop: '1rem' }}>Appearance</p>
          <ImageUpload
            currentUrl={form.coverUrl}
            currentAlt={form.coverAlt}
            onUpload={(url, alt) => setForm({ ...form, coverUrl: url, coverAlt: alt || '' })}
            label="Cover / Thumbnail"
            size="medium"
          />

          <div className="owlet-field" style={{ marginTop: '0.75rem' }}>
            <label>Tags</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.4rem' }}>
              {form.tags.map(tag => (
                <span key={tag} className="owlet-book-subject" style={{ cursor: 'pointer' }}
                  onClick={() => removeTag(tag)}>
                  {tag} ✕
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } }}
                placeholder="Add tag..."
                style={{ flex: 1, border: '1px solid var(--cream-dark)', borderRadius: '6px', padding: '0.4rem 0.6rem', fontSize: '0.85rem', fontFamily: 'Source Serif 4, serif' }}
              />
              <button type="button" className="owlet-btn-action owlet-btn-edit"
                onClick={() => addTag(tagInput)}>Add</button>
            </div>
          </div>

          <p className="owlet-form-section-label" style={{ marginTop: '1rem' }}>Settings</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" id="drIsVisible"
                checked={form.isVisible}
                onChange={e => setForm({ ...form, isVisible: e.target.checked })} />
              <label htmlFor="drIsVisible"
                style={{ fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'Source Serif 4, serif' }}>
                Visible on public site
              </label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" id="drCardRequired"
                checked={form.requiresCardNumber}
                onChange={e => setForm({ ...form, requiresCardNumber: e.target.checked })} />
              <label htmlFor="drCardRequired"
                style={{ fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'Source Serif 4, serif' }}>
                Requires library card number
              </label>
            </div>
          </div>

          <div className="owlet-form-actions" style={{ marginTop: '1.5rem' }}>
            <button type="submit" className="owlet-btn owlet-btn-primary" style={{ width: 'auto' }}>
              {editingId ? 'Save Changes' : 'Create Resource'} 📎
            </button>
            <button type="button" className="owlet-btn owlet-btn-ghost" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </form>
      )}
      {showMediaPicker && (
        <MediaPicker
          onSelect={(url, item) => {
            setForm({ ...form, mediaId: item.id });
            setSelectedMediaName(item.title || item.originalName);
            setShowMediaPicker(false);
          }}
          onClose={() => setShowMediaPicker(false)}
        />
      )}
    </div>
  );
}
