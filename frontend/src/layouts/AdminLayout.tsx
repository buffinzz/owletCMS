import AdminDashboard from '../auth/AdminDashboard';
import SiteHeader from '../components/SiteHeader';

export default function AdminLayout() {
  return (
    <div>
      <SiteHeader showBackToSite />
      <main style={{ background: 'var(--cream)', minHeight: '100vh' }}>
        <AdminDashboard />
      </main>
      <footer className="owlet-footer">
        <p>🦉 Owlet CMS — <a href="https://github.com/buffinzz/owletCMS">open source</a></p>
      </footer>
    </div>
  );
}
