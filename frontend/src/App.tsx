import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import LoginPage from './auth/LoginPage';

function App() {
  const { isAuthenticated, canEdit } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<PublicLayout />} />
      <Route path="/admin/login" element={
        isAuthenticated ? <Navigate to="/admin" /> : <LoginPage />
      } />
      <Route path="/admin" element={
        isAuthenticated && canEdit
          ? <AdminLayout />
          : <Navigate to="/admin/login" />
      } />
    </Routes>
  );
}

export default App;