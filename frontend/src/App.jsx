import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';

function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Yükleniyor...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user.role)) {
    if (user.role === 'parent') return <Navigate to="/parent/dashboard" replace />;
    if (user.role === 'specialist') return <Navigate to="/specialist/children" replace />;
    if (user.role === 'child') return <Navigate to="/child/tasks" replace />;
  }

  return children;
}

// Geçici rol ekranları
function PlaceholderScreen({ title }) {
  const { user, logout } = useAuth();
  return (
    <div style={{ padding: '2rem' }}>
      <h1>{title}</h1>
      <p>Hoş geldiniz, <strong>{user?.name}</strong> (Rol: {user?.role})</p>
      <button onClick={logout} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
        Çıkış Yap
      </button>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/parent/dashboard"
            element={
              <ProtectedRoute allowedRoles={['parent']}>
                <PlaceholderScreen title="Aile Ana Paneli" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/specialist/children"
            element={
              <ProtectedRoute allowedRoles={['specialist']}>
                <PlaceholderScreen title="Uzman Paneli - Bağlı Çocuklar" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/child/tasks"
            element={
              <ProtectedRoute allowedRoles={['child']}>
                <PlaceholderScreen title="Çocuk Paneli - Görevlerim" />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
