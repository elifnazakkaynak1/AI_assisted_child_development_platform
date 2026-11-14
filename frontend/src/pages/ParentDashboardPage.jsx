import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function ParentDashboardPage() {
  const { user } = useAuth();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafaf9', textAlign: 'left' }}>
      <Navbar />
      <main style={{ maxWidth: '960px', margin: '2rem auto', padding: '0 1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', color: '#1b1919', marginBottom: '0.5rem' }}>
          Aile Paneli
        </h1>
        <p style={{ color: '#57534e', marginBottom: '1.5rem' }}>
          Hoş geldiniz, <strong>{user?.name}</strong>. Çocuğunuzun haftalık programını, görevlerini ve bağlı uzmanlarını buradan yönetebilirsiniz.
        </p>

        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #e7e5e4',
            borderRadius: '8px',
            padding: '1.5rem',
          }}
        >
          <h2 style={{ fontSize: '1.1rem', color: '#134e4a', marginBottom: '0.5rem' }}>
            Genel Bakış
          </h2>
          <p style={{ color: '#57534e', fontSize: '0.95rem' }}>
            Haftalık program, görev takibi, uzman gözlemleri ve yapay zekâ özetleri bu alanda yer alacaktır.
          </p>
          
          <Link
            to="/parent/specialists"
            style={{ display: 'inline-block', marginTop: '1rem', color: '#115e59', fontWeight: 600 }}
          >
            Bağlı uzmanları yönet →
          </Link>
        </div>
      </main>
    </div>
  );
}
