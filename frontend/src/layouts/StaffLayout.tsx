import { ReactNode } from 'react';
import { useSettings } from '../settings/SettingsContext';
import SiteHeader from '../components/SiteHeader';

export default function StaffLayout({ children }: { children: ReactNode }) {
  const { settings } = useSettings();

  return (
    <div>
      <SiteHeader showAdminLink />
      {children}
      <footer className="owlet-footer">
        <p>
          {settings.library_name
            ? <span>🦉 {settings.library_name} · <a href="https://github.com/buffinzz/owletCMS">Powered by Owlet</a></span>
            : <span>🦉 Owlet CMS — <a href="https://github.com/buffinzz/owletCMS">open source</a></span>
          }
        </p>
      </footer>
    </div>
  );
}
