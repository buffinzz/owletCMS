import './App.css';
import PageView from './pages/PageView';
import owletLogo from './assets/logo.png';

function App() {
  return (
    <div>
      {/* Header */}
      <header className="owlet-header">
        <div className="owlet-header-inner">
          <a href="/" className="owlet-logo">
            <img src={owletLogo} alt="Owlet" className="owlet-logo-icon" />
            <span className="owlet-logo-text">
              <span className="owlet-logo-name">Owlet</span>
              <span className="owlet-logo-tagline">Knowledge that connects</span>
            </span>
          </a>
          <nav className="owlet-nav">
            <a href="#">Collections</a>
            <a href="#">Events</a>
            <a href="#">Resources</a>
            <a href="#">About</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
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

      {/* Main content */}
      <main className="owlet-main">
        <PageView />
      </main>

      {/* Footer */}
      <footer className="owlet-footer">
        <p>🦉 Owlet CMS — <a href="https://github.com/buffinzz/owletCMS">open source</a> · built for libraries everywhere</p>
      </footer>
    </div>
  );
}

export default App;
