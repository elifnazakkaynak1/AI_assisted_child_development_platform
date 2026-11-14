import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function SpecialistChildrenPage() {
  const { user, token } = useAuth();

  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const loadChildren = async () => {
      try {
        const response = await fetch('/api/children', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Oturum geçersiz. Lütfen yeniden giriş yapın.');
          }
          if (response.status === 403) {
            throw new Error('Bu listeyi görüntüleme yetkiniz yok.');
          }
          throw new Error(`Çocuk listesi alınamadı (HTTP ${response.status}).`);
        }

        const data = await response.json();
        if (!controller.signal.aborted) {
          setChildren(data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message || 'Sunucuya bağlanılamadı.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadChildren();

    // Sayfadan çıkılırsa bekleyen isteği iptal et
    return () => controller.abort();
  }, [token]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafaf9', textAlign: 'left' }}>
      <Navbar />
      <main style={{ maxWidth: '960px', margin: '2rem auto', padding: '0 1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', color: '#1b1919', marginBottom: '0.5rem' }}>
          Uzman Paneli · Bağlı Çocuklar
        </h1>
        <p style={{ color: '#57534e', marginBottom: '1.5rem' }}>
          Hoş geldiniz, <strong>{user?.name}</strong>. Yetkilendirildiğiniz çocukların kayıtlarına ve görevlerine buradan ulaşabilirsiniz.
        </p>

        {error && (
          <div
            role="alert"
            style={{
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              padding: '0.75rem',
              borderRadius: '6px',
              marginBottom: '1rem',
              fontSize: '0.9rem',
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #e7e5e4',
            borderRadius: '8px',
            padding: '1.5rem',
          }}
        >
          <h2 style={{ fontSize: '1.1rem', color: '#134e4a', marginBottom: '0.75rem' }}>
            Danışan / Öğrenci Listesi
            {!loading && !error && (
              <span style={{ color: '#57534e', fontWeight: 400, fontSize: '0.9rem' }}>
                {' '}({children.length})
              </span>
            )}
          </h2>

          {loading && (
            <p style={{ color: '#57534e', fontSize: '0.95rem' }}>Yükleniyor...</p>
          )}

          {!loading && !error && children.length === 0 && (
            <p style={{ color: '#57534e', fontSize: '0.95rem' }}>
              Size bağlı çocuk bulunmuyor. Bir veli sizi çocuğuna bağladığında burada görünecek.
            </p>
          )}

          {!loading && !error && children.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {children.map((child) => (
                <li
                  key={child.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.85rem 0',
                    borderTop: '1px solid #e7e5e4',
                  }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: '#ccfbf1',
                      color: '#134e4a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                    }}
                  >
                    {child.name.charAt(0).toUpperCase()}
                  </div>
                  <strong style={{ color: '#1b1919' }}>{child.name}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}