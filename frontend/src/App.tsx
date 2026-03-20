import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { useEffect, useState } from 'react';
import api from './api';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import LoginPage from './auth/LoginPage';
import StaffDirectory from './staff/StaffDirectory';
import StaffProfile from './staff/StaffProfile';
import StaffLayout from './layouts/StaffLayout';
import SetupWizard from './setup/SetupWizard';
import CollectionDetail from './catalog/CollectionDetail';

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
