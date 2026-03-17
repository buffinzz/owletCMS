import './App.css';
import { AuthProvider, useAuth } from './auth/AuthContext';
import PageView from './pages/PageView';
import EventsView from './events/EventsView';
import LoginPage from './auth/LoginPage';
import AdminDashboard from './auth/AdminDashboard';
import owletLogo from './assets/owlet-logo.png';

function AppContent() {
  const { isAuthenticated, canEdit } = useAuth();

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
            {!isAuthenticated && <a href="#login">Staff login</a>}
          </nav>
        </div>
      </header>

      {/* Admin dashboard for logged-in editors/admins */}
      {isAuthenticated && canEdit && (
        <div style={{ background: 'var(--cream-dark)', borderBottom: '1px solid var(--cream-dark)' }}>
          <AdminDashboard />
        </div>
      )}

      {/* Hero - only show when not logged in */}
      {!isAuthenticated && (
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
      )}

      {/* Main content */}
      <main className="owlet-main">
        <EventsView />
        <PageView />

        {/* Login section */}
        {!isAuthenticated && (
          <section id="login" style={{ marginTop: '4rem' }}>
            <div className="owlet-section-heading">
              <h2>🔐 Staff Login</h2>
            </div>
            <LoginPage />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="owlet-footer">
        <p>🦉 Owlet CMS — <a href="https://github.com/buffinzz/owletCMS">open source</a> · built for libraries everywhere</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
