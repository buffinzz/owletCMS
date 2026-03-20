import { Link } from 'react-router-dom';
import owletLogo from '../assets/owlet-logo.png';
import { useSettings } from '../settings/SettingsContext';
import { useAuth } from '../auth/AuthContext';

interface SiteHeaderProps {
  showAdminLink?: boolean;
  showBackToSite?: boolean;
  extraNav?: React.ReactNode;
}

export default function SiteHeader({ showAdminLink, showBackToSite, extraNav }: SiteHeaderProps) {
  const { settings } = useSettings();
  const { isAuthenticated } = useAuth();

  const logoSrc = settings.library_logo_url || owletLogo;
  const siteName = settings.library_name || 'Owlet';
  const tagline = settings.library_tagline || 'Knowledge that connects';
  const logoAlt = settings.library_logo_alt || siteName;

  return (
    <header className="owlet-header">
      <div className="owlet-header-inner">
        <Link to="/" className="owlet-logo">
          <img src={logoSrc} alt={logoAlt} className="owlet-logo-icon" />
          <span className="owlet-logo-text">
            <span className="owlet-logo-name">{siteName}</span>
            <span className="owlet-logo-tagline">{tagline}</span>
          </span>
        </Link>
        <nav className="owlet-nav">
          {showBackToSite && <Link to="/">← Back to site</Link>}
          {!showBackToSite && (
            <>
              <Link to="/staff">Staff</Link>
              <a href="#">Collections</a>
              <a href="#">Events</a>
              {!isAuthenticated && showAdminLink && <Link to="/admin/login">Staff login</Link>}
            </>
          )}
          {extraNav}
        </nav>
      </div>
    </header>
  );
}
