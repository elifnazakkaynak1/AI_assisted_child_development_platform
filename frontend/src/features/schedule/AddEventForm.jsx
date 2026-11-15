

import { useState } from 'react';
import './AddEventForm.css';

// GG.AA.YYYY biçimini kontrol edip API formatına çevirir
function toIsoDate(value) {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value.trim());

  if (!match) return null;

  const [, day, month, year] = match;

  const d = Number(day);
  const m = Number(month);
  const y = Number(year);

  if (y < 1000 || m < 1 || m > 12) return null;

  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();

  if (d < 1 || d > daysInMonth) return null;

  return `${year}-${month}-${day}`;
}


function AddEventForm({ role, childId, token, onEventAdded }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form alanlarını temizle
  function clearForm() {
    setTitle('');
    setDate('');
    setStartTime('');
    setEndTime('');
    setError('');
    setMessage('');
  }

  // Etkinliği G3-57 API'sine kaydet
  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

   if (!title.trim() || !date.trim() || !startTime || !endTime) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }

    const isoDate = toIsoDate(date);

    if (!isoDate) {
      setError('Geçerli bir tarih girin (GG.AA.YYYY).');
      return;
    }

    if (endTime <= startTime) {
      setError('Bitiş saati başlangıç saatinden sonra olmalı.');
      return;
    }

    if (!token || !Number.isInteger(Number(childId)) ||
        Number(childId) < 1) {
      setError('Etkinlik eklemek için giriş ve çocuk seçimi gerekli.');
      return;
    }

   const newEvent = {
      title: title.trim(),
      date: isoDate,
      startTime,
      endTime
    };

    setSaving(true);

    try {
      const response = await fetch(
        `/api/children/${childId}/events`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(newEvent)
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Oturum geçersiz. Yeniden giriş yapın.');
        }

        if (response.status === 403) {
          throw new Error(
            'Bu çocuk için etkinlik ekleme yetkiniz yok.'
          );
        }

        if (response.status === 400) {
          throw new Error(
            typeof data.error === 'string'
              ? data.error
              : 'Lütfen etkinlik bilgilerini kontrol edin.'
          );
        }

        throw new Error(
          `Etkinlik eklenemedi (HTTP ${response.status}).`
        );
      }

      setMessage('Etkinlik başarıyla eklendi!');
      setTitle('');
      setDate('');
      setStartTime('');
      setEndTime('');

      // Takvimi kullanan üst bileşene haber ver
      onEventAdded?.(data);
    } catch (err) {
      setError(err.message || 'Etkinlik eklenemedi.');
    } finally {
      setSaving(false);
    }
  }

  // Child etkinlik oluşturamaz
  if (role !== 'parent' && role !== 'specialist') {
    return null;
  }

  return (
    <section className="add-event-card">
      <header className="add-event-header">
        <div>
          <span className="add-event-eyebrow">
            HAFTALIK PROGRAM
          </span>
          <h2>Yeni etkinlik ekle</h2>
          <p>
            Çocuğun programına yeni bir etkinlik planlayın.
          </p>
        </div>

        <span className="add-event-header-icon" aria-hidden="true">
          +
        </span>
      </header>

      <form
        className="add-event-form"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="add-event-field">
          <label htmlFor="event-title">
            Etkinlik adı <span>*</span>
          </label>
          <input
            id="event-title"
            type="text"
            maxLength={120}
            placeholder="Örn. Yüzme antrenmanı"
            value={title}
            onChange={e => setTitle(e.target.value)}
            disabled={saving}
            required
          />
        </div>

        <div className="add-event-field">
          <label htmlFor="event-date">
            Tarih (GG.AA.YYYY) <span>*</span>
          </label>

          <input
            id="event-date"
            type="text"
            inputMode="numeric"
            maxLength={10}
            value={date}
            onChange={e => setDate(e.target.value)}
            disabled={saving}
            required
          />
        </div>

        <div className="add-event-time-grid">
          <div className="add-event-field">
            <label htmlFor="event-start">
              Başlangıç saati <span>*</span>
            </label>
            <input
              id="event-start"
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              disabled={saving}
              required
            />
          </div>

          <div className="add-event-field">
            <label htmlFor="event-end">
              Bitiş saati <span>*</span>
            </label>
            <input
              id="event-end"
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              disabled={saving}
              required
            />
          </div>
        </div>

        <p className="add-event-hint">
          Etkinlik, seçili çocuğun haftalık takvimine kaydedilir.
        </p>

        {error && (
          <p className="add-event-error" role="alert">
            {error}
          </p>
        )}

        {message && (
          <p className="add-event-success" role="status">
            {message}
          </p>
        )}

        <div className="add-event-actions">
          <button
            type="button"
            className="add-event-cancel"
            onClick={clearForm}
            disabled={saving}
          >
            Temizle
          </button>

          <button
            type="submit"
            className="add-event-submit"
            disabled={saving}
          >
            {saving ? 'Kaydediliyor...' : '+ Etkinliği kaydet'}
          </button>
        </div>
      </form>
    </section>
  );
}

export default AddEventForm;
