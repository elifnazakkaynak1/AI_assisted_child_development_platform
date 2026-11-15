const path = require('path');
const fs = require('fs');
const os = require('os');
const bcrypt = require('bcryptjs');
const request = require('supertest');

// Gerçek app.db'ye dokunmamak için izole bir test veritabanı yolu belirle
const testDbPath = path.join(os.tmpdir(), `gelisim_agi_test_${Date.now()}.db`);
process.env.DB_PATH = testDbPath;
process.env.JWT_SECRET = 'test_secret_key_for_jest';

const db = require('../src/db');
const app = require('../src/app');

describe('M1 - Authentication & Role Authorization Tests', () => {
  const password = 'testPassword123';
  const passwordHash = bcrypt.hashSync(password, 10);

  beforeAll(() => {
    // Test kullanıcılarını oluştur
    const insertUser = db.prepare(
      'INSERT INTO users (name, email, password_hash, role, type) VALUES (?, ?, ?, ?, ?)'
    );

    insertUser.run('Test Parent', 'parent.test@example.com', passwordHash, 'parent', null);
    insertUser.run('Test Specialist', 'specialist.test@example.com', passwordHash, 'specialist', 'teacher');
    insertUser.run('Test Child', 'child.test@example.com', passwordHash, 'child', null);
  });

  afterAll(() => {
    // Bağlantıyı kapat ve geçici test veritabanını sil
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('POST /api/auth/login (FR-M1-01, FR-M1-02)', () => {
    test('Doğru e-posta ve şifre ile 200, JWT token ve doğru rol döner', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'parent.test@example.com',
          password,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(typeof res.body.token).toBe('string');
      expect(res.body.user).toMatchObject({
        name: 'Test Parent',
        email: 'parent.test@example.com',
        role: 'parent',
      });
      // Güvenlik kontrolü: password_hash asla dönmemeli
      expect(res.body.user).not.toHaveProperty('password_hash');
    });

    test('Uzman ve çocuk hesapları kendi rolleriyle giriş yapabilir', async () => {
      const specRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'specialist.test@example.com', password });

      expect(specRes.statusCode).toBe(200);
      expect(specRes.body.user.role).toBe('specialist');

      const childRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'child.test@example.com', password });

      expect(childRes.statusCode).toBe(200);
      expect(childRes.body.user.role).toBe('child');
    });

    test('Yanlış şifre ile 401 döner', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'parent.test@example.com',
          password: 'wrongPassword!',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    test('Kayıtlı olmayan e-posta ile 401 döner', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password,
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    test('Boş e-posta veya şifre ile 401 döner', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: '', password: '' });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('JWT Doğrulama Kontrolleri (NFR-02)', () => {
    test('Token olmadan korumalı endpoint erişiminde 401 döner', async () => {
      const res = await request(app).get('/api/me');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    test('Geçersiz veya bozuk token ile 401 döner', async () => {
      const res = await request(app)
        .get('/api/me')
        .set('Authorization', 'Bearer gecersiz.sahte.token');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    test('Geçerli token ile /api/me 200 ve kullanıcı bilgisini döner', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'parent.test@example.com', password });

      const token = loginRes.body.token;

      const meRes = await request(app)
        .get('/api/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.statusCode).toBe(200);
      expect(meRes.body.email).toBe('parent.test@example.com');
      expect(meRes.body.role).toBe('parent');
    });
  });

  describe('Rol Bazlı Yetkilendirme Kontrolleri (FR-M1-03)', () => {
    test('Child rolü sadece parent yetkisindeki endpointe erişmeye çalışınca 403 döner', async () => {
      const childLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'child.test@example.com', password });

      const childToken = childLogin.body.token;

      // POST /api/specialists yalnızca 'parent' rolüne izin verir
      const res = await request(app)
        .post('/api/specialists')
        .set('Authorization', `Bearer ${childToken}`)
        .send({ childId: 3, email: 'specialist.test@example.com' });

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('error');
    });

    test('Specialist rolü sadece parent yetkisindeki endpointe erişmeye çalışınca 403 döner', async () => {
      const specLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'specialist.test@example.com', password });

      const specToken = specLogin.body.token;

      const res = await request(app)
        .post('/api/specialists')
        .set('Authorization', `Bearer ${specToken}`)
        .send({ childId: 3, email: 'specialist.test@example.com' });

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('error');
    });

    test('Child rolü /api/specialists listeleme endpointine erişmeye çalışınca 403 döner', async () => {
      const childLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'child.test@example.com', password });

      const res = await request(app)
        .get('/api/specialists')
        .set('Authorization', `Bearer ${childLogin.body.token}`);

      expect(res.statusCode).toBe(403);
    });
  });
});
