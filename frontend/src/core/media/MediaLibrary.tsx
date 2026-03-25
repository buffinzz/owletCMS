import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import api from '../../api';

interface MediaItem {
  id: number;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  title?: string;
  description?: string;
  alt?: string;
  url?: string;
  tags?: string[];
  ocrText?: string;
  isIndexed: boolean;
  createdAt: string;
  uploadedBy?: number;
}

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'image' | 'document' | 'audio' | 'video' | 'external';

interface MediaLibraryProps {
  pickerMode?: boolean;
  onSelect?: (url: string, item: MediaItem) => void;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return 'External';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isExternal(item: MediaItem): boolean {
  return item.filename === 'external' || !!item.url;
}

function getEffectiveUrl(item: MediaItem): string {
  if (item.url) return item.url;
  return `http://localhost:3000/media/file/${item.filename}`;
}

function getFileType(item: MediaItem): FilterType {
  if (isExternal(item)) return 'external';
  if (item.mimetype.startsWith('image/')) return 'image';
  if (item.mimetype.startsWith('audio/')) return 'audio';
  if (item.mimetype.startsWith('video/')) return 'video';
  return 'document';
}

function getFileIcon(item: MediaItem): string {
  if (item.mimetype.startsWith('video/') || /youtube|vimeo/.test(item.url || '')) return '🎬';
  if (item.mimetype.startsWith('audio/')) return '🎵';
  if (item.mimetype.startsWith('image/')) return '🖼️';
  if (item.mimetype.includes('pdf')) return '📄';
  if (item.mimetype.includes('word')) return '📝';
  if (item.url) return '🔗';
  return '📁';
}

function isImageItem(item: MediaItem): boolean {
  if (item.url) return item.mimetype.startsWith('image/');
  return item.mimetype.startsWith('image/');
}

const EXTERNAL_TYPES = [
  { value: 'video/external', label: '🎬 Video (YouTube, Vimeo)' },
  { value: 'image/external', label: '🖼️ External Image' },
  { value: 'audio/external', label: '🎵 Audio Stream' },
  { value: 'application/pdf', label: '📄 PDF (external)' },
  { value: 'text/uri-list', label: '🔗 General URL' },
];

const emptyExternalForm = {
  url: '', title: '', alt: '', description: '', mimetype: 'text/uri-list',
};

export default function MediaLibrary({ pickerMode = false, onSelect }: MediaLibraryProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [reindexing, setReindexing] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  // External URL form
  const [showExternalForm, setShowExternalForm] = useState(false);
  const [externalForm, setExternalForm] = useState(emptyExternalForm);
  const [savingExternal, setSavingExternal] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const authHeader = { headers: { Authorization: `Bearer ${user?.token}` } };

  useEffect(() => { fetchMedia(); }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchMedia(search), 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  const fetchMedia = (q?: string) => {
    setLoading(true);
    const params = q ? `?search=${encodeURIComponent(q)}` : '';
    api.get(`/media${params}`, authHeader)
      .then(res => setItems(res.data))
      .catch(() => setError('Failed to load media.'))
      .finally(() => setLoading(false));
  };

  const notify = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(''); }
    else { setSuccess(msg); setError(''); }
    setTimeout(() => { setSuccess(''); setError(''); }, 4000);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/media/upload', formData, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      notify('File uploaded! 🎉');
      fetchMedia(search);
    } catch {
      notify('Upload failed.', true);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleAddExternal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!externalForm.url.trim()) return;
    setSavingExternal(true);
    try {
      await api.post('/media/external', externalForm, authHeader);
      notify('External URL added! 🔗');
      setExternalForm(emptyExternalForm);
      setShowExternalForm(false);
      fetchMedia(search);
    } catch {
      notify('Failed to add external URL.', true);
    } finally {
      setSavingExternal(false);
    }
  };

  const handleDelete = async (item: MediaItem) => {
    if (!confirm(`Delete "${item.title || item.originalName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/media/${item.id}`, authHeader);
      notify('Deleted.');
      if (selected?.id === item.id) setSelected(null);
      if (editingItem?.id === item.id) setEditingItem(null);
      fetchMedia(search);
    } catch {
      notify('Failed to delete.', true);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    try {
      await api.patch(`/media/${editingItem.id}`, {
        title: editingItem.title,
        alt: editingItem.alt,
        description: editingItem.description,
        tags: editingItem.tags,
        url: editingItem.url,
      }, authHeader);
      notify('Saved!');
      setSelected(editingItem);
      setEditingItem(null);
      fetchMedia(search);
    } catch {
      notify('Failed to save.', true);
    }
  };

  const handleReindex = async (item: MediaItem) => {
    if (isExternal(item)) return;
    setReindexing(item.id);
    try {
      const res = await api.post(`/media/${item.id}/reindex`, {}, authHeader);
      notify(`Reindexed! ${res.data.ocrText ? res.data.ocrText.length + ' chars extracted' : 'No text found'}`);
      fetchMedia(search);
      if (selected?.id === item.id) setSelected(res.data);
    } catch {
      notify('Reindex failed.', true);
    } finally {
      setReindexing(null);
    }
  };

  const handleCopyUrl = (item: MediaItem) => {
    navigator.clipboard.writeText(getEffectiveUrl(item));
    setCopied(item.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSelect = (item: MediaItem) => {
    if (pickerMode && onSelect) {
      onSelect(getEffectiveUrl(item), item);
    } else {
      setSelected(selected?.id === item.id ? null : item);
      setEditingItem(null);
    }
  };

  const addTag = (tag: string) => {
    if (!editingItem || !tag.trim()) return;
    const tags = editingItem.tags || [];
    if (!tags.includes(tag.trim())) {
      setEditingItem({ ...editingItem, tags: [...tags, tag.trim()] });
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    if (!editingItem) return;
    setEditingItem({ ...editingItem, tags: (editingItem.tags || []).filter(t => t !== tag) });
  };

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    return getFileType(item) === filter;
  });

  const FILTERS: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: '🖼️ Images', value: 'image' },
    { label: '📄 Documents', value: 'document' },
    { label: '🎵 Audio', value: 'audio' },
    { label: '🎬 Video', value: 'video' },
    { label: '🔗 External', value: 'external' },
  ];

  return (
    <div className="owlet-media-library">
      {/* Toolbar */}
      <div className="owlet-media-toolbar">
        <input
          className="owlet-catalog-search"
          placeholder="Search filenames, content, tags..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        <div className="owlet-media-filters">
          {FILTERS.map(f => (
            <button
              key={f.value}
              className={`owlet-media-filter ${filter === f.value ? 'active' : ''}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="owlet-media-toolbar-right">
          <button
            className={`owlet-media-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')} title="Grid view">⊞</button>
          <button
            className={`owlet-media-view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')} title="List view">☰</button>
          <button
            className="owlet-btn owlet-btn-ghost"
            style={{ width: 'auto' }}
            onClick={() => { setShowExternalForm(!showExternalForm); }}
          >
            🔗 Add URL
          </button>
          <button
            className="owlet-btn owlet-btn-primary owlet-btn-new"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : '+ Upload'}
          </button>
          <input ref={inputRef} type="file" onChange={handleUpload} style={{ display: 'none' }} />
        </div>
      </div>

      {/* External URL form */}
      {showExternalForm && (
        <form
          className="owlet-external-url-form"
          onSubmit={handleAddExternal}
        >
          <h4 style={{ fontFamily: 'Playfair Display, serif', color: 'var(--purple-deep)', marginBottom: '0.75rem' }}>
            🔗 Add External Media URL
          </h4>
          <div className="owlet-field-row">
            <div className="owlet-field" style={{ flex: 2 }}>
              <label>URL *</label>
              <input
                value={externalForm.url}
                onChange={e => setExternalForm({ ...externalForm, url: e.target.value })}
                placeholder="https://youtube.com/watch?v=... or https://example.com/image.jpg"
                required
                autoFocus
              />
            </div>
            <div className="owlet-field">
              <label>Type</label>
              <select
                className="owlet-select"
                value={externalForm.mimetype}
                onChange={e => setExternalForm({ ...externalForm, mimetype: e.target.value })}
              >
                {EXTERNAL_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="owlet-field-row">
            <div className="owlet-field">
              <label>Title</label>
              <input
                value={externalForm.title}
                onChange={e => setExternalForm({ ...externalForm, title: e.target.value })}
                placeholder="Display name"
              />
            </div>
            <div className="owlet-field">
              <label>Alt Text</label>
              <input
                value={externalForm.alt}
                onChange={e => setExternalForm({ ...externalForm, alt: e.target.value })}
                placeholder="Accessible description"
              />
            </div>
          </div>
          <div className="owlet-field">
            <label>Description</label>
            <input
              value={externalForm.description}
              onChange={e => setExternalForm({ ...externalForm, description: e.target.value })}
              placeholder="Optional description"
            />
          </div>
          <div className="owlet-form-actions">
            <button
              type="submit"
              className="owlet-btn owlet-btn-primary"
              style={{ width: 'auto' }}
              disabled={savingExternal}
            >
              {savingExternal ? 'Adding...' : 'Add URL 🔗'}
            </button>
            <button
              type="button"
              className="owlet-btn owlet-btn-ghost"
              onClick={() => { setShowExternalForm(false); setExternalForm(emptyExternalForm); }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {success && <div className="owlet-alert owlet-alert-success">{success}</div>}
      {error && <div className="owlet-alert owlet-alert-error">{error}</div>}

      {search && (
        <p style={{ fontSize: '0.8rem', color: 'var(--ink-light)', marginBottom: '0.5rem' }}>
          {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} for "{search}"
        </p>
      )}

      <div className="owlet-media-body">
        <div className="owlet-media-main">
          {loading ? (
            <div className="owlet-loading"><span /><span /><span /></div>
          ) : filteredItems.length === 0 ? (
            <div className="owlet-empty">
              <div className="owlet-empty-icon">📁</div>
              <p>{search ? `No files matching "${search}"` : 'No files yet.'}</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="owlet-media-grid">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  className={`owlet-media-item ${selected?.id === item.id ? 'selected' : ''}`}
                  onClick={() => handleSelect(item)}
                >
                  <div className="owlet-media-thumb">
                    {isImageItem(item) ? (
                      <img src={getEffectiveUrl(item)} alt={item.alt || item.originalName} />
                    ) : (
                      <div className="owlet-media-icon">{getFileIcon(item)}</div>
                    )}
                    {isExternal(item) && (
                      <span className="owlet-media-external-badge" title="External URL">🔗</span>
                    )}
                    {item.isIndexed && !isExternal(item) && (
                      <span className="owlet-media-indexed-badge" title="Content indexed">🔍</span>
                    )}
                    {pickerMode && <div className="owlet-media-select-overlay">Select</div>}
                  </div>
                  <p className="owlet-media-name">{item.title || item.originalName}</p>
                  <p className="owlet-media-meta">{formatSize(item.size)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="owlet-admin-list">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  className={`owlet-admin-item ${selected?.id === item.id ? 'owlet-admin-item-selected' : ''}`}
                  onClick={() => handleSelect(item)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{getFileIcon(item)}</span>
                    <div className="owlet-admin-item-info" style={{ flex: 1, minWidth: 0 }}>
                      <h3>
                        {item.title || item.originalName}
                        {isExternal(item) && <span className="owlet-catalog-source" style={{ marginLeft: '0.4rem' }}>external</span>}
                        {item.isIndexed && !isExternal(item) && <span className="owlet-media-indexed-badge"> 🔍</span>}
                      </h3>
                      <p style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {isExternal(item) ? item.url : `${formatSize(item.size)} · ${item.mimetype}`}
                      </p>
                    </div>
                  </div>
                  <div className="owlet-admin-item-actions">
                    <button className="owlet-btn-action owlet-btn-edit"
                      onClick={e => { e.stopPropagation(); handleCopyUrl(item); }}>
                      {copied === item.id ? '✓ Copied!' : '🔗 Copy URL'}
                    </button>
                    <button className="owlet-btn-action owlet-btn-delete"
                      onClick={e => { e.stopPropagation(); handleDelete(item); }}>
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail / edit panel */}
        {selected && !pickerMode && (
          <div className="owlet-media-detail">
            <div className="owlet-media-detail-preview">
              {isImageItem(selected) ? (
                <img src={getEffectiveUrl(selected)} alt={selected.alt || selected.originalName} />
              ) : (
                <div className="owlet-media-detail-icon">{getFileIcon(selected)}</div>
              )}
            </div>

            <div className="owlet-media-detail-info">
              {editingItem ? (
                <>
                  <div className="owlet-field">
                    <label>Display Title</label>
                    <input
                      value={editingItem.title || ''}
                      onChange={e => setEditingItem({ ...editingItem, title: e.target.value })}
                      placeholder={editingItem.originalName}
                    />
                  </div>
                  <div className="owlet-field">
                    <label>Alt Text</label>
                    <input
                      value={editingItem.alt || ''}
                      onChange={e => setEditingItem({ ...editingItem, alt: e.target.value })}
                    />
                  </div>
                  <div className="owlet-field">
                    <label>Description</label>
                    <textarea
                      value={editingItem.description || ''}
                      onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  {isExternal(editingItem) && (
                    <div className="owlet-field">
                      <label>URL</label>
                      <input
                        value={editingItem.url || ''}
                        onChange={e => setEditingItem({ ...editingItem, url: e.target.value })}
                      />
                    </div>
                  )}
                  <div className="owlet-field">
                    <label>Tags</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.4rem' }}>
                      {(editingItem.tags || []).map(tag => (
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
                  <div className="owlet-form-actions">
                    <button className="owlet-btn-action owlet-btn-edit" onClick={handleSaveEdit}>💾 Save</button>
                    <button className="owlet-btn-action owlet-btn-delete" onClick={() => setEditingItem(null)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <h3>{selected.title || selected.originalName}</h3>
                  <p className="owlet-media-meta">
                    {isExternal(selected) ? '🔗 External URL' : formatSize(selected.size)}
                    {' · '}{new Date(selected.createdAt).toLocaleDateString()}
                  </p>
                  {selected.url && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--ink-light)', wordBreak: 'break-all', marginTop: '0.3rem' }}>
                      {selected.url}
                    </p>
                  )}
                  {selected.alt && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--ink-light)', marginTop: '0.4rem' }}>
                      Alt: {selected.alt}
                    </p>
                  )}
                  {selected.description && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--ink-light)', marginTop: '0.4rem', lineHeight: 1.5 }}>
                      {selected.description}
                    </p>
                  )}
                  {selected.tags && selected.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.5rem' }}>
                      {selected.tags.map(tag => (
                        <span key={tag} className="owlet-book-subject">{tag}</span>
                      ))}
                    </div>
                  )}
                  {selected.isIndexed && !isExternal(selected) && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--teal)', marginTop: '0.5rem' }}>
                      🔍 Content indexed ({selected.ocrText?.length || 0} chars)
                    </p>
                  )}

                  <div className="owlet-media-detail-actions">
                    <button className="owlet-btn-action owlet-btn-edit" onClick={() => handleCopyUrl(selected)}>
                      {copied === selected.id ? '✓ Copied!' : '🔗 Copy URL'}
                    </button>
                    <button className="owlet-btn-action owlet-btn-edit" onClick={() => setEditingItem({ ...selected })}>
                      ✏️ Edit
                    </button>
                    {!isExternal(selected) && (
                      <button
                        className="owlet-btn-action owlet-btn-edit"
                        onClick={() => handleReindex(selected)}
                        disabled={reindexing === selected.id}
                      >
                        {reindexing === selected.id ? '⏳ Indexing...' : '🔍 Reindex'}
                      </button>
                    )}
                    <button className="owlet-btn-action owlet-btn-delete" onClick={() => handleDelete(selected)}>
                      🗑️ Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
