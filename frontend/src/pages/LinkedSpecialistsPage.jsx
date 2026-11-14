import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

// value: backend'e giden değer (users.type ile birebir aynı), label: ekranda görünen
const SPECIALIST_TYPES = [
  { value: 'teacher', label: 'Öğretmen' },
  { value: 'psychologist', label: 'Psikolog' },
];

const TYPE_LABELS = Object.fromEntries(
  SPECIALIST_TYPES.map((t) => [t.value, t.label])
);

const cardStyle = {
  backgroundColor: '#fff',
  border: '1px solid #e7e5e4',
  borderRadius: '8px',
  padding: '1.5rem',
  marginBottom: '1.5rem',
};

const inputStyle = {
  width: '100%',
  padding: '0.65rem',
  borderRadius: '6px',
  border: '1px solid #d6d3d1',
  boxSizing: 'border-box',
};

const labelStyle = {
  color: '#1b1919',
  display: 'block',
  marginBottom: '0.4rem',
  fontWeight: 500,
};

export default function LinkedSpecialistsPage() {
  const { token } = useAuth();

  const [children, setChildren] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [childId, setChildId] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState(SPECIALIST_TYPES[0].value);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const authHeaders = { Authorization: `Bearer ${token}` };

  // Çocukları ve uzman bağlantılarını birlikte çeker
  const loadData = async () => {
    try {
      const [childrenRes, linksRes] = await Promise.all([
        fetch('/api/children', { headers: authHeaders }),
        fetch('/api/specialists', { headers: authHeaders }),
      ]);

      if (!childrenRes.ok || !linksRes.ok) {
        throw new Error('Veriler alınamadı. Lütfen tekrar deneyin.');
      }

      const childrenData = await childrenRes.json();
      const linksData = await linksRes.json();

      setChildren(childrenData);
      setLinks(linksData);

      // Form için varsayılan çocuk: ilk çocuk
      setChildId((current) =>
        current || (childrenData.length > 0 ? String(childrenData[0].id) : '')
      );
    } catch (err) {
      setError(err.message || 'Sunucuya bağlanılamadı.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLink = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!childId) {
      setError('Lütfen bir çocuk seçin.');
      return;
    }
    if (!email.trim()) {
      setError('Uzmanın e-posta adresi boş bırakılamaz.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/specialists', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: Number(childId),
          email: email.trim(),
          type,
        }),
      });

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error('Eksik ya da hatalı bilgi girdiniz.');
        }
        if (response.status === 403) {
          throw new Error('Bu çocuk için işlem yapma yetkiniz yok.');
        }
        if (response.status === 404) {
          throw new Error(
            'Bu e-posta ve türde bir uzman bulunamadı. Bilgileri kontrol edin.'
          );
        }
        if (response.status === 409) {
          throw new Error('Bu uzman zaten bu çocuğa bağlı.');
        }
        throw new Error(`Uzman bağlanamadı (HTTP ${response.status}).`);
      }

      setSuccess('Uzman başarıyla bağlandı.');
      setEmail('');
      await loadData();
    } catch (err) {
      setError(err.message || 'Sunucuya bağlanılamadı.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlink = async (link) => {
    const childName =
      children.find((c) => c.id === link.childId)?.name || 'bu çocuk';

    const confirmed = window.confirm(
      `${link.name} adlı uzmanın ${childName} ile bağlantısı kaldırılsın mı?`
    );
    if (!confirmed) return;

    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `/api/specialists/${link.id}?childId=${link.childId}`,
        { method: 'DELETE', headers: authHeaders }
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Bu bağlantıyı kaldırma yetkiniz yok.');
        }
        if (response.status === 404) {
          throw new Error('Bağlantı bulunamadı. Liste yenileniyor.');
        }
        throw new Error(`Bağlantı kaldırılamadı (HTTP ${response.status}).`);
      }

      setSuccess('Bağlantı kaldırıldı.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Sunucuya bağlanılamadı.');
      await loadData();
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafaf9', textAlign: 'left' }}>
      <Navbar />
      <main style={{ maxWidth: '960px', margin: '2rem auto', padding: '0 1.5rem' }}>
        <Link
          to="/parent/dashboard"
          style={{ color: '#115e59', fontSize: '0.9rem', textDecoration: 'none' }}
        >
          ← Aile Paneli
        </Link>

        <h1 style={{ fontSize: '1.75rem', color: '#1b1919', margin: '0.75rem 0 0.5rem' }}>
          Bağlı Uzmanlar
        </h1>
        <p style={{ color: '#57534e', marginBottom: '1.5rem' }}>
          Çocuğunuzla çalışan uzmanları buradan bağlayabilir veya bağlantılarını kaldırabilirsiniz.
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

        {success && (
          <div
            role="status"
            style={{
              backgroundColor: '#ccfbf1',
              color: '#134e4a',
              padding: '0.75rem',
              borderRadius: '6px',
              marginBottom: '1rem',
              fontSize: '0.9rem',
            }}
          >
            {success}
          </div>
        )}

        {loading ? (
          <p style={{ color: '#57534e' }}>Yükleniyor...</p>
        ) : (
          <>
            {/* Uzman bağlama formu */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: '1.1rem', color: '#134e4a', marginBottom: '1rem' }}>
                Yeni uzman bağla
              </h2>

              {children.length === 0 ? (
                <p style={{ color: '#57534e', fontSize: '0.95rem' }}>
                  Hesabınıza bağlı çocuk bulunamadı.
                </p>
              ) : (
                <form onSubmit={handleLink} noValidate>
                  <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="childId" style={labelStyle}>Çocuk</label>
                    <select
                      id="childId"
                      value={childId}
                      onChange={(e) => setChildId(e.target.value)}
                      disabled={isSubmitting}
                      style={inputStyle}
                    >
                      {children.map((child) => (
                        <option key={child.id} value={child.id}>
                          {child.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="specialistEmail" style={labelStyle}>
                      Uzmanın e-posta adresi
                    </label>
                    <input
                      id="specialistEmail"
                      type="email"
                      placeholder="uzman@eposta.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label htmlFor="specialistType" style={labelStyle}>Uzman türü</label>
                    <select
                      id="specialistType"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      disabled={isSubmitting}
                      style={inputStyle}
                    >
                      {SPECIALIST_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      backgroundColor: '#115e59',
                      color: '#fff',
                      border: 'none',
                      padding: '0.65rem 1.25rem',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isSubmitting ? 'Bağlanıyor...' : 'Uzmanı bağla'}
                  </button>
                </form>
              )}
            </div>

            {/* Çocuk bazında bağlı uzman listesi */}
            {children.map((child) => {
              const childLinks = links.filter((l) => l.childId === child.id);

              return (
                <div key={child.id} style={cardStyle}>
                  <h2 style={{ fontSize: '1.1rem', color: '#134e4a', marginBottom: '0.75rem' }}>
                    {child.name}
                  </h2>

                  {childLinks.length === 0 ? (
                    <p style={{ color: '#57534e', fontSize: '0.95rem' }}>
                      Bağlı uzman yok.
                    </p>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {childLinks.map((link) => (
                        <li
                          key={`${link.childId}-${link.id}`}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '0.75rem 0',
                            borderTop: '1px solid #e7e5e4',
                          }}
                        >
                          <div>
                            <strong style={{ color: '#1b1919' }}>{link.name}</strong>
                            <span
                              style={{
                                marginLeft: '0.6rem',
                                backgroundColor: '#ccfbf1',
                                color: '#134e4a',
                                padding: '0.15rem 0.6rem',
                                borderRadius: '999px',
                                fontSize: '0.8rem',
                              }}
                            >
                              {TYPE_LABELS[link.type] || link.type}
                            </span>
                            <div style={{ color: '#57534e', fontSize: '0.9rem' }}>
                              {link.email}
                            </div>
                          </div>

                          <button
                            onClick={() => handleUnlink(link)}
                            style={{
                              backgroundColor: '#fff',
                              color: '#991b1b',
                              border: '1px solid #fca5a5',
                              padding: '0.4rem 0.9rem',
                              borderRadius: '6px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Bağlantıyı kaldır
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </>
        )}
      </main>
    </div>
  );
}