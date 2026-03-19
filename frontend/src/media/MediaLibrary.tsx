import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import api from '../api';

interface MediaItem {
  id: number;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  alt?: string;
  caption?: string;
  createdAt: string;
  uploadedBy?: number;
}

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'image' | 'document' | 'audio' | 'video';

interface MediaLibraryProps {
  pickerMode?: boolean;
  onSelect?: (url: string, item: MediaItem) => void;
  allowedTypes?: FilterType[];
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

export default function MediaLibrary({ pickerMode = false, onSelect, allowedTypes }: MediaLibraryProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const authHeader = { headers: { Authorization: `Bearer ${user?.token}` } };

  useEffect(() => { fetchMedia(); }, []);

  const fetchMedia = () => {
    setLoading(true);
    api.get('/media', authHeader)
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
      fetchMedia();
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
      fetchMedia();
    } catch {
      notify('Failed to delete file.', true);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    try {
      await api.patch(`/media/${editingItem.id}`, {
        alt: editingItem.alt,
        caption: editingItem.caption,
      }, authHeader);
      notify('Saved!');
      setSelected(editingItem);
      setEditingItem(null);
      fetchMedia();
    } catch {
      notify('Failed to save.', true);
    }
  };

  const handleCopyUrl = (item: MediaItem) => {
    navigator.clipboard.writeText(getFileUrl(item.filename));
    setCopied(item.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSelect = (item: MediaItem) => {
    if (pickerMode && onSelect) {
      onSelect(getFileUrl(item.filename), item);
    } else {
      setSelected(selected?.id === item.id ? null : item);
    }
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
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >⊞</button>
          <button
            className={`owlet-media-view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List view"
          >☰</button>
          <button
            className="owlet-btn owlet-btn-primary owlet-btn-new"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : '+ Upload'}
          </button>
          <input
            ref={inputRef}
            type="file"
            onChange={handleUpload}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {success && <div className="owlet-alert owlet-alert-success">{success}</div>}
      {error && <div className="owlet-alert owlet-alert-error">{error}</div>}

      <div className="owlet-media-body">
        {/* Main content */}
        <div className="owlet-media-main">
          {loading ? (
            <div className="owlet-loading"><span /><span /><span /></div>
          ) : filteredItems.length === 0 ? (
            <div className="owlet-empty">
              <div className="owlet-empty-icon">📁</div>
              <p>No files yet — click Upload to add some.</p>
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
                    {pickerMode && (
                      <div className="owlet-media-select-overlay">Select</div>
                    )}
                  </div>
                  <p className="owlet-media-name">{item.originalName}</p>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <span style={{ fontSize: '1.5rem' }}>{getFileIcon(item.mimetype)}</span>
                    <div className="owlet-admin-item-info">
                      <h3>{item.originalName}</h3>
                      <p>{formatSize(item.size)} · {item.mimetype} · {new Date(item.createdAt).toLocaleDateString()}</p>
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

        {/* Detail panel */}
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
              <h3>{selected.originalName}</h3>
              <p className="owlet-media-meta">
                {formatSize(selected.size)} · {new Date(selected.createdAt).toLocaleDateString()}
              </p>

              {editingItem ? (
                <>
                  <div className="owlet-field" style={{ marginTop: '1rem' }}>
                    <label>Alt Text</label>
                    <input
                      value={editingItem.alt || ''}
                      onChange={e => setEditingItem({ ...editingItem, alt: e.target.value })}
                      placeholder="Describe the image..."
                    />
                  </div>
                  <div className="owlet-field">
                    <label>Caption</label>
                    <input
                      value={editingItem.caption || ''}
                      onChange={e => setEditingItem({ ...editingItem, caption: e.target.value })}
                      placeholder="Optional caption..."
                    />
                  </div>
                  <div className="owlet-form-actions" style={{ marginTop: '0.75rem' }}>
                    <button className="owlet-btn-action owlet-btn-edit" onClick={handleSaveEdit}>💾 Save</button>
                    <button className="owlet-btn-action owlet-btn-delete" onClick={() => setEditingItem(null)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  {selected.alt && <p style={{ fontSize: '0.85rem', color: 'var(--ink-light)', marginTop: '0.5rem' }}>Alt: {selected.alt}</p>}
                  {selected.caption && <p style={{ fontSize: '0.85rem', color: 'var(--ink-light)' }}>Caption: {selected.caption}</p>}
                  <div className="owlet-media-detail-actions">
                    <button
                      className="owlet-btn-action owlet-btn-edit"
                      onClick={() => handleCopyUrl(selected)}
                    >
                      {copied === selected.id ? '✓ Copied!' : '🔗 Copy URL'}
                    </button>
                    <button
                      className="owlet-btn-action owlet-btn-edit"
                      onClick={() => setEditingItem({ ...selected })}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="owlet-btn-action owlet-btn-delete"
                      onClick={() => handleDelete(selected)}
                    >
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
