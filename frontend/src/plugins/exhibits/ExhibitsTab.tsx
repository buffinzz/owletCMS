import { useState, useEffect } from 'react';
import { useAuth } from '../../core/auth/AuthContext';
import api from '../../api';
import ImageUpload from '../../core/components/ImageUpload';
import MediaUpload from '../../core/components/MediaUpload';

interface TimelineItem {
  date: string;
  title: string;
  description?: string;
  imageUrl?: string;
}

interface ExhibitPanel {
  id: number;
  exhibitId: number;
  title?: string;
  content?: string;
  type: string;
  mediaUrl?: string;
  mediaAlt?: string;
  mediaCaption?: string;
  timelineItems?: TimelineItem[];
  mapLat?: number;
  mapLng?: number;
  mapZoom?: number;
  mapLabel?: string;
  collectionId?: number;
  sortOrder: number;
}

interface Exhibit {
  id: number;
  title: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  coverAlt?: string;
  type: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isPublished: boolean;
  isFeatured: boolean;
  sortOrder: number;
  panels?: ExhibitPanel[];
}

const PANEL_TYPES = [
  { value: 'text', label: '📝 Text', icon: '📝' },
  { value: 'image', label: '🖼️ Image', icon: '🖼️' },
  { value: 'video', label: '🎬 Video', icon: '🎬' },
  { value: 'audio', label: '🎵 Audio', icon: '🎵' },
  { value: 'timeline', label: '📅 Timeline', icon: '📅' },
  { value: 'map', label: '🗺️ Map', icon: '🗺️' },
  { value: 'collection', label: '🗂️ Collection', icon: '🗂️' },
];

const EXHIBIT_TYPES = [
  { value: 'digital', label: '💻 Digital' },
  { value: 'physical', label: '🏛️ Physical' },
  { value: 'both', label: '🌐 Both' },
];

const emptyExhibit = {
  title: '', slug: '', description: '', coverUrl: '', coverAlt: '',
  type: 'digital', location: '', startDate: '', endDate: '',
  isPublished: false, isFeatured: false,
};

const emptyPanel = {
  title: '', content: '', type: 'text', mediaUrl: '', mediaAlt: '',
  mediaCaption: '', mapLat: undefined as number | undefined,
  mapLng: undefined as number | undefined, mapZoom: 13,
  mapLabel: '', collectionId: undefined as number | undefined,
  timelineItems: [] as TimelineItem[],
};

type Mode = 'list' | 'create' | 'edit' | 'panels';

