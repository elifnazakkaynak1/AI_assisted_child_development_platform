import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import ParentDashboardPage from './pages/ParentDashboardPage';
import SpecialistChildrenPage from './pages/SpecialistChildrenPage';
import ChildTasksPage from './pages/ChildTasksPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

function getHomePathByRole(role) {
  if (role === 'parent') return '/parent/dashboard';
  if (role === 'specialist') return '/specialist/children';
  if (role === 'child') return '/child/tasks';
  return '/login';
}

function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Yükleniyor...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Yükleniyor...</div>;
  }

  if (user) {
    return <Navigate to={getHomePathByRole(user.role)} replace />;
  }

  return children;
}

function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Yükleniyor...</div>;
  }

  return <Navigate to={user ? getHomePathByRole(user.role) : '/login'} replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />

          <Route
            path="/parent/dashboard"
            element={
              <ProtectedRoute allowedRoles={['parent']}>
                <ParentDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/specialist/children"
            element={
              <ProtectedRoute allowedRoles={['specialist']}>
                <SpecialistChildrenPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/child/tasks"
            element={
              <ProtectedRoute allowedRoles={['child']}>
                <ChildTasksPage />
              </ProtectedRoute>
            }
          />

          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;