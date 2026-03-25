import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import api from '../../api';
import ImageUpload from '../components/ImageUpload';

interface Collection {
  id: number;
  name: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  coverAlt?: string;
  coverTitle?: string;
  isVisible: boolean;
  createdAt: string;
}

interface Membership {
  id: number;
  collectionId: number;
  entityType: string;
  entityId: number;
  addedAt: string;
}

// Generic entity for display in collection
interface CollectionEntity {
  id: number;
  label: string;       // display name
  sublabel?: string;   // secondary info
  entityType: string;
}

type CollectionMode = 'list' | 'create' | 'edit';

const emptyCollection = {
  name: '',
  slug: '',
  description: '',
  coverUrl: '',
  coverAlt: '',
  coverTitle: '',
  isVisible: true,
};

// Entity type display config
const ENTITY_TYPES: Record<string, { label: string; icon: string }> = {
  catalog_item: { label: 'Catalog Items', icon: '📚' },
  page: { label: 'Pages', icon: '📄' },
  event: { label: 'Events', icon: '📅' },
  digital_resource: { label: 'Digital Resources', icon: '💻' },
};

export default function CollectionsTab() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const authHeader = { headers: { Authorization: `Bearer ${user?.token}` } };

  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<CollectionMode>('list');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyCollection);

  // Members of the collection being edited
  const [members, setMembers] = useState<CollectionEntity[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState<CollectionEntity[]>([]);
  const [searchType, setSearchType] = useState<string>('catalog_item');
  const [searching, setSearching] = useState(false);

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { fetchCollections(); }, []);

  const fetchCollections = () => {
    setLoading(true);
    api.get('/collections/admin/all', authHeader)
      .then(res => setCollections(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const notify = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(''); }
    else { setSuccess(msg); setError(''); }
    setTimeout(() => { setSuccess(''); setError(''); }, 4000);
  };

  // ── Edit a collection ──
  const handleEdit = async (col: Collection) => {
    setForm({
      name: col.name,
      slug: col.slug,
      description: col.description || '',
      coverUrl: col.coverUrl || '',
      coverAlt: col.coverAlt || '',
      coverTitle: col.coverTitle || '',
      isVisible: col.isVisible,
    });
    setEditingId(col.id);
    setMode('edit');
    setMembers([]);
    setMemberSearch('');
    setMemberSearchResults([]);

    // Load existing members
    try {
      const res = await api.get(`/collections/id/${col.id}`, authHeader);
      const memberships: Membership[] = res.data.memberships || [];
      const loaded = await loadEntityLabels(memberships);
      setMembers(loaded);
    } catch {
      setMembers([]);
    }
  };

  // ── Load human-readable labels for memberships ──
  const loadEntityLabels = async (memberships: Membership[]): Promise<CollectionEntity[]> => {
    const results: CollectionEntity[] = [];
    for (const m of memberships) {
      try {
        const entity = await fetchEntityById(m.entityType, m.entityId);
        if (entity) results.push({ ...entity, entityType: m.entityType });
      } catch { }
    }
    return results;
  };

  const fetchEntityById = async (type: string, id: number): Promise<CollectionEntity | null> => {
    try {
      switch (type) {
        case 'catalog_item': {
          const res = await api.get(`/catalog/item/${id}`);
          return { id, label: res.data.title, sublabel: res.data.author, entityType: type };
        }
        case 'page': {
          const res = await api.get(`/pages/${id}`);
          return { id, label: res.data.title, sublabel: `/${res.data.slug}`, entityType: type };
        }
        case 'event': {
          const res = await api.get(`/events/${id}`);
          return { id, label: res.data.title, sublabel: res.data.startDate, entityType: type };
        }
        case 'digital_resource': {
          const res = await api.get(`/digital-resources/${id}`);
          return { id, label: res.data.title, sublabel: res.data.category, entityType: type };
        }
        default: return null;
      }
    } catch {
      return null;
    }
  };

  // ── Search for entities to add ──
  const handleSearch = async (q: string) => {
    setMemberSearch(q);
    if (q.length < 2) return setMemberSearchResults([]);
    setSearching(true);
    try {
      let results: CollectionEntity[] = [];
      switch (searchType) {
        case 'catalog_item': {
          const res = await api.get(`/catalog?search=${encodeURIComponent(q)}`);
          results = res.data.slice(0, 8).map((item: any) => ({
            id: item.id,
            label: item.title,
            sublabel: item.author,
            entityType: 'catalog_item',
          }));
          break;
        }
        case 'page': {
          const res = await api.get(`/pages`);
          results = res.data
            .filter((p: any) => p.title.toLowerCase().includes(q.toLowerCase()))
            .slice(0, 8)
            .map((p: any) => ({
              id: p.id,
              label: p.title,
              sublabel: `/${p.slug}`,
              entityType: 'page',
            }));
          break;
        }
        case 'event': {
          const res = await api.get(`/events`);
          results = res.data
            .filter((e: any) => e.title.toLowerCase().includes(q.toLowerCase()))
            .slice(0, 8)
            .map((e: any) => ({
              id: e.id,
              label: e.title,
              sublabel: new Date(e.startDate).toLocaleDateString(),
              entityType: 'event',
            }));
          break;
        }
        case 'digital_resource': {
          const res = await api.get(`/digital-resources`);
          results = res.data
            .filter((r: any) => r.title.toLowerCase().includes(q.toLowerCase()))
            .slice(0, 8)
            .map((r: any) => ({
              id: r.id,
              label: r.title,
              sublabel: r.category,
              entityType: 'digital_resource',
            }));
          break;
        }
      }
      setMemberSearchResults(results);
    } catch {
      setMemberSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // ── Add member to collection ──
  const handleAddMember = async (entity: CollectionEntity) => {
    if (!editingId) return;
    const already = members.some(m => m.id === entity.id && m.entityType === entity.entityType);
    if (already) return;
    try {
      await api.post(`/collections/${editingId}/members`, {
        entityType: entity.entityType,
        entityId: entity.id,
      }, authHeader);
      setMembers(prev => [...prev, entity]);
    } catch {
      notify('Failed to add member.', true);
    }
  };

  // ── Remove member from collection ──
  const handleRemoveMember = async (entity: CollectionEntity) => {
    if (!editingId) return;
    try {
      await api.delete(`/collections/${editingId}/members`, {
        ...authHeader,
        data: { entityType: entity.entityType, entityId: entity.id },
      });
      setMembers(prev => prev.filter(m => !(m.id === entity.id && m.entityType === entity.entityType)));
    } catch {
      notify('Failed to remove member.', true);
    }
  };

  // ── Save collection ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.patch(`/collections/${editingId}`, form, authHeader);
        notify('Collection saved! 🎉');
      } else {
        await api.post('/collections', form, authHeader);
        notify('Collection created! 🎉');
      }
      handleCancel();
      fetchCollections();
    } catch {
      notify('Something went wrong.', true);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this collection? This cannot be undone.')) return;
    try {
      await api.delete(`/collections/${id}`, authHeader);
      notify('Collection deleted.');
      fetchCollections();
    } catch {
      notify('Failed to delete collection.', true);
    }
  };

  const handleCancel = () => {
    setMode('list');
    setEditingId(null);
    setForm(emptyCollection);
    setMembers([]);
    setMemberSearch('');
    setMemberSearchResults([]);
  };

  // Group members by entity type for display
  const membersByType = members.reduce((acc, m) => {
    if (!acc[m.entityType]) acc[m.entityType] = [];
    acc[m.entityType].push(m);
    return acc;
  }, {} as Record<string, CollectionEntity[]>);

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
              onClick={() => { setForm(emptyCollection); setMode('create'); }}
            >
              + New Collection
            </button>
          </div>

          <div className="owlet-admin-list">
            {loading ? (
              <div className="owlet-loading"><span /><span /><span /></div>
            ) : collections.length === 0 ? (
              <div className="owlet-empty">
                <p>No collections yet — create one to get started.</p>
              </div>
            ) : collections.map(col => (
              <div key={col.id} className="owlet-admin-item">
                {col.coverUrl && (
                  <div className="owlet-catalog-thumb-wrap">
                    <img src={col.coverUrl} alt={col.coverAlt || col.name} />
                  </div>
                )}
                <div className="owlet-admin-item-info" style={{ flex: 1, minWidth: 0 }}>
                  <h3>
                    {col.name}
                    {!col.isVisible && <span className="owlet-catalog-hidden-badge">hidden</span>}
                  </h3>
                  <p>
                    /{col.slug}
                    {col.description && ` · ${col.description}`}
                  </p>
                </div>
                <div className="owlet-admin-item-actions">
                  <button className="owlet-btn-action owlet-btn-edit"
                    onClick={() => handleEdit(col)}>
                    ✏️ Edit
                  </button>
                  {isAdmin && (
                    <button className="owlet-btn-action owlet-btn-delete"
                      onClick={() => handleDelete(col.id)}>
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
            {editingId ? '✏️ Edit Collection' : '🗂️ New Collection'}
          </h3>

          <p className="owlet-form-section-label">Details</p>
          <div className="owlet-field-row">
            <div className="owlet-field">
              <label>Name</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Summer Reading 2026"
                required
              />
            </div>
            <div className="owlet-field">
              <label>Slug</label>
              <input
                value={form.slug}
                onChange={e => setForm({ ...form, slug: e.target.value })}
                placeholder="summer-reading-2026"
                required
              />
            </div>
          </div>
          <div className="owlet-field">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="A curated collection of..."
            />
          </div>

          <ImageUpload
            currentUrl={form.coverUrl}
            currentAlt={form.coverAlt}
            currentTitle={form.coverTitle}
            onUpload={(url, alt, title) => setForm({ ...form, coverUrl: url, coverAlt: alt || '', coverTitle: title || '' })}
            label="Cover Image"
            size="medium"
            showTitle
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
            <input
              type="checkbox"
              id="colIsVisible"
              checked={form.isVisible}
              onChange={e => setForm({ ...form, isVisible: e.target.checked })}
            />
            <label htmlFor="colIsVisible"
              style={{ fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'Source Serif 4, serif' }}>
              Visible on public site
            </label>
          </div>

          {/* ── Members — only in edit mode ── */}
          {mode === 'edit' && editingId && (
            <>
              <p className="owlet-form-section-label" style={{ marginTop: '1.5rem' }}>
                Members ({members.length})
              </p>

              {/* Current members grouped by type */}
              {Object.keys(membersByType).length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  {Object.entries(membersByType).map(([type, typeMembers]) => (
                    <div key={type}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--ink-light)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                        {ENTITY_TYPES[type]?.icon} {ENTITY_TYPES[type]?.label || type}
                      </p>
                      <div className="owlet-collection-items-list">
                        {typeMembers.map(m => (
                          <div key={`${m.entityType}-${m.id}`} className="owlet-collection-item-row">
                            <span>
                              {m.label}
                              {m.sublabel && <span style={{ color: 'var(--ink-light)', fontSize: '0.8rem' }}> · {m.sublabel}</span>}
                            </span>
                            <button
                              type="button"
                              className="owlet-btn-action owlet-btn-delete"
                              onClick={() => handleRemoveMember(m)}
                            >
                              ✕ Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add members */}
              <div className="owlet-field">
                <label>Add Members</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {Object.entries(ENTITY_TYPES).map(([type, config]) => (
                    <button
                      key={type}
                      type="button"
                      className={`owlet-media-filter ${searchType === type ? 'active' : ''}`}
                      onClick={() => { setSearchType(type); setMemberSearch(''); setMemberSearchResults([]); }}
                    >
                      {config.icon} {config.label}
                    </button>
                  ))}
                </div>
                <input
                  className="owlet-catalog-search"
                  placeholder={`Search ${ENTITY_TYPES[searchType]?.label || 'items'}...`}
                  value={memberSearch}
                  onChange={e => handleSearch(e.target.value)}
                />
                {searching && (
                  <div className="owlet-loading" style={{ padding: '0.5rem' }}>
                    <span /><span /><span />
                  </div>
                )}
                {memberSearchResults.length > 0 && (
                  <div className="owlet-collection-search-results">
                    {memberSearchResults.map(entity => {
                      const already = members.some(
                        m => m.id === entity.id && m.entityType === entity.entityType
                      );
                      return (
                        <div key={`${entity.entityType}-${entity.id}`} className="owlet-collection-item-row">
                          <span>
                            {entity.label}
                            {entity.sublabel && (
                              <span style={{ color: 'var(--ink-light)', fontSize: '0.8rem' }}> · {entity.sublabel}</span>
                            )}
                          </span>
                          <button
                            type="button"
                            className="owlet-btn-action owlet-btn-edit"
                            disabled={already}
                            onClick={() => handleAddMember(entity)}
                          >
                            {already ? '✓ Added' : '+ Add'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {mode === 'create' && (
            <p style={{ fontSize: '0.8rem', color: 'var(--ink-light)', fontStyle: 'italic', marginTop: '0.5rem' }}>
              💡 You can add members after creating the collection.
            </p>
          )}

          <div className="owlet-form-actions" style={{ marginTop: '1.5rem' }}>
            <button type="submit" className="owlet-btn owlet-btn-primary" style={{ width: 'auto' }}>
              {editingId ? 'Save Changes' : 'Create Collection'} 🗂️
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
