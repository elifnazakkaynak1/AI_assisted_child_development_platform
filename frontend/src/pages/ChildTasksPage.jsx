import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function ChildTasksPage() {
  const { user } = useAuth();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafaf9', textAlign: 'left' }}>
      <Navbar />
      <main style={{ maxWidth: '960px', margin: '2rem auto', padding: '0 1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', color: '#1b1919', marginBottom: '0.5rem' }}>
          Merhaba, {user?.name}!
        </h1>
        <p style={{ color: '#57534e', marginBottom: '1.5rem' }}>
          Bugünkü görevlerini ve haftalık programını aşağıda görebilirsin.
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
            Görevlerim ve Programım
          </h2>
          <p style={{ color: '#57534e', fontSize: '0.95rem' }}>
            Sana atanan görevler ve haftalık etkinliklerin bu ekranda listelenecektir.
          </p>
        </div>
      </main>
    </div>
  );
}
