import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import owletLogo from '../assets/owlet-logo.png';

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <header className="owlet-header">
        <div className="owlet-header-inner">
          <Link to="/" className="owlet-logo">
            <img src={owletLogo} alt="Owlet" className="owlet-logo-icon" />
            <span className="owlet-logo-text">
              <span className="owlet-logo-name">Owlet</span>
              <span className="owlet-logo-tagline">Knowledge that connects</span>
            </span>
          </Link>
          <nav className="owlet-nav">
            <Link to="/">Home</Link>
            <Link to="/staff">Staff</Link>
            <Link to="/admin/login">Staff login</Link>
          </nav>
        </div>
      </header>

      {children}

      <footer className="owlet-footer">
        <p>🦉 Owlet CMS — <a href="https://github.com/buffinzz/owletCMS">open source</a> · built for libraries everywhere</p>
      </footer>
    </div>
  );
}
