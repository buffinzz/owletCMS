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
export type FilterType = 'all' | 'image' | 'document' | 'audio' | 'video';

interface MediaLibraryProps {
  pickerMode?: boolean;
  onSelect?: (url: string, item: MediaItem) => void;
  initialFilter?: FilterType;
  lockedFilter?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileType(mimetype: string): FilterType {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype.startsWith('video/')) return 'video';
  return 'document';
}

function getFileIcon(mimetype: string): string {
  if (mimetype.startsWith('image/')) return '🖼️';
  if (mimetype.startsWith('audio/')) return '🎵';
  if (mimetype.startsWith('video/')) return '🎬';
  if (mimetype.includes('pdf')) return '📄';
  if (mimetype.includes('word')) return '📝';
  if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return '📊';
  return '📁';
}

function getFileUrl(filename: string): string {
  return `http://localhost:3000/media/file/${filename}`;
}

export default function MediaLibrary({
  pickerMode = false,
  onSelect,
  initialFilter = 'all',
  lockedFilter = false,
}: MediaLibraryProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filter, setFilter] = useState<FilterType>(initialFilter);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [reindexing, setReindexing] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const authHeader = { headers: { Authorization: `Bearer ${user?.token}` } };

  useEffect(() => { fetchMedia(); }, []);
  useEffect(() => { setFilter(initialFilter); }, [initialFilter]);

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

  const handleDelete = async (item: MediaItem) => {
    if (!confirm(`Delete "${item.originalName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/media/${item.id}`, authHeader);
      notify('File deleted.');
      if (selected?.id === item.id) setSelected(null);
      if (editingItem?.id === item.id) setEditingItem(null);
      fetchMedia(search);
    } catch {
      notify('Failed to delete file.', true);
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
    const url = item.url || getFileUrl(item.filename);
    navigator.clipboard.writeText(url);
    setCopied(item.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSelect = (item: MediaItem) => {
    if (pickerMode && onSelect) {
      onSelect(item.url || getFileUrl(item.filename), item);
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
    return getFileType(item.mimetype) === filter;
  });

  const FILTERS: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: '🖼️ Images', value: 'image' },
    { label: '📄 Documents', value: 'document' },
    { label: '🎵 Audio', value: 'audio' },
    { label: '🎬 Video', value: 'video' },
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
        {!lockedFilter && (
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
        )}
        <div className="owlet-media-toolbar-right">
          <button
            className={`owlet-media-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')} title="Grid view">⊞</button>
          <button
            className={`owlet-media-view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')} title="List view">☰</button>
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

      {success && <div className="owlet-alert owlet-alert-success">{success}</div>}
      {error && <div className="owlet-alert owlet-alert-error">{error}</div>}

      {search && (
        <p style={{ fontSize: '0.8rem', color: 'var(--ink-light)', marginBottom: '0.5rem' }}>
          {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} for "{search}"
          {filteredItems.some(i => i.isIndexed) && ' (includes content search)'}
        </p>
      )}

      <div className="owlet-media-body">
        {/* Main content */}
        <div className="owlet-media-main">
          {loading ? (
            <div className="owlet-loading"><span /><span /><span /></div>
          ) : filteredItems.length === 0 ? (
            <div className="owlet-empty">
              <div className="owlet-empty-icon">📁</div>
              <p>{search ? `No files matching "${search}"` : 'No files yet — click Upload to add some.'}</p>
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
                    {getFileType(item.mimetype) === 'image' ? (
                      <img src={getFileUrl(item.filename)} alt={item.alt || item.originalName} />
                    ) : (
                      <div className="owlet-media-icon">{getFileIcon(item.mimetype)}</div>
                    )}
                    {item.isIndexed && (
                      <span className="owlet-media-indexed-badge" title="Content indexed">🔍</span>
                    )}
                    {pickerMode && (
                      <div className="owlet-media-select-overlay">Select</div>
                    )}
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
                    <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{getFileIcon(item.mimetype)}</span>
                    <div className="owlet-admin-item-info" style={{ flex: 1, minWidth: 0 }}>
                      <h3>
                        {item.title || item.originalName}
                        {item.isIndexed && <span className="owlet-media-indexed-badge" title="Content indexed"> 🔍</span>}
                      </h3>
                      <p>{formatSize(item.size)} · {item.mimetype} · {new Date(item.createdAt).toLocaleDateString()}</p>
                      {item.tags && item.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                          {item.tags.map(tag => (
                            <span key={tag} className="owlet-book-subject">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="owlet-admin-item-actions">
                    <button
                      className="owlet-btn-action owlet-btn-edit"
                      onClick={e => { e.stopPropagation(); handleCopyUrl(item); }}
                    >
                      {copied === item.id ? '✓ Copied!' : '🔗 Copy URL'}
                    </button>
                    <button
                      className="owlet-btn-action owlet-btn-delete"
                      onClick={e => { e.stopPropagation(); handleDelete(item); }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail / Edit panel */}
        {selected && !pickerMode && (
          <div className="owlet-media-detail">
            <div className="owlet-media-detail-preview">
              {getFileType(selected.mimetype) === 'image' ? (
                <img src={getFileUrl(selected.filename)} alt={selected.alt || selected.originalName} />
              ) : (
                <div className="owlet-media-detail-icon">{getFileIcon(selected.mimetype)}</div>
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
                      placeholder="Describes the file..."
                    />
                  </div>
                  <div className="owlet-field">
                    <label>Description</label>
                    <textarea
                      value={editingItem.description || ''}
                      onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                      placeholder="Optional description..."
                      rows={3}
                    />
                  </div>
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
                    {formatSize(selected.size)} · {new Date(selected.createdAt).toLocaleDateString()}
                  </p>
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
                  {selected.isIndexed && (
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
                    <button
                      className="owlet-btn-action owlet-btn-edit"
                      onClick={() => handleReindex(selected)}
                      disabled={reindexing === selected.id}
                    >
                      {reindexing === selected.id ? '⏳ Indexing...' : '🔍 Reindex'}
                    </button>
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
