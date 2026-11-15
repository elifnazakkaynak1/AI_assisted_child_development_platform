

import { useState } from 'react';

function AssignTaskForm({ role, childId, token, onTaskAssigned }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    // Zorunlu görev bilgilerini kontrol et
    if (!title.trim() || !area || !dueDate) {
      setError('Lütfen zorunlu alanları doldurun.');
      return;
    }

    // Görev atanacak çocuğun seçildiğini kontrol et
    if (
      !Number.isSafeInteger(Number(childId)) ||
      Number(childId) <= 0 ||
      !token
    ) {
      setError('Geçerli bir çocuk seçilmeli ve giriş yapılmalıdır.');
      return;
    }

    const newTask = {
      title: title.trim(),
      description: description.trim(),
      area,
      dueDate
    };

    setIsSubmitting(true);

    try {
      // G3-64 API'sine gerçek görev atama isteği gönder
      const response = await fetch(
        `/api/children/${childId}/tasks`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(newTask)
        }
      );

      const data = await response.json().catch(() => ({}));

      // Backend'den dönen hata durumlarını işle
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Oturum geçersiz. Yeniden giriş yapın.');
        }

        if (response.status === 403) {
          throw new Error(
            'Bu çocuğa görev atama yetkiniz bulunmuyor.'
          );
        }

        throw new Error(
          data.error || `Görev atanamadı (HTTP ${response.status}).`
        );
      }

      // Görev başarıyla kaydedildiğinde formu temizle
      setMessage('Görev başarıyla atandı.');
      setTitle('');
      setDescription('');
      setArea('');
      setDueDate('');

      // İleride görev listesinin yenilenmesini sağlar
      if (onTaskAssigned) {
        onTaskAssigned(data.task);
      }
    } catch (err) {
      setError(err.message || 'Görev atanamadı.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Çocuklar görev atama formunu göremez
  if (role !== 'parent' && role !== 'specialist') {
    return null;
  }

  const inputStyle = {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    marginTop: '6px',
    padding: '10px',
    border: '1px solid #d6e4dc',
    borderRadius: '8px',
    backgroundColor: '#fff',
    color: '#344941'
  };

  return (
    <section
      style={{
        padding: '24px',
        backgroundColor: '#fff',
        border: '1px solid #e7e5e4',
        borderRadius: '12px'
      }}
    >
      <h2 style={{ color: '#134e4a', marginTop: 0 }}>
        Görev Ata
      </h2>

      <form
        onSubmit={handleSubmit}
        noValidate
        style={{
          display: 'grid',
          gap: '16px',
          maxWidth: '480px'
        }}
      >
        <label>
          Görev Başlığı *
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Örn. 20 dakika kitap oku"
            maxLength={200}
            style={inputStyle}
          />
        </label>

        <label>
          Açıklama (isteğe bağlı)
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Görevi açıklayın"
            rows={3}
            style={inputStyle}
          />
        </label>

        <label>
          Gelişim Alanı *
          <select
            value={area}
            onChange={e => setArea(e.target.value)}
            style={inputStyle}
          >
            <option value="">Alan seçiniz</option>
            <option value="academic">Akademik</option>
            <option value="language">Dil</option>
            <option value="motor">Motor Beceriler</option>
            <option value="social-emotional">
              Sosyal-Duygusal
            </option>
            <option value="self-care">Öz Bakım</option>
          </select>
        </label>

        <label>
          Son Teslim Tarihi *
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            style={inputStyle}
          />
        </label>

        {error && (
          <p role="alert" style={{ color: '#991b1b' }}>
            {error}
          </p>
        )}

        {message && (
          <p role="status" style={{ color: '#115e59' }}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '12px 18px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: '#115e59',
            color: '#fff',
            cursor: isSubmitting ? 'wait' : 'pointer',
            fontWeight: 600
          }}
        >
          {isSubmitting ? 'Kaydediliyor...' : 'Görev Ata'}
        </button>
      </form>
    </section>
  );
}

export default AssignTaskForm;
