
import { useState } from 'react';

function AssignTaskForm({ role, onAssignTask }) {
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

    if (!title.trim() || !description.trim() || !area || !dueDate) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }

    const newTask = {
      title: title.trim(),
      description: description.trim(),
      area,
      dueDate
    };

    
    if (!onAssignTask) {
      setMessage('Form doğrulandı. API bağlantısı henüz yapılmadı.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAssignTask(newTask);

      setMessage('Görev başarıyla atandı.');
      setTitle('');
      setDescription('');
      setArea('');
      setDueDate('');
    } catch {
      setError('Görev atanamadı. Tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  }

 
  if (role !== 'parent' && role !== 'specialist') {
    return null;
  }

  return (
    <section style={{ padding: '24px' }}>
      <h2>Görev Ata</h2>

      <form onSubmit={handleSubmit} noValidate
        style={{ display: 'grid', gap: '12px', maxWidth: '420px' }}
      >
        <label>
          Görev Başlığı
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Görev başlığı"
          />
        </label>

        <label>
          Açıklama
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Görevi açıklayın"
          />
        </label>

        <label>
          Gelişim Alanı
          <select value={area} onChange={e => setArea(e.target.value)}>
            <option value="">Alan seçiniz</option>
            <option value="academic">Akademik</option>
            <option value="social">Sosyal</option>
            <option value="communication">İletişim</option>
            <option value="motor">Motor Beceriler</option>
          </select>
        </label>

        <label>
          Son Teslim Tarihi
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
          />
        </label>

        {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}
        {message && <p role="status">{message}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Kaydediliyor...' : 'Görev Ata'}
        </button>
      </form>
    </section>
  );
}

export default AssignTaskForm;
