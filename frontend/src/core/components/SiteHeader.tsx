import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import owletLogo from '../../assets/owlet-logo.png';
import { useSettings } from '../settings/SettingsContext';
import { useNavigation, resolveHref } from '../navigation/NavigationContext';
import type { NavItem } from '../navigation/NavigationContext';

export default function SiteHeader() {
  const { settings } = useSettings();
  const { navItems } = useNavigation();
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logoSrc = settings.library_logo_url || owletLogo;
  const siteName = settings.library_name || 'Owlet';
  const tagline = settings.library_tagline || 'Knowledge that connects';
  const logoAlt = (settings as any).library_logo_alt || siteName;

  const handleMouseEnter = (id: number) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenDropdown(id);
  };

  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setOpenDropdown(null), 150);
  };

  const isExternal = (item: NavItem) =>
    item.type === 'url' && (item.value?.startsWith('http') || item.value?.startsWith('//'));

  const renderLink = (item: NavItem, className?: string, onClick?: () => void) => {
    const href = resolveHref(item);
    const external = isExternal(item);

    if (external) {
      return (
        <a
          key={item.id}
          href={href}
          target={item.target || '_blank'}
          rel="noopener noreferrer"
          className={className}
          onClick={onClick}
        >
          {item.label}
        </a>
      );
    }

    return (
      <Link
        key={item.id}
        to={href}
        className={className}
        onClick={onClick}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <header className="owlet-header">
      <div className="owlet-header-inner">
        {/* Logo */}
        <Link to="/" className="owlet-logo">
          <img src={logoSrc} alt={logoAlt} className="owlet-logo-icon" />
          <span className="owlet-logo-text">
            <span className="owlet-logo-name">{siteName}</span>
            <span className="owlet-logo-tagline">{tagline}</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="owlet-nav">
          {navItems.map(item => {
            const hasChildren = item.children && item.children.length > 0;

            if (hasChildren) {
              const hasLink = item.value && item.value.length > 0;

              return (
                <div
                  key={item.id}
                  className="owlet-nav-dropdown"
                  onMouseEnter={() => handleMouseEnter(item.id)}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Trigger — link if has value, button if not */}
                  <div className="owlet-nav-dropdown-trigger-wrap">
                    {hasLink
                      ? renderLink(item, 'owlet-nav-dropdown-link')
                      : <span className="owlet-nav-dropdown-label">{item.label}</span>
                    }
                    <span className="owlet-nav-caret">▾</span>
                  </div>

                  {/* Dropdown menu */}
                  {openDropdown === item.id && (
                    <div
                      className="owlet-nav-dropdown-menu"
                      onMouseEnter={() => handleMouseEnter(item.id)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {item.children.map(child =>
                        renderLink(child, 'owlet-nav-dropdown-item')
                      )}
                    </div>
                  )}
                </div>
              );
            }

            // Simple link
            return renderLink(item);
          })}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="owlet-nav-hamburger"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="owlet-nav-mobile">
          {navItems.map(item => (
            <div key={item.id}>
              {renderLink(item, 'owlet-nav-mobile-item', () => setMobileOpen(false))}
              {item.children?.map(child =>
                renderLink(child, 'owlet-nav-mobile-child', () => setMobileOpen(false))
              )}
            </div>
          ))}
        </nav>
      )}
    </header>
  );
}