export default function ExhibitsTab() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const authHeader = { headers: { Authorization: `Bearer ${user?.token}` } };

  const [exhibits, setExhibits] = useState<Exhibit[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('list');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyExhibit);

  // Panels
  const [panelsExhibit, setPanelsExhibit] = useState<Exhibit | null>(null);
  const [panels, setPanels] = useState<ExhibitPanel[]>([]);
  const [panelForm, setPanelForm] = useState(emptyPanel);
  const [editingPanelId, setEditingPanelId] = useState<number | null>(null);
  const [addingPanel, setAddingPanel] = useState(false);

  // Timeline editor
  const [timelineItem, setTimelineItem] = useState({ date: '', title: '', description: '', imageUrl: '' });

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { fetchExhibits(); }, []);

  const fetchExhibits = () => {
    setLoading(true);
    api.get('/exhibits/admin/all', authHeader)
      .then(res => setExhibits(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchPanels = (exhibitId: number) => {
    api.get(`/exhibits/admin/${exhibitId}`, authHeader)
      .then(res => setPanels(res.data.panels || []))
      .catch(() => setPanels([]));
  };

  const notify = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(''); }
    else { setSuccess(msg); setError(''); }
    setTimeout(() => { setSuccess(''); setError(''); }, 4000);
  };

  // ── Exhibit CRUD ──
  const handleEdit = (exhibit: Exhibit) => {
    setForm({
      title: exhibit.title,
      slug: exhibit.slug,
      description: exhibit.description || '',
      coverUrl: exhibit.coverUrl || '',
      coverAlt: exhibit.coverAlt || '',
      type: exhibit.type,
      location: exhibit.location || '',
      startDate: exhibit.startDate ? exhibit.startDate.split('T')[0] : '',
      endDate: exhibit.endDate ? exhibit.endDate.split('T')[0] : '',
      isPublished: exhibit.isPublished,
      isFeatured: exhibit.isFeatured,
    });
    setEditingId(exhibit.id);
    setMode('edit');
  };

  const handleOpenPanels = (exhibit: Exhibit) => {
    setPanelsExhibit(exhibit);
    fetchPanels(exhibit.id);
    setPanelForm(emptyPanel);
    setEditingPanelId(null);
    setAddingPanel(false);
    setMode('panels');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.patch(`/exhibits/${editingId}`, form, authHeader);
        notify('Exhibit saved!');
      } else {
        await api.post('/exhibits', form, authHeader);
        notify('Exhibit created! 🖼️');
      }
      handleCancel();
      fetchExhibits();
    } catch { notify('Something went wrong.', true); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this exhibit and all its panels?')) return;
    try {
      await api.delete(`/exhibits/${id}`, authHeader);
      notify('Exhibit deleted.');
      fetchExhibits();
    } catch { notify('Failed to delete.', true); }
  };

  const handleCancel = () => {
    setMode('list');
    setEditingId(null);
    setForm(emptyExhibit);
  };

  // ── Panel CRUD ──
  const handleEditPanel = (panel: ExhibitPanel) => {
    setPanelForm({
      title: panel.title || '',
      content: panel.content || '',
      type: panel.type,
      mediaUrl: panel.mediaUrl || '',
      mediaAlt: panel.mediaAlt || '',
      mediaCaption: panel.mediaCaption || '',
      mapLat: panel.mapLat,
      mapLng: panel.mapLng,
      mapZoom: panel.mapZoom || 13,
      mapLabel: panel.mapLabel || '',
      collectionId: panel.collectionId,
      timelineItems: panel.timelineItems || [],
    });
    setEditingPanelId(panel.id);
    setAddingPanel(true);
  };

  const handleSavePanel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!panelsExhibit) return;
    try {
      if (editingPanelId) {
        await api.patch(`/exhibits/panels/${editingPanelId}`, panelForm, authHeader);
        notify('Panel saved!');
      } else {
        await api.post(`/exhibits/${panelsExhibit.id}/panels`, panelForm, authHeader);
        notify('Panel added!');
      }
      setPanelForm(emptyPanel);
      setEditingPanelId(null);
      setAddingPanel(false);
      fetchPanels(panelsExhibit.id);
    } catch { notify('Failed to save panel.', true); }
  };

  const handleDeletePanel = async (panelId: number) => {
    if (!confirm('Delete this panel?')) return;
    try {
      await api.delete(`/exhibits/panels/${panelId}`, authHeader);
      notify('Panel deleted.');
      if (panelsExhibit) fetchPanels(panelsExhibit.id);
    } catch { notify('Failed to delete panel.', true); }
  };

  const handleMovePanelUp = async (panel: ExhibitPanel) => {
    const idx = panels.findIndex(p => p.id === panel.id);
    if (idx === 0) return;
    const prev = panels[idx - 1];
    await api.patch(`/exhibits/panels/reorder`, [
      { id: panel.id, sortOrder: prev.sortOrder },
      { id: prev.id, sortOrder: panel.sortOrder },
    ], authHeader);
    if (panelsExhibit) fetchPanels(panelsExhibit.id);
  };

  const handleMovePanelDown = async (panel: ExhibitPanel) => {
    const idx = panels.findIndex(p => p.id === panel.id);
    if (idx === panels.length - 1) return;
    const next = panels[idx + 1];
    await api.patch(`/exhibits/panels/reorder`, [
      { id: panel.id, sortOrder: next.sortOrder },
      { id: next.id, sortOrder: panel.sortOrder },
    ], authHeader);
    if (panelsExhibit) fetchPanels(panelsExhibit.id);
  };

  const addTimelineItem = () => {
    if (!timelineItem.date || !timelineItem.title) return;
    setPanelForm(prev => ({
      ...prev,
      timelineItems: [...(prev.timelineItems || []), { ...timelineItem }],
    }));
    setTimelineItem({ date: '', title: '', description: '', imageUrl: '' });
  };

  const removeTimelineItem = (idx: number) => {
    setPanelForm(prev => ({
      ...prev,
      timelineItems: prev.timelineItems.filter((_, i) => i !== idx),
    }));
  };

  return (
    <div>
      {success && <div className="owlet-alert owlet-alert-success">{success}</div>}
      {error && <div className="owlet-alert owlet-alert-error">{error}</div>}

      {/* ── LIST ── */}
      {mode === 'list' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="owlet-btn owlet-btn-primary owlet-btn-new"
              onClick={() => { setForm(emptyExhibit); setMode('create'); }}>
              + New Exhibit
            </button>
          </div>

          <div className="owlet-admin-list">
            {loading ? (
              <div className="owlet-loading"><span /><span /><span /></div>
            ) : exhibits.length === 0 ? (
              <div className="owlet-empty"><p>No exhibits yet.</p></div>
            ) : exhibits.map(exhibit => (
              <div key={exhibit.id} className="owlet-admin-item">
                {exhibit.coverUrl && (
                  <div className="owlet-catalog-thumb-wrap">
                    <img src={exhibit.coverUrl} alt={exhibit.coverAlt || exhibit.title} />
                  </div>
                )}
                <div className="owlet-admin-item-info" style={{ flex: 1, minWidth: 0 }}>
                  <h3>
                    {exhibit.title}
                    {!exhibit.isPublished && <span className="owlet-catalog-hidden-badge">draft</span>}
                    {exhibit.isFeatured && <span className="owlet-catalog-hidden-badge" style={{ background: 'var(--amber)' }}>featured</span>}
                    <span className="owlet-catalog-source" style={{ marginLeft: '0.5rem' }}>
                      {EXHIBIT_TYPES.find(t => t.value === exhibit.type)?.label}
                    </span>
                  </h3>
                  <p>
                    /{exhibit.slug}
                    {exhibit.location && ` · 📍 ${exhibit.location}`}
                    {exhibit.startDate && ` · ${new Date(exhibit.startDate).toLocaleDateString()}`}
                    {exhibit.endDate && ` – ${new Date(exhibit.endDate).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="owlet-admin-item-actions">
                  <button className="owlet-btn-action owlet-btn-edit"
                    onClick={() => handleOpenPanels(exhibit)}>
                    🖼️ Panels
                  </button>
                  <button className="owlet-btn-action owlet-btn-edit"
                    onClick={() => handleEdit(exhibit)}>
                    ✏️ Edit
                  </button>
                  {isAdmin && (
                    <button className="owlet-btn-action owlet-btn-delete"
                      onClick={() => handleDelete(exhibit.id)}>
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
            {editingId ? '✏️ Edit Exhibit' : '🖼️ New Exhibit'}
          </h3>

          <p className="owlet-form-section-label">Details</p>
          <div className="owlet-field-row">
            <div className="owlet-field">
              <label>Title *</label>
              <input value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                required />
            </div>
            <div className="owlet-field">
              <label>Slug *</label>
              <input value={form.slug}
                onChange={e => setForm({ ...form, slug: e.target.value })}
                required />
            </div>
          </div>
          <div className="owlet-field">
            <label>Description</label>
            <textarea value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3} />
          </div>

          <ImageUpload
            currentUrl={form.coverUrl}
            currentAlt={form.coverAlt}
            onUpload={(url, alt) => setForm({ ...form, coverUrl: url, coverAlt: alt || '' })}
            label="Cover Image"
            size="medium"
          />

          <p className="owlet-form-section-label" style={{ marginTop: '1rem' }}>Type & Location</p>
          <div className="owlet-field-row">
            <div className="owlet-field">
              <label>Exhibit Type</label>
              <select className="owlet-select" value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}>
                {EXHIBIT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="owlet-field">
              <label>Physical Location</label>
              <input value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                placeholder="Main Gallery, Floor 2" />
            </div>
          </div>
          <div className="owlet-field-row">
            <div className="owlet-field">
              <label>Start Date</label>
              <input type="date" value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="owlet-field">
              <label>End Date</label>
              <input type="date" value={form.endDate}
                onChange={e => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>

          <p className="owlet-form-section-label" style={{ marginTop: '1rem' }}>Settings</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" id="isPublished"
                checked={form.isPublished}
                onChange={e => setForm({ ...form, isPublished: e.target.checked })} />
              <label htmlFor="isPublished"
                style={{ fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'Source Serif 4, serif' }}>
                Published
              </label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" id="isFeatured"
                checked={form.isFeatured}
                onChange={e => setForm({ ...form, isFeatured: e.target.checked })} />
              <label htmlFor="isFeatured"
                style={{ fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'Source Serif 4, serif' }}>
                Featured on homepage
              </label>
            </div>
          </div>

          <div className="owlet-form-actions" style={{ marginTop: '1.5rem' }}>
            <button type="submit" className="owlet-btn owlet-btn-primary" style={{ width: 'auto' }}>
              {editingId ? 'Save Changes' : 'Create Exhibit'} 🖼️
            </button>
            <button type="button" className="owlet-btn owlet-btn-ghost" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── PANELS ── */}
      {mode === 'panels' && panelsExhibit && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <button className="owlet-btn owlet-btn-ghost" style={{ width: 'auto' }}
              onClick={() => { setMode('list'); setPanelsExhibit(null); setPanels([]); }}>
              ← Back
            </button>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontFamily: 'Playfair Display, serif', color: 'var(--purple-deep)', margin: 0 }}>
                {panelsExhibit.title}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--ink-light)', margin: 0 }}>
                {panels.length} panel{panels.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button className="owlet-btn owlet-btn-ghost" style={{ width: 'auto' }}
              onClick={() => handleEdit(panelsExhibit)}>
              ✏️ Edit Exhibit
            </button>
            <button className="owlet-btn owlet-btn-primary" style={{ width: 'auto' }}
              onClick={() => { setPanelForm(emptyPanel); setEditingPanelId(null); setAddingPanel(true); }}>
              + Add Panel
            </button>
          </div>

          {/* Panels list */}
          {panels.length > 0 && (
            <div className="owlet-admin-list" style={{ marginBottom: '1.5rem' }}>
              {panels.map((panel, idx) => (
                <div key={panel.id} className="owlet-admin-item">
                  <div className="owlet-nav-item-handle">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                      <button className="owlet-nav-arrow"
                        onClick={() => handleMovePanelUp(panel)}
                        disabled={idx === 0}>▲</button>
                      <button className="owlet-nav-arrow"
                        onClick={() => handleMovePanelDown(panel)}
                        disabled={idx === panels.length - 1}>▼</button>
                    </div>
                  </div>
                  <div className="owlet-admin-item-info" style={{ flex: 1, minWidth: 0 }}>
                    <h3>
                      <span style={{ marginRight: '0.4rem' }}>
                        {PANEL_TYPES.find(t => t.value === panel.type)?.icon}
                      </span>
                      {panel.title || `${panel.type} panel`}
                      <span className="owlet-catalog-source" style={{ marginLeft: '0.5rem' }}>
                        {panel.type}
                      </span>
                    </h3>
                    {panel.content && (
                      <p style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {panel.content.slice(0, 80)}
                      </p>
                    )}
                    {panel.mediaUrl && <p>🔗 {panel.mediaUrl}</p>}
                    {panel.timelineItems && panel.timelineItems.length > 0 && (
                      <p>{panel.timelineItems.length} timeline items</p>
                    )}
                  </div>
                  <div className="owlet-admin-item-actions">
                    <button className="owlet-btn-action owlet-btn-edit"
                      onClick={() => handleEditPanel(panel)}>
                      ✏️ Edit
                    </button>
                    <button className="owlet-btn-action owlet-btn-delete"
                      onClick={() => handleDeletePanel(panel.id)}>
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add / edit panel form */}
          {addingPanel && (
            <form className="owlet-admin-form" onSubmit={handleSavePanel}
              style={{ background: 'var(--cream)', border: '1px solid var(--cream-dark)' }}>
              <h4 style={{ fontFamily: 'Playfair Display, serif', color: 'var(--purple-deep)', marginBottom: '1rem' }}>
                {editingPanelId ? '✏️ Edit Panel' : '+ New Panel'}
              </h4>

              <div className="owlet-field-row">
                <div className="owlet-field">
                  <label>Panel Type</label>
                  <select className="owlet-select" value={panelForm.type}
                    onChange={e => setPanelForm({ ...panelForm, type: e.target.value })}>
                    {PANEL_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="owlet-field">
                  <label>Panel Title</label>
                  <input value={panelForm.title}
                    onChange={e => setPanelForm({ ...panelForm, title: e.target.value })}
                    placeholder="Optional section heading" />
                </div>
              </div>

              {/* Text content */}
              {(panelForm.type === 'text' || panelForm.type === 'image' || panelForm.type === 'video' || panelForm.type === 'audio') && (
                <div className="owlet-field">
                  <label>Content / Description</label>
                  <textarea value={panelForm.content}
                    onChange={e => setPanelForm({ ...panelForm, content: e.target.value })}
                    rows={5}
                    placeholder={panelForm.type === 'text' ? 'Markdown supported...' : 'Caption or description...'} />
                </div>
              )}

              {/* Media URL */}
              {(panelForm.type === 'image' || panelForm.type === 'video' || panelForm.type === 'audio') && (
                <>
                  {panelForm.type === 'image' ? (
                    <>
                      <ImageUpload
                        currentUrl={panelForm.mediaUrl}
                        currentAlt={panelForm.mediaAlt}
                        onUpload={(url, alt) => setPanelForm({
                          ...panelForm,
                          mediaUrl: url,
                          mediaAlt: alt || '',
                        })}
                        onSelectMedia={item => setPanelForm(prev => ({
                          ...prev,
                          content: prev.content || item.description || '',
                        }))}
                        label="Panel Image"
                        size="medium"
                      />
                      <div className="owlet-field">
                        <label>Caption</label>
                        <input value={panelForm.mediaCaption}
                          onChange={e => setPanelForm({ ...panelForm, mediaCaption: e.target.value })} />
                      </div>
                    </>
                  ) : (
                    <MediaUpload
                      currentUrl={panelForm.mediaUrl}
                      mediaType={panelForm.type === 'video' ? 'video' : 'audio'}
                      label={panelForm.type === 'video' ? 'Panel Video' : 'Panel Audio'}
                      onSelect={(url, item) => setPanelForm(prev => ({
                        ...prev,
                        mediaUrl: url,
                        content: prev.content || item?.description || '',
                      }))}
                    />
                  )}
                </>
              )}

              {/* Map */}
              {panelForm.type === 'map' && (
                <>
                  <div className="owlet-field-row">
                    <div className="owlet-field">
                      <label>Latitude</label>
                      <input type="number" step="any"
                        value={panelForm.mapLat || ''}
                        onChange={e => setPanelForm({ ...panelForm, mapLat: +e.target.value })}
                        placeholder="35.1234" />
                    </div>
                    <div className="owlet-field">
                      <label>Longitude</label>
                      <input type="number" step="any"
                        value={panelForm.mapLng || ''}
                        onChange={e => setPanelForm({ ...panelForm, mapLng: +e.target.value })}
                        placeholder="-83.1234" />
                    </div>
                    <div className="owlet-field">
                      <label>Zoom</label>
                      <input type="number" min="1" max="20"
                        value={panelForm.mapZoom}
                        onChange={e => setPanelForm({ ...panelForm, mapZoom: +e.target.value })} />
                    </div>
                  </div>
                  <div className="owlet-field">
                    <label>Map Label</label>
                    <input value={panelForm.mapLabel}
                      onChange={e => setPanelForm({ ...panelForm, mapLabel: e.target.value })}
                      placeholder="Location name shown on map" />
                  </div>
                </>
              )}

              {/* Collection */}
              {panelForm.type === 'collection' && (
                <div className="owlet-field">
                  <label>Collection ID</label>
                  <input type="number"
                    value={panelForm.collectionId || ''}
                    onChange={e => setPanelForm({ ...panelForm, collectionId: +e.target.value })}
                    placeholder="Enter collection ID" />
                  <p style={{ fontSize: '0.75rem', color: 'var(--ink-light)', marginTop: '0.25rem' }}>
                    Find the ID in the Collections admin tab
                  </p>
                </div>
              )}

              {/* Timeline */}
              {panelForm.type === 'timeline' && (
                <div className="owlet-field">
                  <label>Timeline Items</label>
                  {(panelForm.timelineItems || []).map((item, idx) => (
                    <div key={idx} className="owlet-circ-checkout-row" style={{ marginBottom: '0.4rem' }}>
                      <span style={{ flex: 1, fontSize: '0.85rem' }}>
                        <strong>{item.date}</strong> — {item.title}
                      </span>
                      <button type="button" className="owlet-btn-action owlet-btn-delete"
                        onClick={() => removeTimelineItem(idx)}>✕</button>
                    </div>
                  ))}
                  <div style={{ background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: '8px', padding: '0.75rem', marginTop: '0.5rem' }}>
                    <p style={{ fontSize: '0.78rem', color: 'var(--ink-light)', marginBottom: '0.5rem' }}>Add timeline item:</p>
                    <div className="owlet-field-row">
                      <div className="owlet-field">
                        <label>Date</label>
                        <input value={timelineItem.date}
                          onChange={e => setTimelineItem({ ...timelineItem, date: e.target.value })}
                          placeholder="1924" />
                      </div>
                      <div className="owlet-field">
                        <label>Title</label>
                        <input value={timelineItem.title}
                          onChange={e => setTimelineItem({ ...timelineItem, title: e.target.value })}
                          placeholder="Library opens" />
                      </div>
                    </div>
                    <div className="owlet-field">
                      <label>Description</label>
                      <input value={timelineItem.description}
                        onChange={e => setTimelineItem({ ...timelineItem, description: e.target.value })} />
                    </div>
                    <button type="button" className="owlet-btn-action owlet-btn-edit"
                      onClick={addTimelineItem}>+ Add Item</button>
                  </div>
                </div>
              )}

              <div className="owlet-form-actions">
                <button type="submit" className="owlet-btn owlet-btn-primary" style={{ width: 'auto' }}>
                  {editingPanelId ? 'Save Panel' : 'Add Panel'}
                </button>
                <button type="button" className="owlet-btn owlet-btn-ghost"
                  onClick={() => { setAddingPanel(false); setEditingPanelId(null); setPanelForm(emptyPanel); }}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
