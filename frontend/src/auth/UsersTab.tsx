import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import api from '../api';
import ImageUpload from '../components/ImageUpload';
import { Link } from 'react-router-dom';

interface User {
  id: number;
  username: string;
  displayName?: string;
  jobTitle?: string;
  email?: string;
  role: string;
  lastLoginAt?: string;
  createdAt: string;
}

type UserMode = 'list' | 'create' | 'edit';

const emptyUserForm = {
  username: '',
  password: '',
  displayName: '',
  jobTitle: '',
  email: '',
  phone: '',
  location: '',
  bio: '',
  photoUrl: '',
  photoAlt: '',
  role: 'viewer',
  emergencyContact: '',
  notes: '',
};

const ROLES = ['admin', 'editor', 'viewer'];

export default function UsersTab() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [mode, setMode] = useState<UserMode>('list');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyUserForm);
  const [newPassword, setNewPassword] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const authHeader = { headers: { Authorization: `Bearer ${user?.token}` } };

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = () => {
    api.get('/users', authHeader).then(res => setUsers(res.data));
  };

  const notify = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(''); }
    else { setSuccess(msg); setError(''); }
    setTimeout(() => { setSuccess(''); setError(''); }, 4000);
  };

  const handleEdit = (u: User) => {
    setForm({
      username: u.username,
      password: '',
      displayName: u.displayName || '',
      jobTitle: u.jobTitle || '',
      email: u.email || '',
      phone: '',
      location: '',
      bio: '',
      role: u.role,
      emergencyContact: '',
      notes: '',
    });
    setEditingId(u.id);
    setNewPassword('');
    setMode('edit');
  };

  const handleDelete = async (id: number, username: string) => {
    if (id === Number(user?.token)) return; // extra safety
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${id}`, authHeader);
      notify('User deleted.');
      fetchUsers();
    } catch {
      notify('Failed to delete user.', true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { password, ...updateData } = form;
        await api.patch(`/users/${editingId}`, updateData, authHeader);
        if (newPassword) {
          await api.patch(`/users/${editingId}`, { password: newPassword }, authHeader);
        }
        notify('User updated! 🎉');
      } else {
        if (!form.password) return notify('Password is required for new users.', true);
        await api.post('/users', form, authHeader);
        notify('User created! 🎉');
      }
      setMode('list');
      setEditingId(null);
      setForm(emptyUserForm);
      setNewPassword('');
      fetchUsers();
    } catch {
      notify('Something went wrong. Check all fields.', true);
    }
  };

  const handleCancel = () => {
    setMode('list');
    setEditingId(null);
    setForm(emptyUserForm);
    setNewPassword('');
  };

  const roleColor = (role: string) => {
    if (role === 'admin') return 'var(--purple-deep)';
    if (role === 'editor') return 'var(--teal)';
    return 'var(--ink-light)';
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
              onClick={() => { setForm(emptyUserForm); setMode('create'); }}>
              + New User
            </button>
          </div>
          <div className="owlet-admin-list">
            {users.length === 0
              ? <div className="owlet-empty"><p>No users yet.</p></div>
              : users.map(u => (
                <div key={u.id} className="owlet-admin-item">
                  <div className="owlet-admin-item-info">
                    <h3>
                      <Link to={`/staff/${u.username}`} className="owlet-profile-link">
                        {u.displayName || u.username}
                      </Link>
                      <span className="owlet-role-badge" style={{ color: roleColor(u.role) }}>
                        {u.role}
                      </span>
                    </h3>
                    <p>
                      @{u.username}
                      {u.jobTitle && ` · ${u.jobTitle}`}
                      {u.email && ` · ${u.email}`}
                      {u.lastLoginAt && ` · Last login: ${new Date(u.lastLoginAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="owlet-admin-item-actions">
                    <button className="owlet-btn-action owlet-btn-edit"
                      onClick={() => handleEdit(u)}>
                      ✏️ Edit
                    </button>
                    <button className="owlet-btn-action owlet-btn-delete"
                      onClick={() => handleDelete(u.id, u.username)}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))
            }
          </div>
        </>
      )}

      {/* ── CREATE / EDIT FORM ── */}
      {(mode === 'create' || mode === 'edit') && (
        <form className="owlet-admin-form" onSubmit={handleSubmit}>
          <h3 className="owlet-form-title">{editingId ? '✏️ Edit User' : '👤 New User'}</h3>

          <p className="owlet-form-section-label">Account</p>
          <div className="owlet-field-row">
            <div className="owlet-field">
              <label>Username</label>
              <input value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder="jsmith" required />
            </div>
            <div className="owlet-field">
              <label>Role</label>
              <select value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                className="owlet-select">
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {mode === 'create' && (
            <div className="owlet-field">
              <label>Password</label>
              <input type="password" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••" required />
            </div>
          )}

          {mode === 'edit' && (
            <div className="owlet-field">
              <label>Reset Password <span style={{ fontWeight: 300, textTransform: 'none' }}>(leave blank to keep current)</span></label>
              <input type="password" value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password..." />
            </div>
          )}

          <p className="owlet-form-section-label" style={{ marginTop: '1rem' }}>
            Public Profile
          </p>
          <ImageUpload
            currentUrl={form.photoUrl}
            currentAlt={form.photoAlt}
            onUpload={(url, alt) => setForm({ 
              ...form, 
              photoUrl: url,
              photoAlt: alt || '',
            })}
            label="Profile Photo"
            size="medium"
          />
          <div className="owlet-field-row">
            <div className="owlet-field">
              <label>Display Name</label>
              <input value={form.displayName}
                onChange={e => setForm({ ...form, displayName: e.target.value })}
                placeholder="Jane Smith" />
            </div>
            <div className="owlet-field">
              <label>Job Title</label>
              <input value={form.jobTitle}
                onChange={e => setForm({ ...form, jobTitle: e.target.value })}
                placeholder="Children's Librarian" />
            </div>
          </div>
          <div className="owlet-field-row">
            <div className="owlet-field">
              <label>Location / Branch</label>
              <input value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                placeholder="Main Branch" />
            </div>
          </div>
          <div className="owlet-field">
            <label>Bio</label>
            <textarea value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              placeholder="A short bio visible to the public..." rows={3} />
          </div>

          <p className="owlet-form-section-label" style={{ marginTop: '1rem' }}>
            🔒 Private Info
          </p>
          <div className="owlet-field-row">
            <div className="owlet-field">
              <label>Email</label>
              <input type="email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="jane@library.org" />
            </div>
            <div className="owlet-field">
              <label>Phone</label>
              <input value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="555-0100" />
            </div>
          </div>
          <div className="owlet-field">
            <label>Emergency Contact</label>
            <input value={form.emergencyContact}
              onChange={e => setForm({ ...form, emergencyContact: e.target.value })}
              placeholder="Name & phone number" />
          </div>
          <div className="owlet-field">
            <label>Internal Notes</label>
            <textarea value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Admin-only notes about this user..." rows={2} />
          </div>

          <div className="owlet-form-actions">
            <button type="submit" className="owlet-btn owlet-btn-primary" style={{ width: 'auto' }}>
              {editingId ? 'Save Changes' : 'Create User'} 👤
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
