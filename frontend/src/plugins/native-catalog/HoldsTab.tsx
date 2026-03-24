import { useState, useEffect } from 'react';
import { useAuth } from '../../core/auth/AuthContext';
import api from '../../api';

interface Hold {
  id: number;
  itemId: number;
  patronId: number;
  status: string;
  requestedAt: string;
  readyAt?: string;
  expiresAt?: string;
  notifiedAt?: string;
  copyId?: number;
}

interface CatalogItem {
  id: number;
  title: string;
  author?: string;
}

interface Patron {
  id: number;
  username: string;
  displayName?: string;
  email?: string;
}

type HoldsView = 'pending' | 'ready' | 'all';

export default function HoldsTab() {
  const { user } = useAuth();
  const authHeader = { headers: { Authorization: `Bearer ${user?.token}` } };

  const [view, setView] = useState<HoldsView>('pending');
  const [holds, setHolds] = useState<Hold[]>([]);
  const [enriched, setEnriched] = useState<Array<Hold & { item?: CatalogItem; patron?: Patron }>>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { fetchHolds(); }, [view]);

  const fetchHolds = async () => {
    setLoading(true);
    try {
      const endpoint = view === 'ready' ? '/holds/ready' : '/holds';
      const res = await api.get(endpoint, authHeader);
      const rawHolds: Hold[] = view === 'all'
        ? res.data
        : res.data.filter((h: Hold) => h.status === view);
      setHolds(rawHolds);
      await enrichHolds(rawHolds);
    } catch {
      setHolds([]);
    } finally {
      setLoading(false);
    }
  };

  const enrichHolds = async (rawHolds: Hold[]) => {
    const result = await Promise.all(
      rawHolds.map(async hold => {
        const [item, patron] = await Promise.all([
          api.get(`/catalog/${hold.itemId}`).then(r => r.data).catch(() => null),
          api.get(`/users/${hold.patronId}`, authHeader).then(r => r.data).catch(() => null),
        ]);
        return { ...hold, item, patron };
      })
    );
    setEnriched(result);
  };

  const notify = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(''); }
    else { setSuccess(msg); setError(''); }
    setTimeout(() => { setSuccess(''); setError(''); }, 4000);
  };

  const handleFulfill = async (holdId: number) => {
    try {
      await api.post(`/holds/${holdId}/fulfill`, {}, authHeader);
      notify('Hold fulfilled ✅');
      fetchHolds();
    } catch {
      notify('Failed to fulfill hold.', true);
    }
  };

  const handleCancel = async (holdId: number, patronId: number) => {
    if (!confirm('Cancel this hold?')) return;
    try {
      await api.delete(`/holds/${holdId}`, {
        ...authHeader,
        data: { patronId },
      });
      notify('Hold cancelled.');
      fetchHolds();
    } catch {
      notify('Failed to cancel hold.', true);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'var(--amber)';
      case 'ready': return 'var(--teal)';
      case 'fulfilled': return 'var(--ink-light)';
      case 'cancelled': return 'var(--ink-light)';
      case 'expired': return '#c0392b';
      default: return 'var(--ink-light)';
    }
  };

  return (
    <div>
      {success && <div className="owlet-alert owlet-alert-success">{success}</div>}
      {error && <div className="owlet-alert owlet-alert-error">{error}</div>}

      <div className="owlet-catalog-nav" style={{ marginBottom: '1.5rem' }}>
        <button className={`owlet-tab ${view === 'pending' ? 'active' : ''}`}
          onClick={() => setView('pending')}>
          ⏳ Pending
        </button>
        <button className={`owlet-tab ${view === 'ready' ? 'active' : ''}`}
          onClick={() => setView('ready')}>
          ✅ Ready for Pickup
        </button>
        <button className={`owlet-tab ${view === 'all' ? 'active' : ''}`}
          onClick={() => setView('all')}>
          📋 All Holds
        </button>
      </div>

      {loading ? (
        <div className="owlet-loading"><span /><span /><span /></div>
      ) : enriched.length === 0 ? (
        <div className="owlet-empty">
          <p>No {view === 'pending' ? 'pending' : view === 'ready' ? 'ready' : ''} holds.</p>
        </div>
      ) : (
        <div className="owlet-admin-list">
          {enriched.map(hold => (
            <div key={hold.id} className="owlet-admin-item">
              <div className="owlet-admin-item-info" style={{ flex: 1, minWidth: 0 }}>
                <h3>
                  {hold.item?.title || `Item #${hold.itemId}`}
                  <span style={{
                    fontSize: '0.72rem',
                    color: 'var(--white)',
                    background: statusColor(hold.status),
                    borderRadius: '4px',
                    padding: '1px 6px',
                    marginLeft: '0.5rem',
                    textTransform: 'capitalize',
                  }}>
                    {hold.status}
                  </span>
                </h3>
                <p>
                  {hold.item?.author && <span>{hold.item.author} · </span>}
                  <span>
                    {hold.patron?.displayName || hold.patron?.username || `Patron #${hold.patronId}`}
                  </span>
                  {hold.patron?.email && (
                    <span style={{ color: 'var(--ink-light)' }}> · {hold.patron.email}</span>
                  )}
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--ink-light)' }}>
                  Requested: {new Date(hold.requestedAt).toLocaleDateString()}
                  {hold.readyAt && ` · Ready: ${new Date(hold.readyAt).toLocaleDateString()}`}
                  {hold.expiresAt && ` · Expires: ${new Date(hold.expiresAt).toLocaleDateString()}`}
                </p>
              </div>
              <div className="owlet-admin-item-actions">
                {hold.status === 'ready' && (
                  <button className="owlet-btn-action owlet-btn-edit"
                    onClick={() => handleFulfill(hold.id)}>
                    ✅ Fulfil
                  </button>
                )}
                {(hold.status === 'pending' || hold.status === 'ready') && (
                  <button className="owlet-btn-action owlet-btn-delete"
                    onClick={() => handleCancel(hold.id, hold.patronId)}>
                    ✕ Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
