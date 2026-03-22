import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './core/auth/AuthContext';
import { useEffect, useState } from 'react';
import api from './api';
import PublicLayout from './core/layouts/PublicLayout';
import AdminLayout from './core/layouts/AdminLayout';
import LoginPage from './core/auth/LoginPage';
import StaffDirectory from './core/staff/StaffDirectory';
import StaffProfile from './core/staff/StaffProfile';
import StaffLayout from './core/layouts/StaffLayout';
import SetupWizard from './core/setup/SetupWizard';
import CollectionDetail from "./core/collections/CollectionDetail";

function App() {
  const { isAuthenticated, canEdit } = useAuth();
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null);

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

  // Setup not complete — show wizard for everything
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
      <Route path="/" element={<PublicLayout />} />
      <Route path="/staff" element={<StaffLayout><StaffDirectory /></StaffLayout>} />
      <Route path="/staff/:username" element={<StaffLayout><StaffProfile /></StaffLayout>} />
      <Route path="/admin/login" element={
        isAuthenticated ? <Navigate to="/admin" /> : <LoginPage />
      } />
      <Route path="/admin" element={
        isAuthenticated && canEdit
          ? <AdminLayout />
          : <Navigate to="/admin/login" />
      } />
      <Route path="/setup" element={<Navigate to="/" />} />
      <Route path="/collections/:slug" element={<StaffLayout><CollectionDetail /></StaffLayout>} />
    </Routes>
  );
}

export default App;
