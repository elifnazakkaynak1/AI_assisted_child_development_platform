//Bu modül uygulamanın beyni denebilir.
//uygulamayı başlatır ve hanagi adrese ne istek geliyor
//ne cevap veriliyor gibi işlemler yapar.

const express = require('express'); //express modülünü import ediyoruz.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {generateSummary} = require('./ai'); //ai.js modülünü import ediyoruz.
const db = require('./db'); //db.js modülünü import ediyoruz.
const { authenticateToken, authorizeRoles } = require('./middleware/auth');
const { requireChildAccess } = require('./middleware/childAccess'); // Çocuğa erişim yetkisini kontrol eden M2 middleware'i

const app = express(); //app adında bir uygulama nesnesi oluşturuyoruz.
app.use(express.json()); //json formatında gelen verileri okuyabilmek için express.json() middleware'ini kullanıyoruz.

const JWT_SECRET = process.env.JWT_SECRET || 'test_fallback_secret_key';

app.get('/api/health', (req, res) => { // /api/health endpoint'ine gelen GET isteğine yanıt olarak status ok döndürüyoruz.
  res.json({ status: 'ok' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(401).json({ error: 'Wrong email or password.' });
  }

  const user = db
    .prepare('SELECT id, name, email, password_hash, role, type FROM users WHERE email = ?')
    .get(email);

  if (!user) {
    return res.status(401).json({ error: 'Wrong email or password.' });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Wrong email or password.' });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      type: user.type,
    },
  });
});

app.get('/api/ai/summary', async (req, res) => { // /api/ai/summary endpoint'ine gelen GET isteğine yanıt olarak generateSummary fonksiyonunu çağırıyoruz.
  
  const summary = await generateSummary({
    role: 'parent',
    records: [{ id: 1 }, { id: 2 }],
  });
  res.json(summary);
});

app.get('/api/me', authenticateToken, (req, res) => {
  const user = db
    .prepare('SELECT id, name, email, role, type FROM users WHERE id = ?')
    .get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'No users found. Run "npm run seed" in backend.' });
  }

  res.json(user);
});


const isValidDate = (value) => {
  // Tarihin YYYY-MM-DD formatında olup olmadığını kontrol et
  if (typeof value !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  // 2026-02-30 gibi geçersiz tarihleri reddet
  const date = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value;
};

// Belirtilen tarih aralığında çocuğun etkinliklerini listele
app.get(
  '/api/children/:childId/events',
  authenticateToken,
  authorizeRoles('parent', 'specialist', 'child'),
  requireChildAccess,
  (req, res) => {
    const childId = Number(req.params.childId);
    const { from, to } = req.query;

    // Tarih parametrelerini doğrula
    if (!isValidDate(from) || !isValidDate(to) || from > to) {
      return res.status(400).json({
        error: 'Invalid date range. Use YYYY-MM-DD.'
      });
    }

    // Çocuğun seçilen tarih aralığındaki etkinliklerini getir // Veritabanındaki sütun adlarını kullanarak belirtilen tarih aralığındaki etkinlikleri getir.  // id otomatik oluşturulduğu için INSERT'te verilmez, SELECT'te okunur.
    const events = db.prepare(`
      SELECT
        id,
        child_id,
        title,
        event_date,
        start_time,
        end_time,
        created_by
      FROM events
      WHERE child_id = ?
        AND event_date >= ?
        AND event_date <= ?
      ORDER BY event_date ASC, start_time ASC, id ASC
    `).all(childId, from, to);

    return res.status(200).json(events);
  }
);


module.exports = app; // app nesnesini dışarıya açıyoruz, daha sonra server.js kullanacak.