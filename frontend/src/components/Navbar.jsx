import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = {
  parent: 'Aile (Veli)',
  specialist: 'Uzman',
  child: 'Çocuk',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header
      style={{
        backgroundColor: '#134e4a',
        color: '#fff',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <strong style={{ fontSize: '1.25rem' }}>Gelişim Ağı</strong>
        {user && (
          <span
            style={{
              backgroundColor: '#115e59',
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              fontSize: '0.85rem',
              color: '#99f6e4',
            }}
          >
            {ROLE_LABELS[user.role] || user.role}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span>{user?.name}</span>
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: '#fff',
            color: '#134e4a',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Çıkış Yap
        </button>
      </div>
    </header>
  );
}
