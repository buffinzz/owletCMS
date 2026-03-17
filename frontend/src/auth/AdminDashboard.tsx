import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import api from '../api';
import owletLogo from '../assets/owlet-logo.png';

type Tab = 'pages' | 'events';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('events');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Event form state
  const [eventForm, setEventForm] = useState({
    title: '', slug: '', description: '',
    startDate: '', location: '', audience: '',
  });

  // Page form state
  const [pageForm, setPageForm] = useState({
    title: '', slug: '', content: '',
  });

  const authHeader = { headers: { Authorization: `Bearer ${user?.token}` } };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/events', { ...eventForm, isPublished: true }, authHeader);
      setSuccess('Event created successfully! 🎉');
      setEventForm({ title: '', slug: '', description: '', startDate: '', location: '', audience: '' });
    } catch {
      setError('Failed to create event. Check all fields and try again.');
    }
  };

  const handlePageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/pages', pageForm, authHeader);
      setSuccess('Page created successfully! 🎉');
      setPageForm({ title: '', slug: '', content: '' });
    } catch {
      setError('Failed to create page. Check all fields and try again.');
    }
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
        <button className="owlet-btn owlet-btn-ghost" onClick={logout}>
          Sign out
        </button>
      </div>

      <div className="owlet-admin-tabs">
        <button
          className={`owlet-tab ${tab === 'events' ? 'active' : ''}`}
          onClick={() => setTab('events')}
        >
          📅 New Event
        </button>
        <button
          className={`owlet-tab ${tab === 'pages' ? 'active' : ''}`}
          onClick={() => setTab('pages')}
        >
          📄 New Page
        </button>
      </div>

      {success && <div className="owlet-alert owlet-alert-success">{success}</div>}
      {error && <div className="owlet-alert owlet-alert-error">{error}</div>}

      {tab === 'events' && (
        <form className="owlet-admin-form" onSubmit={handleEventSubmit}>
          <div className="owlet-field-row">
            <div className="owlet-field">
              <label>Title</label>
              <input
                value={eventForm.title}
                onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                placeholder="Saturday Storytime"
                required
              />
            </div>
            <div className="owlet-field">
              <label>Slug</label>
              <input
                value={eventForm.slug}
                onChange={e => setEventForm({ ...eventForm, slug: e.target.value })}
                placeholder="saturday-storytime"
                required
              />
            </div>
          </div>
          <div className="owlet-field">
            <label>Description</label>
            <textarea
              value={eventForm.description}
              onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
              placeholder="Tell people what to expect..."
              rows={4}
              required
            />
          </div>
          <div className="owlet-field-row">
            <div className="owlet-field">
              <label>Start Date & Time</label>
              <input
                type="datetime-local"
                value={eventForm.startDate}
                onChange={e => setEventForm({ ...eventForm, startDate: e.target.value })}
                required
              />
            </div>
            <div className="owlet-field">
              <label>Location</label>
              <input
                value={eventForm.location}
                onChange={e => setEventForm({ ...eventForm, location: e.target.value })}
                placeholder="Children's Room"
              />
            </div>
            <div className="owlet-field">
              <label>Audience</label>
              <input
                value={eventForm.audience}
                onChange={e => setEventForm({ ...eventForm, audience: e.target.value })}
                placeholder="Ages 2-6"
              />
            </div>
          </div>
          <button type="submit" className="owlet-btn owlet-btn-primary">
            Create Event 🗓️
          </button>
        </form>
      )}

      {tab === 'pages' && (
        <form className="owlet-admin-form" onSubmit={handlePageSubmit}>
          <div className="owlet-field-row">
            <div className="owlet-field">
              <label>Title</label>
              <input
                value={pageForm.title}
                onChange={e => setPageForm({ ...pageForm, title: e.target.value })}
                placeholder="About Us"
                required
              />
            </div>
            <div className="owlet-field">
              <label>Slug</label>
              <input
                value={pageForm.slug}
                onChange={e => setPageForm({ ...pageForm, slug: e.target.value })}
                placeholder="about-us"
                required
              />
            </div>
          </div>
          <div className="owlet-field">
            <label>Content</label>
            <textarea
              value={pageForm.content}
              onChange={e => setPageForm({ ...pageForm, content: e.target.value })}
              placeholder="Page content goes here..."
              rows={8}
              required
            />
          </div>
          <button type="submit" className="owlet-btn owlet-btn-primary">
            Create Page 📄
          </button>
        </form>
      )}
    </div>
  );
}
