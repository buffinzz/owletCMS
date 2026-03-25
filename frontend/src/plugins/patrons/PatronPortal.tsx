import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../core/auth/AuthContext';
import { useSettings } from '../../core/settings/SettingsContext';

interface PatronProfile {
  userId: number;
  libraryCardNumber?: string;
  preferredName?: string;
  isApproved: boolean;
  notifyByEmail: boolean;
  readingInterests?: string[];
  lastLoginAt?: string;
}

interface PatronData {
  id: number;
  username: string;
  displayName?: string;
  email?: string;
  role: string;
  profile: PatronProfile | null;
}

interface CirculationRecord {
  id: number;
  copyId: number;
  itemId: number;
  dueDate: string;
  checkedOutAt: string;
  renewalCount: number;
  returnedAt?: string;
}

interface Hold {
  id: number;
  itemId: number;
  status: string;
  requestedAt: string;
  readyAt?: string;
  expiresAt?: string;
}

interface CatalogItem {
  id: number;
  title: string;
  author?: string;
  coverUrl?: string;
}

export default function PatronPortal() {
  const { user, logout } = useAuth();
  const { settings } = useSettings();

  const [patron, setPatron] = useState<PatronData | null>(null);
  const [checkouts, setCheckouts] = useState<Array<CirculationRecord & { item?: CatalogItem }>>([]);
  const [history, setHistory] = useState<Array<CirculationRecord & { item?: CatalogItem }>>([]);
  const [holds, setHolds] = useState<Array<Hold & { item?: CatalogItem }>>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'checkouts' | 'holds' | 'history' | 'profile'>('checkouts');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ displayName: '', notifyByEmail: true });
  const [interestInput, setInterestInput] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const authHeader = { headers: { Authorization: `Bearer ${user?.token}` } };

  useEffect(() => {
    if (!user?.token) return;
    loadAll();
  }, [user?.token]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [patronRes, checkoutRes, holdsRes] = await Promise.all([
        api.get('/patrons/me', authHeader),
        api.get('/circulation/my-checkouts', authHeader),
        api.get('/holds/my-holds', authHeader),
      ]);

      setPatron(patronRes.data);
      setProfileForm({
        displayName: patronRes.data.displayName || '',
        notifyByEmail: patronRes.data.profile?.notifyByEmail ?? true,
      });

      const enrichedCheckouts = await Promise.all(
        checkoutRes.data.map(async (record: CirculationRecord) => {
          const item = await api.get(`/catalog/item/${record.itemId}`)
            .then(r => r.data).catch(() => null);
          return { ...record, item };
        })
      );
      setCheckouts(enrichedCheckouts);

      const enrichedHolds = await Promise.all(
        holdsRes.data.map(async (hold: Hold) => {
          const item = await api.get(`/catalog/item/${hold.itemId}`)
            .then(r => r.data).catch(() => null);
          return { ...hold, item };
        })
      );
      setHolds(enrichedHolds);
    } catch {
      setError('Failed to load account data.');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await api.get('/circulation/my-history', authHeader);
      const enriched = await Promise.all(
        res.data.map(async (record: CirculationRecord) => {
          const item = await api.get(`/catalog/item/${record.itemId}`)
            .then(r => r.data).catch(() => null);
          return { ...record, item };
        })
      );
      setHistory(enriched);
    } catch { }
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === 'history' && history.length === 0) loadHistory();
  };

  const handleRenew = async (circulationId: number) => {
    try {
      await api.post(`/circulation/renew/${circulationId}`, {}, authHeader);
      notify('Renewed! ✅');
      loadAll();
    } catch (err: any) {
      notify(err.response?.data?.message || 'Renewal failed.', true);
    }
  };

  const handleCancelHold = async (holdId: number) => {
    if (!confirm('Cancel this hold?')) return;
    try {
      await api.delete(`/holds/${holdId}`, authHeader);
      notify('Hold cancelled.');
      loadAll();
    } catch {
      notify('Failed to cancel hold.', true);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await api.patch('/patrons/me', {
        displayName: profileForm.displayName,
        notifyByEmail: profileForm.notifyByEmail,
        readingInterests: patron?.profile?.readingInterests || [],
      }, authHeader);
      notify('Profile updated!');
      setEditingProfile(false);
      loadAll();
    } catch {
      notify('Failed to update profile.', true);
    }
  };

  const addInterest = async (interest: string) => {
    if (!interest.trim() || !patron) return;
    const current = patron.profile?.readingInterests || [];
    if (current.includes(interest.trim())) return;
    try {
      await api.patch('/patrons/me', {
        readingInterests: [...current, interest.trim()],
      }, authHeader);
      setInterestInput('');
      loadAll();
    } catch { }
  };

  const removeInterest = async (interest: string) => {
    if (!patron) return;
    const current = patron.profile?.readingInterests || [];
    try {
      await api.patch('/patrons/me', {
        readingInterests: current.filter(i => i !== interest),
      }, authHeader);
      loadAll();
    } catch { }
  };

  const notify = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(''); }
    else { setSuccess(msg); setError(''); }
    setTimeout(() => { setSuccess(''); setError(''); }, 4000);
  };

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

  // ── Not logged in ──
  if (!user) {
    return (
      <div className="owlet-setup-wrap">
        <div className="owlet-setup-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', color: 'var(--purple-deep)' }}>
            Sign in to view your account
          </h2>
          <Link to="/admin/login" className="owlet-btn owlet-btn-primary"
            style={{ display: 'inline-block', marginTop: '1.5rem', width: 'auto' }}>
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // ── Wrong role ──
  if (user.role !== 'patron') {
    return (
      <div className="owlet-setup-wrap">
        <div className="owlet-setup-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', color: 'var(--purple-deep)' }}>
            This page is for patron accounts.
          </h2>
          <Link to="/admin" className="owlet-btn owlet-btn-primary"
            style={{ display: 'inline-block', marginTop: '1.5rem', width: 'auto' }}>
            Go to Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="owlet-patron-portal">
        <div className="owlet-patron-header">
          <div className="owlet-patron-header-inner">
            <div className="owlet-patron-welcome">
              <div className="owlet-patron-avatar-lg">…</div>
              <div>
                <h1 style={{ color: 'var(--white)', fontFamily: 'Playfair Display, serif' }}>
                  Loading your account...
                </h1>
              </div>
            </div>
          </div>
        </div>
        <div className="owlet-patron-body">
          <div className="owlet-loading"><span /><span /><span /></div>
        </div>
      </div>
    );
  }

  if (!patron) return null;

  const name = patron.profile?.preferredName || patron.displayName || patron.username;
  const siteName = settings.library_name || 'Your Library';

  return (
    <div className="owlet-patron-portal">
      {/* Header */}
      <div className="owlet-patron-header">
        <div className="owlet-patron-header-inner">
          <div className="owlet-patron-welcome">
            <div className="owlet-patron-avatar-lg">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1>Welcome back, <em>{name}</em>.</h1>
              {patron.profile?.libraryCardNumber && (
                <p style={{ color: 'var(--purple-light)', fontSize: '0.9rem' }}>
                  🪪 {patron.profile.libraryCardNumber}
                </p>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link to="/" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', textDecoration: 'none' }}>
              ← {siteName}
            </Link>
            <button
              className="owlet-btn owlet-btn-ghost"
              style={{ color: 'var(--white)', borderColor: 'rgba(255,255,255,0.3)', width: 'auto' }}
              onClick={logout}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="owlet-patron-body">
        {success && <div className="owlet-alert owlet-alert-success">{success}</div>}
        {error && <div className="owlet-alert owlet-alert-error">{error}</div>}

        {/* Stats */}
        <div className="owlet-patron-stats">
          <div className="owlet-patron-stat">
            <span className="owlet-patron-stat-num">{checkouts.length}</span>
            <span className="owlet-patron-stat-label">Checked Out</span>
          </div>
          <div className="owlet-patron-stat">
            <span className="owlet-patron-stat-num"
              style={{ color: checkouts.filter(c => isOverdue(c.dueDate)).length > 0 ? '#c0392b' : undefined }}>
              {checkouts.filter(c => isOverdue(c.dueDate)).length}
            </span>
            <span className="owlet-patron-stat-label">Overdue</span>
          </div>
          <div className="owlet-patron-stat">
            <span className="owlet-patron-stat-num">
              {holds.filter(h => h.status === 'pending').length}
            </span>
            <span className="owlet-patron-stat-label">Holds</span>
          </div>
          <div className="owlet-patron-stat">
            <span className="owlet-patron-stat-num" style={{ color: 'var(--teal)' }}>
              {holds.filter(h => h.status === 'ready').length}
            </span>
            <span className="owlet-patron-stat-label">Ready for Pickup</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="owlet-catalog-nav" style={{ marginBottom: '1.5rem' }}>
          <button className={`owlet-tab ${activeTab === 'checkouts' ? 'active' : ''}`}
            onClick={() => handleTabChange('checkouts')}>
            📚 Checkouts
          </button>
          <button className={`owlet-tab ${activeTab === 'holds' ? 'active' : ''}`}
            onClick={() => handleTabChange('holds')}>
            📋 Holds
          </button>
          <button className={`owlet-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => handleTabChange('history')}>
            🕐 History
          </button>
          <button className={`owlet-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleTabChange('profile')}>
            👤 Profile
          </button>
        </div>

        {/* ── CHECKOUTS ── */}
        {activeTab === 'checkouts' && (
          <div>
            {checkouts.length === 0 ? (
              <div className="owlet-empty">
                <div className="owlet-empty-icon">📚</div>
                <p>No items currently checked out.</p>
              </div>
            ) : (
              <div className="owlet-patron-items">
                {checkouts.map(record => (
                  <div key={record.id}
                    className={`owlet-patron-item ${isOverdue(record.dueDate) ? 'owlet-patron-item-overdue' : ''}`}>
                    {record.item?.coverUrl && (
                      <img src={record.item.coverUrl} alt={record.item.title}
                        className="owlet-patron-item-cover" />
                    )}
                    <div className="owlet-patron-item-info">
                      <h3>{record.item?.title || `Item #${record.itemId}`}</h3>
                      {record.item?.author && <p>{record.item.author}</p>}
                      <p style={{
                        color: isOverdue(record.dueDate) ? '#c0392b' : 'var(--ink-light)',
                        fontWeight: isOverdue(record.dueDate) ? 600 : 300,
                      }}>
                        {isOverdue(record.dueDate) ? '⚠️ Overdue — ' : 'Due '}
                        {new Date(record.dueDate).toLocaleDateString()}
                      </p>
                      {record.renewalCount > 0 && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--ink-light)' }}>
                          Renewed {record.renewalCount}×
                        </p>
                      )}
                    </div>
                    <button className="owlet-btn-action owlet-btn-edit"
                      onClick={() => handleRenew(record.id)}>
                      🔄 Renew
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── HOLDS ── */}
        {activeTab === 'holds' && (
          <div>
            {holds.length === 0 ? (
              <div className="owlet-empty">
                <div className="owlet-empty-icon">📋</div>
                <p>No holds.</p>
              </div>
            ) : (
              <div className="owlet-patron-items">
                {holds.map(hold => (
                  <div key={hold.id} className="owlet-patron-item">
                    {hold.item?.coverUrl && (
                      <img src={hold.item.coverUrl} alt={hold.item.title}
                        className="owlet-patron-item-cover" />
                    )}
                    <div className="owlet-patron-item-info">
                      <h3>{hold.item?.title || `Item #${hold.itemId}`}</h3>
                      {hold.item?.author && <p>{hold.item.author}</p>}
                      <p>
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: hold.status === 'ready' ? 'var(--teal)' : 'var(--cream-dark)',
                          color: hold.status === 'ready' ? 'var(--white)' : 'var(--ink-light)',
                        }}>
                          {hold.status === 'ready' ? '✅ Ready for pickup!' : '⏳ Waiting'}
                        </span>
                      </p>
                      {hold.expiresAt && hold.status === 'ready' && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--amber)' }}>
                          Pick up by {new Date(hold.expiresAt).toLocaleDateString()}
                        </p>
                      )}
                      <p style={{ fontSize: '0.78rem', color: 'var(--ink-light)' }}>
                        Requested {new Date(hold.requestedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {hold.status === 'pending' && (
                      <button className="owlet-btn-action owlet-btn-delete"
                        onClick={() => handleCancelHold(hold.id)}>
                        ✕ Cancel
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── HISTORY ── */}
        {activeTab === 'history' && (
          <div>
            {history.length === 0 ? (
              <div className="owlet-empty">
                <div className="owlet-empty-icon">🕐</div>
                <p>No reading history yet.</p>
              </div>
            ) : (
              <div className="owlet-patron-items">
                {history.filter(r => r.returnedAt).map(record => (
                  <div key={record.id} className="owlet-patron-item" style={{ opacity: 0.85 }}>
                    {record.item?.coverUrl && (
                      <img src={record.item.coverUrl} alt={record.item.title}
                        className="owlet-patron-item-cover" />
                    )}
                    <div className="owlet-patron-item-info">
                      <h3>{record.item?.title || `Item #${record.itemId}`}</h3>
                      {record.item?.author && <p>{record.item.author}</p>}
                      <p style={{ fontSize: '0.78rem', color: 'var(--ink-light)' }}>
                        Borrowed {new Date(record.checkedOutAt).toLocaleDateString()}
                        {record.returnedAt && ` · Returned ${new Date(record.returnedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PROFILE ── */}
        {activeTab === 'profile' && (
          <div style={{ maxWidth: 560 }}>
            <div className="owlet-patron-profile-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ fontFamily: 'Playfair Display, serif', color: 'var(--purple-deep)', margin: 0 }}>
                  Your Profile
                </h3>
                {!editingProfile && (
                  <button className="owlet-btn-action owlet-btn-edit"
                    onClick={() => setEditingProfile(true)}>
                    ✏️ Edit
                  </button>
                )}
              </div>

              {editingProfile ? (
                <>
                  <div className="owlet-field">
                    <label>Display Name</label>
                    <input value={profileForm.displayName}
                      onChange={e => setProfileForm({ ...profileForm, displayName: e.target.value })} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.75rem 0' }}>
                    <input type="checkbox" id="notify"
                      checked={profileForm.notifyByEmail}
                      onChange={e => setProfileForm({ ...profileForm, notifyByEmail: e.target.checked })} />
                    <label htmlFor="notify"
                      style={{ fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'Source Serif 4, serif' }}>
                      Email me about due dates and holds
                    </label>
                  </div>
                  <div className="owlet-form-actions">
                    <button className="owlet-btn owlet-btn-primary" style={{ width: 'auto' }}
                      onClick={handleSaveProfile}>Save</button>
                    <button className="owlet-btn owlet-btn-ghost"
                      onClick={() => setEditingProfile(false)}>Cancel</button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div className="owlet-patron-profile-row">
                    <span>Username</span><span>{patron.username}</span>
                  </div>
                  <div className="owlet-patron-profile-row">
                    <span>Display Name</span><span>{patron.displayName || '—'}</span>
                  </div>
                  <div className="owlet-patron-profile-row">
                    <span>Email</span><span>{patron.email || '—'}</span>
                  </div>
                  <div className="owlet-patron-profile-row">
                    <span>Library Card</span>
                    <span style={{ fontFamily: 'monospace' }}>
                      {patron.profile?.libraryCardNumber || '—'}
                    </span>
                  </div>
                  <div className="owlet-patron-profile-row">
                    <span>Email notifications</span>
                    <span>{patron.profile?.notifyByEmail ? '✅ On' : '❌ Off'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Reading interests */}
            <div className="owlet-patron-profile-card" style={{ marginTop: '1rem' }}>
              <h3 style={{ fontFamily: 'Playfair Display, serif', color: 'var(--purple-deep)', marginBottom: '0.75rem' }}>
                Reading Interests
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                {(patron.profile?.readingInterests || []).map(interest => (
                  <span key={interest} className="owlet-book-subject" style={{ cursor: 'pointer' }}
                    onClick={() => removeInterest(interest)}>
                    {interest} ✕
                  </span>
                ))}
                {!(patron.profile?.readingInterests?.length) && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--ink-light)' }}>
                    Add subjects you enjoy reading.
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  value={interestInput}
                  onChange={e => setInterestInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); addInterest(interestInput); }
                  }}
                  placeholder="e.g. Science Fiction, Local History..."
                  style={{
                    flex: 1, border: '1px solid var(--cream-dark)',
                    borderRadius: '6px', padding: '0.4rem 0.6rem',
                    fontSize: '0.85rem', fontFamily: 'Source Serif 4, serif',
                  }}
                />
                <button type="button" className="owlet-btn-action owlet-btn-edit"
                  onClick={() => addInterest(interestInput)}>Add</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
