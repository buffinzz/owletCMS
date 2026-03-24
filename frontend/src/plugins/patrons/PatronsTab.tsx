import { useState, useEffect } from 'react';
import { useAuth } from '../../core/auth/AuthContext';
import api from '../../api';

interface PatronProfile {
  userId: number;
  libraryCardNumber?: string;
  preferredName?: string;
  isApproved: boolean;
  notifyByEmail: boolean;
  readingInterests?: string[];
  lastLoginAt?: string;
  notes?: string;
}

interface Patron {
  id: number;
  username: string;
  displayName?: string;
  email?: string;
  role: string;
  createdAt: string;
  profile: PatronProfile | null;
}

const emptyForm = {
  username: '',
  password: '',
  email: '',
  displayName: '',
  preferredName: '',
  libraryCardNumber: '',
  notes: '',
};

type Mode = 'list' | 'create' | 'edit' | 'pending';

export default function PatronsTab() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const authHeader = { headers: { Authorization: `Bearer ${user?.token}` } };

  const [patrons, setPatrons] = useState<Patron[]>([]);
  const [pending, setPending] = useState<Patron[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('list');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [registrationSettings, setRegistrationSettings] = useState({
    selfRegistrationEnabled: true,
    requireApproval: false,
    cardPrefix: 'LIB',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPatrons();
    fetchPending();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (searchTimer) clearTimeout(searchTimer);
    const timer = setTimeout(() => fetchPatrons(), 300);
    setSearchTimer(timer);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchPatrons = () => {
    setLoading(true);
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    api.get(`/patrons${params}`, authHeader)
      .then(res => setPatrons(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchPending = () => {
    api.get('/patrons/pending', authHeader)
      .then(res => setPending(res.data))
      .catch(() => {});
  };

  const fetchSettings = () => {
    api.get('/patrons/registration-settings')
      .then(res => setRegistrationSettings(res.data))
      .catch(() => {});
  };

  const notify = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(''); }
    else { setSuccess(msg); setError(''); }
    setTimeout(() => { setSuccess(''); setError(''); }, 4000);
  };

  const handleEdit = (patron: Patron) => {
    setForm({
      username: patron.username,
      password: '',
      email: patron.email || '',
      displayName: patron.displayName || '',
      preferredName: patron.profile?.preferredName || '',
      libraryCardNumber: patron.profile?.libraryCardNumber || '',
      notes: patron.profile?.notes || '',
    });
    setEditingId(patron.id);
    setMode('edit');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.patch(`/patrons/${editingId}`, {
          displayName: form.displayName,
          email: form.email,
          profile: {
            preferredName: form.preferredName,
            libraryCardNumber: form.libraryCardNumber,
            notes: form.notes,
          },
        }, authHeader);
        if (form.password) {
          await api.patch(`/patrons/${editingId}/reset-password`, { password: form.password }, authHeader);
        }
        notify('Patron updated! 🎉');
      } else {
        await api.post('/patrons', form, authHeader);
        notify('Patron created! 🎉');
      }
      handleCancel();
      fetchPatrons();
    } catch (err: any) {
      notify(err.response?.data?.message || 'Something went wrong.', true);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.patch(`/patrons/${id}/approve`, {}, authHeader);
      notify('Patron approved! ✅');
      fetchPatrons();
      fetchPending();
    } catch {
      notify('Failed to approve.', true);
    }
  };

  const handleCancel = () => {
    setMode('list');
    setEditingId(null);
    setForm(emptyForm);
  };

  return (
    <div>
      {success && <div className="owlet-alert owlet-alert-success">{success}</div>}
      {error && <div className="owlet-alert owlet-alert-error">{error}</div>}

      {/* ── LIST ── */}
      {(mode === 'list' || mode === 'pending') && (
        <>
          {/* Registration settings banner */}
          <div className="owlet-patron-settings-banner">
            <span>
              🪪 Self-registration is{' '}
              <strong>{registrationSettings.selfRegistrationEnabled ? 'enabled' : 'disabled'}</strong>
              {registrationSettings.requireApproval && ' · Requires approval'}
              {' '}· Card prefix: <code>{registrationSettings.cardPrefix}</code>
            </span>
          </div>

          <div className="owlet-catalog-filters">
            <button
              className={`owlet-media-filter ${mode === 'list' ? 'active' : ''}`}
              onClick={() => setMode('list')}
            >
              👥 All Patrons ({patrons.length})
            </button>
            {pending.length > 0 && (
              <button
                className={`owlet-media-filter ${mode === 'pending' ? 'active' : ''}`}
                onClick={() => setMode('pending')}
              >
                ⏳ Pending Approval ({pending.length})
              </button>
            )}
            <input
              className="owlet-catalog-search"
              placeholder="Search name, email, card number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              className="owlet-btn owlet-btn-primary owlet-btn-new"
              onClick={() => { setForm(emptyForm); setMode('create'); }}
            >
              + New Patron
            </button>
          </div>

          <div className="owlet-admin-list">
            {loading ? (
              <div className="owlet-loading"><span /><span /><span /></div>
            ) : (
              (mode === 'pending' ? pending : patrons).map(patron => (
                <div key={patron.id} className="owlet-admin-item">
                  <div className="owlet-patron-avatar">
                    {(patron.displayName || patron.username).charAt(0).toUpperCase()}
                  </div>
                  <div className="owlet-admin-item-info" style={{ flex: 1, minWidth: 0 }}>
                    <h3>
                      {patron.displayName || patron.username}
                      {!patron.profile?.isApproved && (
                        <span className="owlet-catalog-hidden-badge">pending</span>
                      )}
                    </h3>
                    <p>
                      {patron.username}
                      {patron.email && ` · ${patron.email}`}
                      {patron.profile?.libraryCardNumber && (
                        <span style={{ fontFamily: 'monospace', marginLeft: '0.4rem' }}>
                          · {patron.profile.libraryCardNumber}
                        </span>
                      )}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--ink-light)' }}>
                      Registered {new Date(patron.createdAt).toLocaleDateString()}
                      {patron.profile?.lastLoginAt && (
                        ` · Last login ${new Date(patron.profile.lastLoginAt).toLocaleDateString()}`
                      )}
                    </p>
                  </div>
                  <div className="owlet-admin-item-actions">
                    {!patron.profile?.isApproved && (
                      <button className="owlet-btn-action owlet-btn-edit"
                        onClick={() => handleApprove(patron.id)}>
                        ✅ Approve
                      </button>
                    )}
                    <button className="owlet-btn-action owlet-btn-edit"
                      onClick={() => handleEdit(patron)}>
                      ✏️ Edit
                    </button>
                  </div>
                </div>
              ))
            )}
            {!loading && (mode === 'list' ? patrons : pending).length === 0 && (
              <div className="owlet-empty">
                <p>{mode === 'pending' ? 'No pending approvals.' : 'No patrons yet.'}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── CREATE / EDIT ── */}
      {(mode === 'create' || mode === 'edit') && (
        <form className="owlet-admin-form" onSubmit={handleSubmit}>
          <h3 className="owlet-form-title">
            {editingId ? '✏️ Edit Patron' : '🪪 New Patron'}
          </h3>

          <p className="owlet-form-section-label">Account</p>
          <div className="owlet-field-row">
            <div className="owlet-field">
              <label>Username *</label>
              <input
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                disabled={!!editingId}
                required
              />
            </div>
            <div className="owlet-field">
              <label>
                Password
                {editingId && (
                  <span style={{ fontWeight: 300, textTransform: 'none', fontSize: '0.75rem' }}>
                    {' '}(leave blank to keep current)
                  </span>
                )}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required={!editingId}
                placeholder={editingId ? '••••••••' : ''}
              />
            </div>
          </div>
          <div className="owlet-field-row">
            <div className="owlet-field">
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="owlet-field">
              <label>Display Name</label>
              <input
                value={form.displayName}
                onChange={e => setForm({ ...form, displayName: e.target.value })}
              />
            </div>
          </div>

          <p className="owlet-form-section-label" style={{ marginTop: '1rem' }}>Patron Details</p>
          <div className="owlet-field-row">
            <div className="owlet-field">
              <label>Preferred Name</label>
              <input
                value={form.preferredName}
                onChange={e => setForm({ ...form, preferredName: e.target.value })}
                placeholder="Name they prefer to be called"
              />
            </div>
            <div className="owlet-field">
              <label>
                Library Card Number
                <span style={{ fontWeight: 300, textTransform: 'none', fontSize: '0.75rem' }}>
                  {' '}(auto-generated if blank)
                </span>
              </label>
              <input
                value={form.libraryCardNumber}
                onChange={e => setForm({ ...form, libraryCardNumber: e.target.value })}
                placeholder={`${registrationSettings.cardPrefix}00000001`}
              />
            </div>
          </div>
          <div className="owlet-field">
            <label>Staff Notes <span style={{ fontWeight: 300, textTransform: 'none', fontSize: '0.75rem' }}>(not visible to patron)</span></label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Internal notes about this patron..."
            />
          </div>

          <div className="owlet-form-actions" style={{ marginTop: '1.5rem' }}>
            <button type="submit" className="owlet-btn owlet-btn-primary" style={{ width: 'auto' }}>
              {editingId ? 'Save Changes' : 'Create Patron'} 🪪
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
