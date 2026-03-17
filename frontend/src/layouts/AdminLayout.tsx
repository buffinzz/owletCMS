import AdminDashboard from '../auth/AdminDashboard';
import owletLogo from '../assets/owlet-logo.png';
import { Link } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div>
      <header className="owlet-header">
        <div className="owlet-header-inner">
          <Link to="/" className="owlet-logo">
            <img src={owletLogo} alt="Owlet" className="owlet-logo-icon" />
            <span className="owlet-logo-text">
              <span className="owlet-logo-name">Owlet</span>
              <span className="owlet-logo-tagline">Admin</span>
            </span>
          </Link>
          <nav className="owlet-nav">
            <Link to="/">← Back to site</Link>
          </nav>
        </div>
      </header>

      <main style={{ background: 'var(--cream)', minHeight: '100vh' }}>
        <AdminDashboard />
      </main>

      <footer className="owlet-footer">
        <p>🦉 Owlet CMS — <a href="https://github.com/buffinzz/owletCMS">open source</a></p>
      </footer>
    </div>
  );
}