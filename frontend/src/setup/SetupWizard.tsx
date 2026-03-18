import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import api from '../api';
import owletLogo from '../assets/owlet-logo.png';

const STEPS = [
  { id: 1, label: 'Welcome', icon: '🦉' },
  { id: 2, label: 'Library', icon: '🏛️' },
  { id: 3, label: 'Contact', icon: '📬' },
  { id: 4, label: 'Appearance', icon: '🎨' },
  { id: 5, label: 'Admin', icon: '🔐' },
];

const THEME_COLOURS = [
  { label: 'Owlet Purple', value: '#3d1f6e' },
  { label: 'Library Teal', value: '#2a9d8f' },
  { label: 'Archive Navy', value: '#1a2744' },
  { label: 'Reading Red', value: '#8b1a1a' },
  { label: 'Forest Green', value: '#2d5a27' },
  { label: 'Amber Gold', value: '#b45309' },
];

export default function SetupWizard() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [settings, setSettings] = useState({
    library_name: '',
    library_tagline: '',
    library_address: '',
    library_city: '',
    library_email: '',
    library_phone: '',
    library_logo_url: '',
    theme_primary_colour: '#3d1f6e',
  });

  const [admin, setAdmin] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const nextStep = () => {
    setError('');
    setStep(s => s + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(s => s - 1);
  };

  const handleSubmit = async () => {
    if (admin.password !== admin.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (admin.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.post('/settings/setup', {
        settings,
        adminUsername: admin.username,
        adminPassword: admin.password,
      });

      // Auto-login the new admin
      const res = await api.post('/auth/login', {
        username: admin.username,
        password: admin.password,
      });
      login(res.data.username, res.data.access_token, res.data.role);
      setStep(6); // done screen
    } catch {
      setError('Setup failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="owlet-setup-wrap">
      <div className="owlet-setup-card">

        {/* Logo */}
        <div className="owlet-setup-logo">
          <img src={owletLogo} alt="Owlet" />
        </div>

        {/* Done screen */}
        {step === 6 && (
          <div className="owlet-setup-done">
            <div className="owlet-setup-done-icon">🎉</div>
            <h1>You're all set!</h1>
            <p>
              <strong>{settings.library_name || 'Your library'}</strong> is ready to go.
              Head to your admin dashboard to start adding content.
            </p>
            <button
              className="owlet-btn owlet-btn-primary"
              style={{ marginTop: '1.5rem' }}
              onClick={() => window.location.href = '/admin'}
            >
              Go to Dashboard 🦉
          </button>
          </div>
        )}

        {step < 6 && (
          <>
            {/* Progress bar */}
            <div className="owlet-setup-progress">
              <div className="owlet-setup-progress-bar">
                <div
                  className="owlet-setup-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="owlet-setup-steps">
                {STEPS.map(s => (
                  <div
                    key={s.id}
                    className={`owlet-setup-step ${step === s.id ? 'active' : ''} ${step > s.id ? 'done' : ''}`}
                  >
                    <span className="owlet-setup-step-icon">
                      {step > s.id ? '✓' : s.icon}
                    </span>
                    <span className="owlet-setup-step-label">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {error && <div className="owlet-alert owlet-alert-error">{error}</div>}

            {/* ── Step 1: Welcome ── */}
            {step === 1 && (
              <div className="owlet-setup-body">
                <h1>Welcome to Owlet</h1>
                <p>
                  Let's get your library set up. This wizard will walk you through
                  configuring your site, appearance, and admin account.
                  It only takes a few minutes!
                </p>
                <p style={{ marginTop: '1rem' }}>
                  You can change any of these settings later from your admin dashboard.
                </p>
                <div className="owlet-setup-actions">
                  <button className="owlet-btn owlet-btn-primary" onClick={nextStep}>
                    Let's go 🦉
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2: Library Info ── */}
            {step === 2 && (
              <div className="owlet-setup-body">
                <h1>🏛️ Your Library</h1>
                <p>Tell us about your library. This will appear on your public site.</p>
                <div className="owlet-setup-fields">
                  <div className="owlet-field">
                    <label>Library Name *</label>
                    <input
                      value={settings.library_name}
                      onChange={e => updateSetting('library_name', e.target.value)}
                      placeholder="Franklin County Public Library"
                      required
                    />
                  </div>
                  <div className="owlet-field">
                    <label>Tagline</label>
                    <input
                      value={settings.library_tagline}
                      onChange={e => updateSetting('library_tagline', e.target.value)}
                      placeholder="Your community knowledge space"
                    />
                  </div>
                </div>
                <div className="owlet-setup-actions">
                  <button className="owlet-btn owlet-btn-ghost" onClick={prevStep}>Back</button>
                  <button
                    className="owlet-btn owlet-btn-primary"
                    onClick={() => {
                      if (!settings.library_name) return setError('Library name is required.');
                      nextStep();
                    }}
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Contact & Location ── */}
            {step === 3 && (
              <div className="owlet-setup-body">
                <h1>📬 Contact & Location</h1>
                <p>How can your community reach you?</p>
                <div className="owlet-setup-fields">
                  <div className="owlet-field-row">
                    <div className="owlet-field">
                      <label>Email</label>
                      <input
                        type="email"
                        value={settings.library_email}
                        onChange={e => updateSetting('library_email', e.target.value)}
                        placeholder="info@library.org"
                      />
                    </div>
                    <div className="owlet-field">
                      <label>Phone</label>
                      <input
                        value={settings.library_phone}
                        onChange={e => updateSetting('library_phone', e.target.value)}
                        placeholder="555-0100"
                      />
                    </div>
                  </div>
                  <div className="owlet-field">
                    <label>Street Address</label>
                    <input
                      value={settings.library_address}
                      onChange={e => updateSetting('library_address', e.target.value)}
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className="owlet-field">
                    <label>City / Region</label>
                    <input
                      value={settings.library_city}
                      onChange={e => updateSetting('library_city', e.target.value)}
                      placeholder="Springfield, ON"
                    />
                  </div>
                </div>
                <div className="owlet-setup-actions">
                  <button className="owlet-btn owlet-btn-ghost" onClick={prevStep}>Back</button>
                  <button className="owlet-btn owlet-btn-primary" onClick={nextStep}>Continue →</button>
                </div>
              </div>
            )}

            {/* ── Step 4: Appearance ── */}
            {step === 4 && (
              <div className="owlet-setup-body">
                <h1>🎨 Appearance</h1>
                <p>Choose a theme colour and optionally upload your library's logo.</p>
                <div className="owlet-setup-fields">
                  <div className="owlet-field">
                    <label>Theme Colour</label>
                    <div className="owlet-colour-grid">
                      {THEME_COLOURS.map(colour => (
                        <button
                          key={colour.value}
                          type="button"
                          className={`owlet-colour-swatch ${settings.theme_primary_colour === colour.value ? 'selected' : ''}`}
                          style={{ background: colour.value }}
                          onClick={() => updateSetting('theme_primary_colour', colour.value)}
                          title={colour.label}
                        >
                          {settings.theme_primary_colour === colour.value && '✓'}
                        </button>
                      ))}
                    </div>
                    <p className="owlet-image-hint" style={{ marginTop: '0.5rem' }}>
                      Selected: {THEME_COLOURS.find(c => c.value === settings.theme_primary_colour)?.label}
                    </p>
                  </div>
                  <div className="owlet-field">
                    <label>Logo URL <span style={{ fontWeight: 300, textTransform: 'none' }}>(optional — you can upload later)</span></label>
                    <input
                      value={settings.library_logo_url}
                      onChange={e => updateSetting('library_logo_url', e.target.value)}
                      placeholder="https://your-library.org/logo.png"
                    />
                  </div>
                </div>
                <div className="owlet-setup-actions">
                  <button className="owlet-btn owlet-btn-ghost" onClick={prevStep}>Back</button>
                  <button className="owlet-btn owlet-btn-primary" onClick={nextStep}>Continue →</button>
                </div>
              </div>
            )}

            {/* ── Step 5: Admin Account ── */}
            {step === 5 && (
              <div className="owlet-setup-body">
                <h1>🔐 Admin Account</h1>
                <p>Create your administrator account. Keep these credentials safe!</p>
                <div className="owlet-setup-fields">
                  <div className="owlet-field">
                    <label>Username *</label>
                    <input
                      value={admin.username}
                      onChange={e => setAdmin({ ...admin, username: e.target.value })}
                      placeholder="admin"
                      required
                    />
                  </div>
                  <div className="owlet-field">
                    <label>Password * <span style={{ fontWeight: 300, textTransform: 'none' }}>(min 8 characters)</span></label>
                    <input
                      type="password"
                      value={admin.password}
                      onChange={e => setAdmin({ ...admin, password: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="owlet-field">
                    <label>Confirm Password *</label>
                    <input
                      type="password"
                      value={admin.confirmPassword}
                      onChange={e => setAdmin({ ...admin, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
                <div className="owlet-setup-actions">
                  <button className="owlet-btn owlet-btn-ghost" onClick={prevStep}>Back</button>
                  <button
                    className="owlet-btn owlet-btn-primary"
                    onClick={() => {
                      if (!admin.username) return setError('Username is required.');
                      handleSubmit();
                    }}
                    disabled={submitting}
                  >
                    {submitting ? 'Setting up...' : 'Finish Setup 🦉'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
