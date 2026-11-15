
import { useEffect, useState } from 'react';

const areaLabels = {
  academic: 'Akademik',
  language: 'Dil',
  motor: 'Motor Beceriler',
  'social-emotional': 'Sosyal-Duygusal',
  'self-care': 'Öz Bakım'
};

function formatDate(value) {
  if (!value) return '-';

  const [year, month, day] = value.split('-');
  return `${day}.${month}.${year}`;
}

export default function ChildTaskList({ childId, token }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [completingId, setCompletingId] = useState(null);

  useEffect(() => {
    if (!childId || !token) return;

    const controller = new AbortController();

    async function loadTasks() {
      try {
        const response = await fetch(
          `/api/children/${childId}/tasks`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            },
            signal: controller.signal
          }
        );

        if (!response.ok) {
          throw new Error(
            `Görevler alınamadı (HTTP ${response.status}).`
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error('Geçersiz görev listesi.');
        }

        if (!controller.signal.aborted) {
          setTasks(data);
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

    loadTasks();

    return () => controller.abort();
  }, [childId, token]);

  async function handleComplete(taskId) {
    if (completingId !== null) return;

    setActionError('');
    setCompletingId(taskId);

    try {
      const response = await fetch(
        `/api/children/${childId}/tasks/${taskId}/complete`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
          `Görev güncellenemedi (HTTP ${response.status}).`
        );
      }

      if (!data.task || data.task.status !== 'completed') {
        throw new Error(
          'Sunucudan geçersiz görev yanıtı alındı.'
        );
      }

      setTasks(previous =>
        previous.map(task =>
          task.task_id === taskId ? data.task : task
        )
      );
    } catch (err) {
      setActionError(
        err.message || 'Görev güncellenemedi.'
      );
    } finally {
      setCompletingId(null);
    }
  }

  const completedCount = tasks.filter(
    task => task.status === 'completed'
  ).length;

  return (
    <section
      style={{
        marginTop: '28px',
        padding: '24px',
        backgroundColor: '#ffffff',
        border: '1px solid #e7e5e4',
        borderRadius: '12px'
      }}
    >
      <h2
        style={{
          color: '#134e4a',
          marginTop: 0
        }}
      >
        Görevlerim
      </h2>

      <p style={{ color: '#57534e' }}>
        Sana atanan görevleri takip edebilir ve
        bitirdiğin görevleri tamamlandı olarak
        işaretleyebilirsin.
      </p>

      {loading && (
        <p role="status">Görevler yükleniyor...</p>
      )}

      {error && (
        <p
          role="alert"
          style={{ color: '#991b1b' }}
        >
          {error}
        </p>
      )}

      {actionError && (
        <p
          role="alert"
          style={{ color: '#991b1b' }}
        >
          {actionError}
        </p>
      )}

      {!loading && !error && (
        <>
          <p
            style={{
              color: '#115e59',
              fontWeight: 600
            }}
          >
            {completedCount} / {tasks.length} görev tamamlandı
          </p>

          {tasks.length === 0 ? (
            <p>Henüz atanmış bir görevin bulunmuyor.</p>
          ) : (
            <div
              style={{
                display: 'grid',
                gap: '16px',
                marginTop: '20px'
              }}
            >
              {tasks.map(task => {
                const completed =
                  task.status === 'completed';

                return (
                  <article
                    key={task.task_id}
                    style={{
                      padding: '20px',
                     border: '1px solid #dce6e0',
                    borderRadius: '10px',
                    backgroundColor: '#fafaf9'
                    }}
                  >
                    <h3
                      style={{
                        margin: '0 0 10px',
                        color: '#134e4a'
                      }}
                    >
                      {task.title}
                    </h3>

                    {task.description && (
                      <p
                        style={{
                          color: '#57534e'
                        }}
                      >
                        {task.description}
                      </p>
                    )}

                    <p
                      style={{
                        color: '#57534e'
                      }}
                    >
                      <strong>Gelişim Alanı:</strong>{' '}
                      {areaLabels[task.area] || task.area}
                    </p>

                    <p
                      style={{
                        color: '#57534e',
                        marginBottom: '8px'
                      }}
                    >
                      <strong>Son Teslim:</strong>{' '}
                      {formatDate(task.due_date)}
                    </p>

                    {completed ? (
                      <span
                        style={{
                          display: 'inline-block',
                          marginTop: '16px',
                          padding: '9px 16px',
                          borderRadius: '8px',
                          backgroundColor: '#fee2e2',
                          color: '#b91c1c',
                          fontWeight: 600
                        }}
                      >
                        ✓ Tamamlandı
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={completingId !== null}
                        onClick={() =>
                          handleComplete(task.task_id)
                        }
                        style={{
                          display: 'inline-block',
                          marginTop: '16px',
                          padding: '10px 18px',
                          backgroundColor: '#115e59',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor:
                            completingId !== null
                              ? 'wait'
                              : 'pointer',
                          fontWeight: 600
                        }}
                      >
                        {completingId === task.task_id
                          ? 'Kaydediliyor...'
                          : 'Tamamlandı olarak işaretle'}
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
