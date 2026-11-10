//Bu modül uygulamanın beyni denebilir.
//uygulamayı başlatır ve hanagi adrese ne istek geliyor
//ne cevap veriliyor gibi işlemler yapar.

const express = require('express'); //express modülünü import ediyoruz.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {generateSummary} = require('./ai'); //ai.js modülünü import ediyoruz.
const db = require('./db'); //db.js modülünü import ediyoruz.

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

app.get('/api/demo/user', (req, res) => { // /api/demo/user endpoint'ine gelen GET isteğine yanıt olarak veritabanından bir kullanıcı çekiyoruz.
  
  const user = db
    .prepare('SELECT id, name, role FROM users ORDER BY id LIMIT 1')
    .get();

  if (!user) {
    return res
      .status(404)
      .json({ error: 'No users found. Run "npm run seed" in backend.' });
  }

  res.json(user);
});

module.exports = app; // app nesnesini dışarıya açıyoruz, daha sonra server.js kullanacak.