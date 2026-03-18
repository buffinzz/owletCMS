import { Link } from 'react-router-dom';
import PageView from '../pages/PageView';
import EventsView from '../events/EventsView';
import owletLogo from '../assets/owlet-logo.png';

export default function PublicLayout() {
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
            <a href="#">Collections</a>
            <a href="#">Events</a>
            <a href="#">Resources</a>
            
            <Link to="/staff">Staff</Link>
          </nav>
        </div>
      </header>

      <section className="owlet-hero">
        <div className="owlet-hero-inner">
          <div className="owlet-hero-text">
            <h1>Your library,<br /><em>beautifully connected.</em></h1>
            <p>
              Owlet helps public libraries share their collections, events, and
              resources with their communities — simply, openly, and with care.
            </p>
          </div>
          <div className="owlet-hero-mascot">
            <img src={owletLogo} alt="Owlet mascot" />
          </div>
        </div>
      </section>

      <main className="owlet-main">
        <EventsView />
        <PageView />
      </main>

      <footer className="owlet-footer">
        <p>🦉 Owlet CMS — <a href="https://github.com/buffinzz/owletCMS">open source</a> · built for libraries everywhere</p>
        <Link to="/admin/login">Staff login</Link>
      </footer>
    </div>
  );
}