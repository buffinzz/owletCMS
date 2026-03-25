import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import { useAuth } from './core/auth/AuthContext';
import { useIsPluginEnabled } from './plugins/usePlugins';
import api from './api';
import ExhibitsPage from './plugins/exhibits/ExhibitsPage';
import ExhibitDetail from './plugins/exhibits/ExhibitDetail';

// Core layouts
import PublicLayout from './core/layouts/PublicLayout';
import AdminLayout from './core/layouts/AdminLayout';
import StaffLayout from './core/layouts/StaffLayout';

// Core pages
import LoginPage from './core/auth/LoginPage';
import StaffDirectory from './core/staff/StaffDirectory';
import StaffProfile from './core/staff/StaffProfile';
import SetupWizard from './core/setup/SetupWizard';
import CollectionDetail from './core/collections/CollectionDetail';
import CollectionsPage from './core/collections/CollectionsPage';
import EventsPage from './core/events/EventsPage';

// Plugin pages — lazy loaded
const RegisterPage = lazy(() => import('./plugins/patrons/RegisterPage'));
const PatronPortal = lazy(() => import('./plugins/patrons/PatronPortal'));
const ItemDetailPage = lazy(() => import('./plugins/catalog/ItemDetailPage'));


function App() {
  const { isAuthenticated, canEdit, user } = useAuth();
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null);

  const patronsEnabled = useIsPluginEnabled('owlet-plugin-patrons');
  const catalogEnabled = useIsPluginEnabled('owlet-plugin-catalog');
  const exhibitsEnabled = useIsPluginEnabled('owlet-plugin-exhibits');

  useEffect(() => {
    api.get('/settings/setup-status').then(res => {
      setSetupComplete(res.data.isSetupComplete);
    });
  }, []);

  // Still checking setup status
  if (setupComplete === null) {
    return (
      <div className="owlet-loading" style={{ minHeight: '100vh' }}>
        <span /><span /><span />
      </div>
    );
  }

  // Setup not complete — show wizard
  if (!setupComplete) {
    return (
      <Routes>
        <Route path="/setup" element={<SetupWizard />} />
        <Route path="*" element={<Navigate to="/setup" />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* ── Core public routes ── */}
      <Route path="/" element={<PublicLayout />} />
      <Route path="/staff" element={<StaffLayout><StaffDirectory /></StaffLayout>} />
      <Route path="/staff/:username" element={<StaffLayout><StaffProfile /></StaffLayout>} />
      <Route path="/collections" element={<StaffLayout><CollectionsPage /></StaffLayout>} />
      <Route path="/collections/:slug" element={<StaffLayout><CollectionDetail /></StaffLayout>} />
      <Route path="/events" element={<StaffLayout><EventsPage /></StaffLayout>} />

      {/* ── Auth routes ── */}
      <Route path="/admin/login" element={
        !isAuthenticated ? <LoginPage /> :
        user?.role === 'patron' ? <Navigate to="/my-account" /> :
        <Navigate to="/admin" />
      } />
      <Route path="/admin" element={
        !isAuthenticated ? <Navigate to="/admin/login" /> :
        user?.role === 'patron' ? <Navigate to="/my-account" /> :
        canEdit ? <AdminLayout /> :
        <Navigate to="/admin/login" />
      } />
      <Route path="/setup" element={<Navigate to="/" />} />

      {/* ── Plugin routes — only registered if plugin is enabled ── */}
      {patronsEnabled && (
        <Route path="/register" element={
          <Suspense fallback={<div className="owlet-loading"><span /><span /><span /></div>}>
            <RegisterPage />
          </Suspense>
        } />
      )}
      {patronsEnabled && (
        <Route path="/my-account" element={
          <Suspense fallback={<div className="owlet-loading"><span /><span /><span /></div>}>
            <PatronPortal />
          </Suspense>
        } />
      )}
      {catalogEnabled && (
        <Route path="/item/:id" element={
          <StaffLayout>
            <Suspense fallback={<div className="owlet-loading"><span /><span /><span /></div>}>
              <ItemDetailPage />
            </Suspense>
          </StaffLayout>
        } />
      )}
      {exhibitsEnabled && (
        <Route path="/exhibits" element={<StaffLayout><ExhibitsPage /></StaffLayout>} />
      )}
      {exhibitsEnabled && (
        <Route path="/exhibits/:slug" element={<StaffLayout><ExhibitDetail /></StaffLayout>} />
      )}
    </Routes>
  );
}

export default App;
