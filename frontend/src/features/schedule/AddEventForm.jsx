
import { useState } from 'react';

function AddEventForm({ role, onAddEvent }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!title.trim() || !date || !startTime || !endTime) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }

    
    if (endTime <= startTime) {
      setError('Bitiş saati başlangıç saatinden sonra olmalı.');
      return;
    }

    const newEvent = {
      title: title.trim(),
      date,
      startTime,
      endTime
    };

    
    if (!onAddEvent) {
      setMessage('Form doğrulandı. API bağlantısı henüz yapılmadı.');
      return;
    }

    try {
      await onAddEvent(newEvent);

      setMessage('Etkinlik başarıyla gönderildi.');
      setTitle('');
      setDate('');
      setStartTime('');
      setEndTime('');
    } catch {
      setError('Etkinlik eklenemedi. Tekrar deneyin.');
    }
  }

 
  if (role !== 'parent' && role !== 'specialist') {
    return null;
  }

  return (
    <section style={{ padding: '24px' }}>
      <h2>Etkinlik Ekle</h2>

      <form
        onSubmit={handleSubmit}
        noValidate
        style={{
          display: 'grid',
          gap: '12px',
          maxWidth: '420px',
          margin: '0 auto'
        }}
      >
        <label>
          Başlık
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Etkinlik başlığı"
            style={{ width: '100%', padding: '8px' }}
          />
        </label>

        <label>
          Tarih
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          />
        </label>

        <label>
          Başlangıç Saati
          <input
            type="time"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          />
        </label>

        <label>
          Bitiş Saati
          <input
            type="time"
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          />
        </label>

        {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}
        {message && <p role="status">{message}</p>}

        <button type="submit">Etkinlik Ekle</button>
      </form>
    </section>
  );
}

export default AddEventForm;
