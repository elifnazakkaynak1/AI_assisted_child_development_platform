
import { useState } from 'react';

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

function ScheduleScreen({ events = [] }) {
  const [weekStart, setWeekStart] = useState(
    () => getMonday(new Date())
  );

  function changeWeek(amount) {
    setWeekStart(previous => {
      const next = new Date(previous);
      next.setDate(next.getDate() + amount * 7);
      return next;
    });
  }

  return (
    <section style={{ padding: '24px' }}>
      <h2>Haftalık Program</h2>

      <button onClick={() => changeWeek(-1)}>
        Önceki Hafta
      </button>

      <button onClick={() => changeWeek(1)}>
        Sonraki Hafta
      </button>

      <div style={{
        display: 'grid',
        gridTemplateColumns:
          'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
        marginTop: '24px'
      }}>

        {weekdays.map((day, index) => {
          const date = new Date(weekStart);
          date.setDate(date.getDate() + index);

          const dateKey = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, '0'),
            String(date.getDate()).padStart(2, '0')
           ].join('-');

       const dailyEvents = events.filter(
       event => event.date === dateKey
       );

          return (
            <div key={day} style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <h3>{day}</h3>
              <p>{date.toLocaleDateString('tr-TR')}</p>
               {dailyEvents.length === 0 ? (
              <p>Etkinlik yok</p>
           ) : (
               dailyEvents.map(event => (
               <div key={event.id}>
               <strong>{event.title}</strong>
               <p>
               {event.startTime} - {event.endTime}
              </p>
            </div>
           ))
          )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ScheduleScreen;
