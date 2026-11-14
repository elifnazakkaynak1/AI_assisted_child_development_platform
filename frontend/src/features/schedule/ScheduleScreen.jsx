

import { useEffect, useState } from 'react';
import './ScheduleScreen.css';

const weekdays = [
  'Pazartesi', 'Salı', 'Çarşamba',
  'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'
];

function getMonday(date) {
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);

  const difference = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - difference);

  return monday;
}

// Tarihi API'nin beklediği YYYY-MM-DD formatına dönüştür
function formatDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
}

// Haftanın tarihlerini okunabilir biçimde göster
function formatWeekRange(start, end) {
  const first = start.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long'
  });

  const last = end.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return `${first} – ${last}`;
}

function ScheduleScreen({ childId, token }) {
  const [weekStart, setWeekStart] = useState(
    () => getMonday(new Date())
  );

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Seçilen haftanın tarihlerini hesapla
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const from = formatDate(weekStart);
  const to = formatDate(weekEnd);

  const hasValidSelection =
    Boolean(token) &&
    Number.isInteger(Number(childId)) &&
    Number(childId) > 0;

  // Hafta veya kullanıcı değişince etkinlikleri API'den getir
  useEffect(() => {
    if (!hasValidSelection) {
      return;
    }

    const controller = new AbortController();

    async function loadEvents() {
      setLoading(true);
      setError('');
      setEvents([]);

      try {
        const response = await fetch(
          `/api/children/${childId}/events?from=${from}&to=${to}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            },
            signal: controller.signal
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error(
              'Oturum geçersiz. Yeniden giriş yapın.'
            );
          }

          if (response.status === 403) {
            throw new Error(
              'Bu çocuğun takvimine erişim izniniz yok.'
            );
          }

          throw new Error(
            `Etkinlikler alınamadı (HTTP ${response.status}).`
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error(
            'API beklenen etkinlik listesini döndürmedi.'
          );
        }

        if (!controller.signal.aborted) {
          setEvents(data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadEvents();

    // Hızlı hafta değişimlerinde eski isteği iptal et
    return () => controller.abort();
  }, [childId, token, from, to, hasValidSelection]);

  function changeWeek(amount) {
    setWeekStart(previous => {
      const next = new Date(previous);
      next.setDate(next.getDate() + amount * 7);
      return next;
    });
  }

  const todayKey = formatDate(new Date());
  const isCurrentWeek = todayKey >= from && todayKey <= to;

  return (
    <section className="schedule-view" aria-label="Haftalık program">
      <header className="schedule-header">
        <div className="schedule-heading">
          <span className="schedule-eyebrow">
            HAFTALIK GÖRÜNÜM
          </span>

          <h2>Haftalık program</h2>

          <p>
            Çocuğun haftalık etkinliklerini ve
            planlanan saatlerini görüntüleyin.
          </p>
        </div>

        <div className="schedule-navigation">
          <button
            type="button"
            className="schedule-arrow"
            onClick={() => changeWeek(-1)}
            aria-label="Önceki hafta"
            title="Önceki hafta"
          >
            ‹
          </button>

          <span
            className="schedule-date-range"
            aria-live="polite"
          >
            {formatWeekRange(weekStart, weekEnd)}
          </span>

          <button
            type="button"
            className="schedule-arrow"
            onClick={() => changeWeek(1)}
            aria-label="Sonraki hafta"
            title="Sonraki hafta"
          >
            ›
          </button>

          <button
            type="button"
            className="schedule-today-button"
            onClick={() => setWeekStart(getMonday(new Date()))}
            disabled={isCurrentWeek}
          >
            Bu hafta
          </button>
        </div>
      </header>

      {!hasValidSelection && (
        <p className="schedule-message" role="alert">
          Takvimi görüntülemek için giriş ve çocuk seçimi gerekli.
        </p>
      )}

      {hasValidSelection && loading && (
        <p className="schedule-message" role="status">
          Etkinlikler yükleniyor...
        </p>
      )}

      {hasValidSelection && error && (
        <p className="schedule-message schedule-error" role="alert">
          {error}
        </p>
      )}

      {hasValidSelection && !loading && !error && (
        <>
          <div className="schedule-summary">
            <span className="schedule-summary-dot" />
            <span>
              Bu hafta {events.length} etkinlik planlandı
            </span>
          </div>

          <div className="schedule-scroll">
            <div className="schedule-grid">
              {weekdays.map((day, index) => {
                const date = new Date(weekStart);
                date.setDate(date.getDate() + index);

                const dateKey = formatDate(date);
                const isToday = dateKey === todayKey;

                // API'den gelen etkinlikleri ilgili güne yerleştir
                const dailyEvents = events.filter(
                  event => event.event_date === dateKey
                );

                return (
                  <div
                    key={dateKey}
                    className={
                      `schedule-day${isToday ? ' schedule-day-today' : ''}`
                    }
                  >
                    <div className="schedule-day-heading">
                      <span className="schedule-day-name">
                        {day}
                      </span>

                      <span className="schedule-day-date">
                        {date.toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>

                      {isToday && (
                        <span className="schedule-today-label">
                          Bugün
                        </span>
                      )}
                    </div>

                    <div className="schedule-day-events">
                      {dailyEvents.length === 0 ? (
                        <span className="schedule-empty">
                          Etkinlik yok
                        </span>
                      ) : (
                        dailyEvents.map((event, eventIndex) => (
                          <article
                            key={event.id}
                            className={
                              `schedule-event schedule-event-${eventIndex % 3}`
                            }
                          >
                            <span className="schedule-event-time">
                              {event.start_time} – {event.end_time}
                            </span>

                            <span className="schedule-event-title">
                              {event.title}
                            </span>
                          </article>
                        ))
                      )}
                    </div>

                    <div className="schedule-day-footer">
                      {dailyEvents.length} etkinlik
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default ScheduleScreen;
