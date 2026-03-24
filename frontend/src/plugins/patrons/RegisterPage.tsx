import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../core/auth/AuthContext';
import { useSettings } from '../../core/settings/SettingsContext';
import owletLogo from '../../assets/owlet-logo.png';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { settings } = useSettings();

  const [registrationEnabled, setRegistrationEnabled] = useState<boolean | null>(null);
  const [requireApproval, setRequireApproval] = useState(false);
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    displayName: '',
    preferredName: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get('/patrons/registration-settings')
      .then(res => {
        setRegistrationEnabled(res.data.selfRegistrationEnabled);
        setRequireApproval(res.data.requireApproval);
      })
      .catch(() => setRegistrationEnabled(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/patrons/register', {
        username: form.username,
        password: form.password,
        email: form.email,
        displayName: form.displayName || form.username,
        preferredName: form.preferredName,
      });

      if (requireApproval) {
        setSuccess(true);
      } else {
        // Auto-login
        const res = await api.post('/auth/login', {
          username: form.username,
          password: form.password,
        });
        login(res.data.username, res.data.access_token, res.data.role);
        navigate('/my-account');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const logoSrc = settings.library_logo_url || owletLogo;
  const siteName = settings.library_name || 'Owlet';

  // Loading
  if (registrationEnabled === null) return null;

  // Disabled
  if (!registrationEnabled) {
    return (
      <div className="owlet-setup-wrap">
        <div className="owlet-setup-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', color: 'var(--purple-deep)' }}>
            Registration Unavailable
          </h2>
          <p style={{ color: 'var(--ink-light)', marginTop: '0.5rem' }}>
            Self-registration is currently disabled. Please contact the library to create an account.
          </p>
          <Link to="/" className="owlet-btn owlet-btn-primary"
            style={{ display: 'inline-block', marginTop: '1.5rem', width: 'auto' }}>
            ← Back to {siteName}
          </Link>
        </div>
      </div>
    );
  }

  // Success (pending approval)
  if (success) {
    return (
      <div className="owlet-setup-wrap">
        <div className="owlet-setup-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', color: 'var(--purple-deep)' }}>
            Registration Submitted!
          </h2>
          <p style={{ color: 'var(--ink-light)', marginTop: '0.5rem', lineHeight: 1.6 }}>
            Your account is pending approval by library staff.
            You'll be able to log in once your account is approved.
          </p>
          <Link to="/" className="owlet-btn owlet-btn-primary"
            style={{ display: 'inline-block', marginTop: '1.5rem', width: 'auto' }}>
            ← Back to {siteName}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="owlet-setup-wrap">
      <div className="owlet-setup-card">
        <div className="owlet-setup-logo">
          <img src={logoSrc} alt={siteName} />
        </div>

        <div className="owlet-setup-body">
          <h1>Create Account</h1>
          <p>Join {siteName} to manage your checkouts and holds.</p>

          {error && <div className="owlet-alert owlet-alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="owlet-setup-fields">
            <div className="owlet-field">
              <label>Username *</label>
              <input
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder="Choose a username"
                autoComplete="username"
                required
              />
            </div>
            <div className="owlet-field">
              <label>Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="your@email.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="owlet-field">
              <label>Display Name</label>
              <input
                value={form.displayName}
                onChange={e => setForm({ ...form, displayName: e.target.value })}
                placeholder="How your name appears"
              />
            </div>
            <div className="owlet-field">
              <label>
                Password *
                <span style={{ fontWeight: 300, textTransform: 'none', fontSize: '0.75rem' }}>
                  {' '}(min 8 characters)
                </span>
              </label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
            </div>
            <div className="owlet-field">
              <label>Confirm Password *</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
            </div>

            <button
              type="submit"
              className="owlet-btn owlet-btn-primary"
              disabled={submitting}
              style={{ marginTop: '0.5rem' }}
            >
              {submitting ? 'Creating account...' : 'Create Account 🪪'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--ink-light)', marginTop: '1rem' }}>
              Already have an account?{' '}
              <Link to="/admin/login" style={{ color: 'var(--purple-mid)' }}>Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
