import { useSettings } from '../settings/SettingsContext';
import SiteHeader from '../components/SiteHeader';
import PageView from '../pages/PageView';
import EventsView from '../events/EventsView';
import { usePlugins } from '../../plugins/usePlugins';

// Core components — always rendered
import FeaturedCollections from '../collections/FeaturedCollections';

// Plugin components — only rendered if plugin is enabled
import { lazy, Suspense } from 'react';
const NewArrivals = lazy(() => import('../../plugins/catalog/NewArrivals'));
const DigitalResources = lazy(() => import('../../plugins/digital-resources/DigitalResources'));

export default function PublicLayout() {
  const { settings } = useSettings();
  const { plugins, loading: pluginsLoading } = usePlugins();

  const hasPlugin = (name: string) => plugins.some(p => p.name === name);

  const logoSrc = settings.library_logo_url;
  const siteName = settings.library_name || 'Owlet Library';

  return (
    <div>
      <SiteHeader />

      {/* Hero */}
      <section className="owlet-hero">
        <div className="owlet-hero-inner">
          <div className="owlet-hero-text">
            <h1>{siteName}.</h1>
            <p>{settings.library_tagline || 'Knowledge that connects.'}</p>
            {(settings.library_address || settings.library_city) && (
              <p className="owlet-hero-address">
                📍 {[settings.library_address, settings.library_city].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
          {logoSrc && (
            <div className="owlet-hero-logo">
              <img src={logoSrc} alt={(settings as any).library_logo_alt || siteName} />
            </div>
          )}
        </div>
      </section>

      <main className="owlet-main">
        {/* Plugin content — only shown if plugin is enabled */}
        {!pluginsLoading && hasPlugin('owlet-plugin-catalog') && (
          <Suspense fallback={null}>
            <NewArrivals count={20} />
          </Suspense>
        )}

        {/* Core — always shown */}
        <FeaturedCollections />

        {!pluginsLoading && hasPlugin('owlet-plugin-digital-resources') && (
          <Suspense fallback={null}>
            <DigitalResources />
          </Suspense>
        )}

        <EventsView />
        <PageView />
      </main>

      {/* Footer */}
      <footer className="owlet-footer">
        <div className="owlet-footer-inner">
          <span>
            {logoSrc && (
              <img src={logoSrc} alt={siteName}
                style={{ height: '1.25rem', verticalAlign: 'middle', marginRight: '0.4rem' }} />
            )}
            {siteName}
          </span>
          <span>·</span>
          <span>Powered by <a href="https://github.com/buffinzz/owletCMS"
            target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--amber-light)' }}>Owlet</a></span>
        </div>
      </footer>
    </div>
  );
}
