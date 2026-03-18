import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import owletLogo from '../assets/owlet-logo.png';

type Tab = 'events' | 'pages';
type Mode = 'list' | 'create' | 'edit';

interface Event {
  id: number;
  title: string;
  slug: string;
  description: string;
  startDate: string;
  endDate?: string;
  location?: string;
  audience?: string;
  isPublished: boolean;
}

interface Page {
  id: number;
  title: string;
  slug: string;
  content: string;
}

const emptyEvent = {
  title: '', slug: '', description: '',
  startDate: '', location: '', audience: '', isPublished: true,
};

const emptyPage = { title: '', slug: '', content: '' };

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('events');
  const [mode, setMode] = useState<Mode>('list');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [events, setEvents] = useState<Event[]>([]);
  const [pages, setPages] = useState<Page[]>([]);

  const [eventForm, setEventForm] = useState(emptyEvent);
  const [pageForm, setPageForm] = useState(emptyPage);
  const [editingId, setEditingId] = useState<number | null>(null);

  const authHeader = { headers: { Authorization: `Bearer ${user?.token}` } };
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchEvents();
    fetchPages();
  }, []);

  const fetchEvents = () => api.get('/events').then(res => setEvents(res.data));
  const fetchPages = () => api.get('/pages').then(res => setPages(res.data));

  const notify = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(''); }
    else { setSuccess(msg); setError(''); }
    setTimeout(() => { setSuccess(''); setError(''); }, 4000);
  };

  // ── Events CRUD ──
  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.patch(`/events/${editingId}`, eventForm, authHeader);
        notify('Event updated! 🎉');
      } else {
        await api.post('/events', eventForm, authHeader);
        notify('Event created! 🎉');
      }
      setEventForm(emptyEvent);
      setMode('list');
      setEditingId(null);
      fetchEvents();
    } catch {
      notify('Something went wrong. Check all fields.', true);
    }
  };

  const handleEditEvent = (event: Event) => {
    setEventForm({
      title: event.title,
      slug: event.slug,
      description: event.description,
      startDate: event.startDate.slice(0, 16),
      location: event.location || '',
      audience: event.audience || '',
      isPublished: event.isPublished,
    });
    setEditingId(event.id);
    setMode('edit');
    setTab('events');
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm('Delete this event? This cannot be undone.')) return;
    try {
      await api.delete(`/events/${id}`, authHeader);
      notify('Event deleted.');
      fetchEvents();
    } catch {
      notify('Failed to delete event.', true);
    }
  };

  // ── Pages CRUD ──
  const handlePageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.patch(`/pages/${editingId}`, pageForm, authHeader);
        notify('Page updated! 🎉');
      } else {
        await api.post('/pages', pageForm, authHeader);
        notify('Page created! 🎉');
      }
      setPageForm(emptyPage);
      setMode('list');
      setEditingId(null);
      fetchPages();
    } catch {
      notify('Something went wrong. Check all fields.', true);
    }
  };

  const handleEditPage = (page: Page) => {
    setPageForm({ title: page.title, slug: page.slug, content: page.content });
    setEditingId(page.id);
    setMode('edit');
    setTab('pages');
  };

  const handleDeletePage = async (id: number) => {
    if (!confirm('Delete this page? This cannot be undone.')) return;
    try {
      await api.delete(`/pages/${id}`, authHeader);
      notify('Page deleted.');
      fetchPages();
    } catch {
      notify('Failed to delete page.', true);
    }
  };

  const handleNew = () => {
    setEventForm(emptyEvent);
    setPageForm(emptyPage);
    setEditingId(null);
    setMode('create');
  };

  const handleCancel = () => {
    setEventForm(emptyEvent);
    setPageForm(emptyPage);
    setEditingId(null);
    setMode('list');
  };

  return (
    <div className="owlet-admin">
      <div className="owlet-admin-header">
        <div className="owlet-admin-title">
          <span><img src={owletLogo} alt="Owlet" className="owlet-logo-icon" /></span>
          <div>
            <h2>Admin Dashboard</h2>
            <p>Signed in as <strong>{user?.username}</strong> · {user?.role}</p>
          </div>
        </div>
        <button className="owlet-btn owlet-btn-ghost" onClick={() => { logout(); navigate('/'); }}>
          Sign out
        </button>
      </div>

      {success && <div className="owlet-alert owlet-alert-success">{success}</div>}
      {error && <div className="owlet-alert owlet-alert-error">{error}</div>}

      <div className="owlet-admin-tabs">
        <button className={`owlet-tab ${tab === 'events' ? 'active' : ''}`}
          onClick={() => { setTab('events'); setMode('list'); setEditingId(null); }}>
          📅 Events
        </button>
        <button className={`owlet-tab ${tab === 'pages' ? 'active' : ''}`}
          onClick={() => { setTab('pages'); setMode('list'); setEditingId(null); }}>
          📄 Pages
        </button>
        <button className="owlet-btn owlet-btn-primary owlet-btn-new" onClick={handleNew}>
          + New {tab === 'events' ? 'Event' : 'Page'}
        </button>
      </div>

      {/* ── LIST: Events ── */}
      {mode === 'list' && tab === 'events' && (
        <div className="owlet-admin-list">
          {events.length === 0
            ? <div className="owlet-empty"><p>No events yet — click + New Event to add one.</p></div>
            : events.map(event => (
              <div key={event.id} className="owlet-admin-item">
                <div className="owlet-admin-item-info">
                  <h3>{event.title}</h3>
                  <p>📅 {new Date(event.startDate).toLocaleDateString()}{event.location && ` · 📍 ${event.location}`}</p>
                </div>
                <div className="owlet-admin-item-actions">
                  <button className="owlet-btn-action owlet-btn-edit" onClick={() => handleEditEvent(event)}>✏️ Edit</button>
                  {isAdmin && <button className="owlet-btn-action owlet-btn-delete" onClick={() => handleDeleteEvent(event.id)}>🗑️ Delete</button>}
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* ── LIST: Pages ── */}
      {mode === 'list' && tab === 'pages' && (
        <div className="owlet-admin-list">
          {pages.length === 0
            ? <div className="owlet-empty"><p>No pages yet — click + New Page to add one.</p></div>
            : pages.map(page => (
              <div key={page.id} className="owlet-admin-item">
                <div className="owlet-admin-item-info">
                  <h3>{page.title}</h3>
                  <p>/{page.slug}</p>
                </div>
                <div className="owlet-admin-item-actions">
                  <button className="owlet-btn-action owlet-btn-edit" onClick={() => handleEditPage(page)}>✏️ Edit</button>
                  {isAdmin && <button className="owlet-btn-action owlet-btn-delete" onClick={() => handleDeletePage(page.id)}>🗑️ Delete</button>}
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* ── FORM: Events ── */}
      {(mode === 'create' || mode === 'edit') && tab === 'events' && (
        <form className="owlet-admin-form" onSubmit={handleEventSubmit}>
          <h3 className="owlet-form-title">{editingId ? '✏️ Edit Event' : '📅 New Event'}</h3>
          <div className="owlet-field-row">
            <div className="owlet-field">
              <label>Title</label>
              <input value={eventForm.title} onChange={e => setEventForm({ ...eventForm, title: e.target.value })} placeholder="Saturday Storytime" required />
            </div>
            <div className="owlet-field">
              <label>Slug</label>
              <input value={eventForm.slug} onChange={e => setEventForm({ ...eventForm, slug: e.target.value })} placeholder="saturday-storytime" required />
            </div>
          </div>
          <div className="owlet-field">
            <label>Description</label>
            <textarea value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} placeholder="Tell people what to expect..." rows={4} required />
          </div>
          <div className="owlet-field-row">
            <div className="owlet-field">
              <label>Start Date & Time</label>
              <input type="datetime-local" value={eventForm.startDate} onChange={e => setEventForm({ ...eventForm, startDate: e.target.value })} required />
            </div>
            <div className="owlet-field">
              <label>Location</label>
              <input value={eventForm.location} onChange={e => setEventForm({ ...eventForm, location: e.target.value })} placeholder="Children's Room" />
            </div>
            <div className="owlet-field">
              <label>Audience</label>
              <input value={eventForm.audience} onChange={e => setEventForm({ ...eventForm, audience: e.target.value })} placeholder="Ages 2-6" />
            </div>
          </div>
          <div className="owlet-form-actions">
            <button type="submit" className="owlet-btn owlet-btn-primary" style={{ width: 'auto' }}>
              {editingId ? 'Save Changes' : 'Create Event'} 🗓️
            </button>
            <button type="button" className="owlet-btn owlet-btn-ghost" onClick={handleCancel}>Cancel</button>
          </div>
        </form>
      )}

      {/* ── FORM: Pages ── */}
      {(mode === 'create' || mode === 'edit') && tab === 'pages' && (
        <form className="owlet-admin-form" onSubmit={handlePageSubmit}>
          <h3 className="owlet-form-title">{editingId ? '✏️ Edit Page' : '📄 New Page'}</h3>
          <div className="owlet-field-row">
            <div className="owlet-field">
              <label>Title</label>
              <input value={pageForm.title} onChange={e => setPageForm({ ...pageForm, title: e.target.value })} placeholder="About Us" required />
            </div>
            <div className="owlet-field">
              <label>Slug</label>
              <input value={pageForm.slug} onChange={e => setPageForm({ ...pageForm, slug: e.target.value })} placeholder="about-us" required />
            </div>
          </div>
          <div className="owlet-field">
            <label>Content</label>
            <textarea value={pageForm.content} onChange={e => setPageForm({ ...pageForm, content: e.target.value })} placeholder="Page content goes here..." rows={8} required />
          </div>
          <div className="owlet-form-actions">
            <button type="submit" className="owlet-btn owlet-btn-primary" style={{ width: 'auto' }}>
              {editingId ? 'Save Changes' : 'Create Page'} 📄
            </button>
            <button type="button" className="owlet-btn owlet-btn-ghost" onClick={handleCancel}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
