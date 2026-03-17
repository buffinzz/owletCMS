import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import api from '../api';
import owletLogo from '../assets/owlet-logo.png';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      login(res.data.username, res.data.access_token, res.data.role);
    } catch {
      setError('Invalid username or password.');
    } finally {
      navigate('/admin');
      setLoading(false);
    }
  };

  return (
    <div className="owlet-login-wrap">
      <div className="owlet-login-card">
        <div className="owlet-login-logo">
          <img src={owletLogo} alt="Owlet" />
        </div>
        <h1>Welcome back</h1>
        <p className="owlet-login-sub">Sign in to manage your library</p>

        <form className="owlet-login-form" onSubmit={handleSubmit}>
          <div className="owlet-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="your username"
              required
              autoFocus
            />
          </div>
          <div className="owlet-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="owlet-login-error">{error}</p>}
          <button
            type="submit"
            className="owlet-btn owlet-btn-primary"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in 🦉'}
          </button>
        </form>
      </div>
    </div>
  );
}
