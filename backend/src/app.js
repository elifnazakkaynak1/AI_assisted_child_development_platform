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


//specialist ekleme endpoint'i
app.post('/api/specialists',
  authenticateToken,
  authorizeRoles('parent'),
  requireChildAccess,
  (req, res) => {

    const childId = Number(req.body.childId);
    const {email, type} = req.body;

    if(typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    const specialist = db
    .prepare('SELECT id, role, type FROM users WHERE email = ?')
    .get(email.trim());

    if (!specialist || specialist.role !== 'specialist' || (type && specialist.type !== type)) {
      return res.status(404).json({ error: 'Specialist not found or user is not a specialist.' });
    }

    try {
      db.prepare
      ('INSERT INTO relations (child_id, related_user_id, relation_type) VALUES (?, ?, ?)')
      .run(childId, specialist.id, 'specialist');
      return res.status(200).json({ message: 'Specialist linked successfully.' });
    }catch (error) {  
      if(error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
        return res.status(409).json({ error: 'Specialist is already linked to this child.' });
      }
      return res.status(500).json({ error: 'Error occurred while adding specialist.' });
    }
  }   
);

//specialist unlinkleme endpointi
app.delete('/api/specialists/:id',
  authenticateToken,
  authorizeRoles('parent'),
  requireChildAccess,
  (req, res) => {

    const specialistId = Number(req.params.id);
    const childId = Number(req.query.childId);

    if(!Number.isInteger(specialistId) || specialistId < 1 || !Number.isInteger(childId) || childId < 1) {
      return res.status(400).json({ error: 'Invalid specialist ID or child ID.' });
    }

    const result = db.prepare('DELETE FROM relations WHERE child_id = ? AND related_user_id = ? AND relation_type = ?')
      .run(childId, specialistId, 'specialist');

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Specialist not linked to this child.' });
      }

      return res.status(200).json({ message: 'Specialist unlinked successfully.' })
  }
);



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















































































app.get('/api/specialists',
   authenticateToken,
   authorizeRoles('parent', 'specialist'),
   (req, res) => {
    
    const userId = req.user.id;
    const userRole = req.user.role;

    if(userRole === 'parent') {
      const childs = db.prepare('SELECT child_id FROM relations WHERE related_user_id = ? AND relation_type = ?')
      .all(userId, 'parent');

      const childIds = childs.map(row => row.child_id);

      const results = [];

      for (const childId of childIds) {
        const specialists = db.prepare(`
          SELECT r.child_id AS childId, u.id, u.name, u.email, u.type
          FROM users u
          JOIN relations r ON u.id = r.related_user_id
          WHERE r.child_id = ? AND r.relation_type = ?
        `).all(childId, 'specialist');
        results.push(...specialists);
      }

      return res.status(200).json(results);
    }

    else if (userRole === 'specialist') {
      const childs = db.prepare('SELECT child_id FROM relations WHERE related_user_id = ? AND relation_type = ?')
      .all(userId, 'specialist');

      const childIds = childs.map(row => row.child_id);

      const results = [];
      for (const childId of childIds) {
        const findings = db.prepare('SELECT id, name FROM users WHERE id = ?').all(childId);
        results.push(...findings);
      }
      
      return res.status(200).json(results);
    }
  }
);



module.exports = app; // app nesnesini dışarıya açıyoruz, daha sonra server.js kullanacak.