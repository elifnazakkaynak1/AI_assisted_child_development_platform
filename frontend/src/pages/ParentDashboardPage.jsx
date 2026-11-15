import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

import { useEffect, useState } from 'react';
import ScheduleScreen from '../features/schedule/ScheduleScreen';
import AddEventForm from '../features/schedule/AddEventForm';
import ParentSpecialistTaskList from '../features/tasks/ParentSpecialistTaskList';
import AssignTaskForm from '../features/tasks/AssignTaskForm';

export default function ParentDashboardPage() {


const { user, token } = useAuth();

const [children, setChildren] = useState([]);
const [selectedChildId, setSelectedChildId] = useState('');
const [loadingChildren, setLoadingChildren] = useState(true);
const [childrenError, setChildrenError] = useState('');
const [calendarVersion, setCalendarVersion] = useState(0);
const [taskVersion, setTaskVersion] = useState(0);

// Parent'ın erişebildiği çocukları backend'den getir
useEffect(() => {
  if (!token) return;

  const controller = new AbortController();

  async function loadChildren() {
    try {
      const response = await fetch('/api/children', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error('Çocuk listesi alınamadı.');
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('Geçersiz çocuk listesi.');
      }

      if (!controller.signal.aborted) {
        setChildren(data);
        setSelectedChildId(
          data.length > 0 ? String(data[0].id) : ''
        );
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setChildrenError(err.message);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoadingChildren(false);
      }
    }
  }

  loadChildren();

  return () => controller.abort();
}, [token]);


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

    {/* M3 — Haftalık program ve etkinlik ekleme */}
    <section style={{ marginTop: '28px' }}>
      {loadingChildren && (
        <p role="status">Çocuklar yükleniyor...</p>
      )}

      {childrenError && (
        <p role="alert" style={{ color: '#a34235' }}>
          {childrenError}
        </p>
      )}

      {!loadingChildren && !childrenError && children.length === 0 && (
        <p>Henüz görüntülenebilecek çocuk bulunamadı.</p>
      )}

      {!loadingChildren && !childrenError && children.length > 0 && (
        <>
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="parent-child"
              style={{ color: '#344941', fontWeight: 600 }}
            >
              Çocuk seçin
            </label>

            <select
              id="parent-child"
              value={selectedChildId}
              onChange={e => setSelectedChildId(e.target.value)}
              style={{
                display: 'block',
                marginTop: '8px',
                padding: '11px',
                minWidth: '220px',
                border: '1px solid #dce6e0',
                borderRadius: '9px',
                backgroundColor: '#ffffff',
                color: '#344941'
              }}
            >
              {children.map(child => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))}
            </select>
          </div>

          <ScheduleScreen
            childId={selectedChildId}
            token={token}
            refreshKey={calendarVersion}
          />

          <div style={{ marginTop: '24px' }}>
            <AddEventForm
              role={user?.role}
              childId={selectedChildId}
              token={token}
              onEventAdded={() =>
                setCalendarVersion(previous => previous + 1)
              }
            />
          </div>
          </>
        )}
      </section>

       {/* M4 — Görev atama ve takip */}
        {selectedChildId != null && token && (
          <>
           <AssignTaskForm
              role={user?.role}
              childId={selectedChildId}
              token={token}
              onTaskAssigned={() =>
                setTaskVersion(previous => previous + 1)
              }
            />

            <ParentSpecialistTaskList
              key={`${selectedChildId}-${taskVersion}`}
              childId={selectedChildId}
              token={token}
            />
          </>
        )}

      </main>
    </div>
  );
}
