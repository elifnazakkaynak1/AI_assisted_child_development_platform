import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const redirectByRole = (role) => {
    if (role === 'parent') {
      navigate('/parent/dashboard', { replace: true });
    } else if (role === 'specialist') {
      navigate('/specialist/children', { replace: true });
    } else if (role === 'child') {
      navigate('/child/tasks', { replace: true });
    } else {
      setError('Tanımsız kullanıcı rolü.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('E-posta ve şifre alanları boş bırakılamaz.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'E-posta veya şifre hatalı.');
      }

      login(data.token, data.user);
      redirectByRole(data.user.role);
    } catch (err) {
      setError(err.message || 'Sunucuya bağlanılamadı.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ flex: 1, backgroundColor: '#134e4a', color: '#fff', padding: '3rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ marginTop: '3rem', fontSize: '3rem' }}>Gelişim Ağı</h2>
          <h1 style={{ marginTop: '5rem', fontSize: '1.6rem', lineHeight: 1.2 }}>Çocuğunuzun gelişimi, tek bir ortak alanda.</h1>
        </div>
        <small style={{ color: '#99f6e4' }}>
          Demo ortamı · Tüm veriler sentetiktir, gerçek kişilere ait değildir.
        </small>
      </div>

      <div style={{ flex: 1, backgroundColor: '#fafaf9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <h2 style={{ color: '#1b1919'}}>Giriş yap</h2>

          {error && (
            <div role="alert" style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="email" style={{ color: '#1b1919', display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>E-posta
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="ornek@eposta.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #d6d3d1', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="password" style={{ color: '#1b1919', display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>Şifre
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="şifre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #d6d3d1', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#115e59',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? 'Giriş yapılıyor...' : 'Giriş yap'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
