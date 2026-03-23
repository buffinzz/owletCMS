import { Link } from 'react-router-dom';
import PageView from '../pages/PageView';
import EventsView from '../events/EventsView';
import owletLogo from '../../assets/owlet-logo.png';
import { useSettings } from '../settings/SettingsContext';
import NewArrivals from '../../plugins/catalog/NewArrivals';
import FeaturedCollections from '../collections/FeaturedCollections';
import DigitalResources from '../../plugins/digital-resources/DigitalResources';
import SiteHeader from '../components/SiteHeader';

export default function PublicLayout() {
  const { settings } = useSettings();

  const logoSrc = settings.library_logo_url || owletLogo;
  const siteName = settings.library_name || 'Owlet';
  const tagline = settings.library_tagline || 'Knowledge that connects';

  return (
    <div>
      <SiteHeader />

      <section className="owlet-hero">
        <div className="owlet-hero-inner">
          <div className="owlet-hero-text">
            <h1>Your library,<br /><em>beautifully connected.</em></h1>
            <p>
              {tagline !== 'Knowledge that connects'
                ? tagline
                : 'Owlet helps public libraries share their collections, events, and resources with their communities — simply, openly, and with care.'}
            </p>
          </div>
          <div className="owlet-hero-mascot">
            <img src={owletLogo} alt="Owlet mascot" />
          </div>
        </div>
      </section>

      <main className="owlet-main">
        <EventsView />
        <FeaturedCollections />
        <DigitalResources />
        <NewArrivals count={20} />
        <PageView />
      </main>

      <footer className="owlet-footer">
        <p>
          {settings.library_name && <span>{settings.library_name} · </span>}
          {settings.library_address && <span>{settings.library_address}{settings.library_city ? `, ${settings.library_city}` : ''} · </span>}
          {settings.library_phone && <span>{settings.library_phone} · </span>}
          {settings.library_email && <a href={`mailto:${settings.library_email}`}>{settings.library_email}</a>}
          {!settings.library_name && (
            <span>🦉 Owlet CMS — <a href="https://github.com/buffinzz/owletCMS">open source</a> · built for libraries everywhere</span>
          )}
        </p>
      </footer>
    </div>
  );
}
