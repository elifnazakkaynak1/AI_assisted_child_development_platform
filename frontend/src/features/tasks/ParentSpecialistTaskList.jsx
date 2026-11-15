
import { useEffect, useState } from 'react';

// Backend'den gelen gelişim alanlarını Türkçe gösterir.
const areaLabels = {
  academic: 'Akademik',
  language: 'Dil',
  motor: 'Motor Beceriler',
  'social-emotional': 'Sosyal-Duygusal',
  'self-care': 'Öz Bakım'
};

// Tarihi YYYY-MM-DD formatından GG.AA.YYYY formatına çevirir.
function formatDate(value) {
  if (!value) return 'Belirtilmedi';

  const match = String(value).match(
    /^(\d{4})-(\d{2})-(\d{2})/
  );

  return match
    ? `${match[3]}.${match[2]}.${match[1]}`
    : String(value);
}

export default function ParentSpecialistTaskList({
  childId,
  token
}) {
  // refreshKey değiştiğinde görev listesi yeniden yüklenir.
  const [refreshKey, setRefreshKey] = useState(0);

  // Görev listesinin yüklenme, veri ve hata durumlarını tutar.
  const [result, setResult] = useState({
    tasks: [],
    loading: true,
    error: ''
  });

  // Seçilen çocuğun görevlerini backend API'sinden getirir.
  useEffect(() => {
    if (childId == null || !token) return;

    // Bileşen kapanırsa veya çocuk değişirse eski isteği iptal eder.
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

        // API'nin beklenen şekilde bir görev dizisi döndürdüğünü kontrol eder.
        if (!Array.isArray(data)) {
          throw new Error('Geçersiz görev listesi.');
        }

        if (!controller.signal.aborted) {
          setResult({
            tasks: data,
            loading: false,
            error: ''
          });
        }
      } catch (err) {
        // İptal edilen istekler için hata gösterilmez.
        if (!controller.signal.aborted) {
          setResult({
            tasks: [],
            loading: false,
            error: err.message || 'Görevler yüklenemedi.'
          });
        }
      }
    }

    loadTasks();

    return () => controller.abort();
  }, [childId, token, refreshKey]);

  // Yenile butonuna basıldığında API'den güncel görevleri tekrar ister.
  function handleRefresh() {
    setResult(previous => ({
      ...previous,
      loading: true,
      error: ''
    }));
    setRefreshKey(previous => previous + 1);
  }

  if (childId == null || !token) return null;

  const { tasks, loading, error } = result;

  // Tamamlanan görev sayısını hesaplar.
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        <h2 style={{ color: '#134e4a', margin: 0 }}>
          Çocuğun Görevleri
        </h2>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          style={{
            padding: '9px 16px',
            border: '1px solid #115e59',
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            color: '#115e59',
            fontWeight: 600,
            cursor: loading ? 'wait' : 'pointer'
          }}
        >
          Görevleri Yenile
        </button>
      </div>

      <p style={{ color: '#57534e' }}>
        Seçilen çocuğa atanmış görevleri ve
        tamamlanma durumlarını görüntüleyebilirsiniz.
      </p>

      {/* Yüklenme ve hata mesajları */}
      {loading && (
        <p role="status">Görevler yükleniyor...</p>
      )}

      {error && (
        <p role="alert" style={{ color: '#991b1b' }}>
          {error}
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
            <p>Bu çocuğa henüz görev atanmamış.</p>
          ) : (
            <div
              style={{
                display: 'grid',
                gap: '16px',
                marginTop: '20px'
              }}
            >
              {/* Her görev için ayrı bir kart oluşturulur. */}
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
                      <p style={{ color: '#57534e' }}>
                        {task.description}
                      </p>
                    )}

                    <p style={{ color: '#57534e' }}>
                      <strong>Gelişim Alanı:</strong>{' '}
                      {areaLabels[task.area] || task.area}
                    </p>

                    <p style={{ color: '#57534e' }}>
                      <strong>Son Teslim:</strong>{' '}
                      {formatDate(task.due_date)}
                    </p>

                    {/* FR-M4-05 — Görevin tamamlandığı tarih */}
                     <p style={{ color: '#57534e' }}>
                    <strong>Tamamlanma Tarihi:</strong>{' '}
                    {task.completed_at
                        ? formatDate(task.completed_at)
                        : '—'}
                    </p>

                    {/* Görev durumuna göre etiketin rengi ve metni değişir. */}
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: '12px',
                        padding: '9px 16px',
                        borderRadius: '8px',
                        backgroundColor: completed
                          ? '#fee2e2'
                          : '#e7f4f1',
                        color: completed
                          ? '#b91c1c'
                          : '#115e59',
                        fontWeight: 600
                      }}
                    >
                      {completed
                        ? '✓ Tamamlandı'
                        : 'Bekliyor'}
                    </span>
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
