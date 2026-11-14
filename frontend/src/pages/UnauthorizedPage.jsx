import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function UnauthorizedPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleGoHome = () => {
    if (!user) {
      navigate('/login', { replace: true });
    } else if (user.role === 'parent') {
      navigate('/parent/dashboard', { replace: true });
    } else if (user.role === 'specialist') {
      navigate('/specialist/children', { replace: true });
    } else if (user.role === 'child') {
      navigate('/child/tasks', { replace: true });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#fafaf9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '450px',
          width: '100%',
          backgroundColor: '#fff',
          padding: '2.5rem',
          borderRadius: '10px',
          border: '1px solid #e7e5e4',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            display: 'inline-block',
            padding: '0.4rem 0.9rem',
            borderRadius: '999px',
            fontWeight: 600,
            fontSize: '0.85rem',
            marginBottom: '1rem',
          }}
        >
          403 · Yetkisiz Erişim
        </div>

        <h1 style={{ fontSize: '1.5rem', color: '#1b1919', margin: '0 0 0.75rem' }}>
          Bu sayfaya erişim yetkiniz yok
        </h1>
        <p style={{ color: '#57534e', fontSize: '0.95rem', marginBottom: '1.75rem' }}>
          Mevcut kullanıcı rolünüz bu ekranı görüntülemek için yetkili değildir.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            onClick={handleGoHome}
            style={{
              backgroundColor: '#115e59',
              color: '#fff',
              border: 'none',
              padding: '0.65rem 1.25rem',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Kendi Panelime Dön
          </button>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#f5f5f4',
              color: '#1b1919',
              border: '1px solid #d6d3d1',
              padding: '0.65rem 1.25rem',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Çıkış Yap
          </button>
        </div>
      </div>
    </div>
  );
}
