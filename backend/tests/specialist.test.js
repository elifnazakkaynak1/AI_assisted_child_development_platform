const path = require('path');
const fs = require('fs');
const os = require('os');
const bcrypt = require('bcryptjs');
const request = require('supertest');

// Gerçek app.db'ye dokunmamak için bu test dosyasına özel geçici veritabanı.
// db.js bu değişkeni require edildiği anda okuduğu için require'lardan ÖNCE atanmalı.
const testDbPath = path.join(
  os.tmpdir(),
  `gelisim_agi_specialists_test_${process.pid}_${Date.now()}.db`
);
process.env.DB_PATH = testDbPath;
process.env.JWT_SECRET = 'test_secret_key_for_jest';

const db = require('../src/db');
const app = require('../src/app');

describe('M2 - Specialist linking & children list API (G3-55)', () => {
  const password = 'testPassword123';
  const passwordHash = bcrypt.hashSync(password, 4);

  // Test boyunca kullanılacak kayıtların id'leri ve token'ları
  const ids = {};
  const tokens = {};

  const insertUser = db.prepare(
    'INSERT INTO users (name, email, password_hash, role, type) VALUES (?, ?, ?, ?, ?)'
  );
  const addUser = (key, name, email, role, type = null) => {
    ids[key] = Number(insertUser.run(name, email, passwordHash, role, type).lastInsertRowid);
  };

  const login = async (email) => {
    const res = await request(app).post('/api/auth/login').send({ email, password });
    return res.body.token;
  };

  // Her testten önce ilişkileri bilinen başlangıç durumuna döndürür:
  //   parentA -> child1, parentB -> child2, teacher -> child1
  const resetRelations = () => {
    db.prepare('DELETE FROM relations').run();
    const link = db.prepare(
      'INSERT INTO relations (child_id, related_user_id, relation_type) VALUES (?, ?, ?)'
    );
    link.run(ids.child1, ids.parentA, 'parent');
    link.run(ids.child2, ids.parentB, 'parent');
    link.run(ids.child1, ids.teacher, 'specialist');
  };

  const relationExists = (childId, userId) =>
    Boolean(
      db
        .prepare(
          "SELECT 1 FROM relations WHERE child_id = ? AND related_user_id = ? AND relation_type = 'specialist'"
        )
        .get(childId, userId)
    );

  beforeAll(async () => {
    addUser('parentA', 'Parent A', 'parentA@test.com', 'parent');
    addUser('parentB', 'Parent B', 'parentB@test.com', 'parent');
    addUser('teacher', 'Test Teacher', 'teacher@test.com', 'specialist', 'teacher');
    addUser('psych', 'Test Psychologist', 'psych@test.com', 'specialist', 'psychologist');
    addUser('child1', 'Child One', 'child1@test.com', 'child');
    addUser('child2', 'Child Two', 'child2@test.com', 'child');

    tokens.parentA = await login('parentA@test.com');
    tokens.parentB = await login('parentB@test.com');
    tokens.teacher = await login('teacher@test.com');
    tokens.psych = await login('psych@test.com');
  });

  beforeEach(() => {
    resetRelations();
  });

  afterAll(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('POST /api/specialists - uzman bağlama', () => {
    test('Veli, kendi çocuğuna uzman bağlayınca 200 döner ve ilişki veritabanına yazılır', async () => {
      const res = await request(app)
        .post('/api/specialists')
        .set('Authorization', `Bearer ${tokens.parentA}`)
        .send({ childId: ids.child1, email: 'psych@test.com', type: 'psychologist' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(relationExists(ids.child1, ids.psych)).toBe(true);
    });

    test('Aynı uzmanı aynı çocuğa tekrar bağlamak 409 döner', async () => {
      const res = await request(app)
        .post('/api/specialists')
        .set('Authorization', `Bearer ${tokens.parentA}`)
        .send({ childId: ids.child1, email: 'teacher@test.com', type: 'teacher' });

      expect(res.statusCode).toBe(409);
      expect(res.body).toHaveProperty('error');
    });

    test('Kayıtlı olmayan e-posta 404 döner', async () => {
      const res = await request(app)
        .post('/api/specialists')
        .set('Authorization', `Bearer ${tokens.parentA}`)
        .send({ childId: ids.child1, email: 'yok@test.com', type: 'teacher' });

      expect(res.statusCode).toBe(404);
    });

    test('E-postası bir uzmana ait değilse (veli hesabı) 404 döner', async () => {
      const res = await request(app)
        .post('/api/specialists')
        .set('Authorization', `Bearer ${tokens.parentA}`)
        .send({ childId: ids.child1, email: 'parentB@test.com', type: 'teacher' });

      expect(res.statusCode).toBe(404);
    });

    test('Velinin kendisine bağlı olmayan çocuğa uzman bağlaması 403 döner', async () => {
      const res = await request(app)
        .post('/api/specialists')
        .set('Authorization', `Bearer ${tokens.parentA}`)
        .send({ childId: ids.child2, email: 'psych@test.com', type: 'psychologist' });

      expect(res.statusCode).toBe(403);
      expect(relationExists(ids.child2, ids.psych)).toBe(false);
    });

  });

  describe('GET /api/specialists - listeleme', () => {
    test('Veli, çocuğuna bağlı uzmanları childId ile birlikte görür', async () => {
      const res = await request(app)
        .get('/api/specialists')
        .set('Authorization', `Bearer ${tokens.parentA}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        childId: ids.child1,
        id: ids.teacher,
        name: 'Test Teacher',
        email: 'teacher@test.com',
        type: 'teacher',
      });
      // Güvenlik: şifre özeti asla dönmemeli
      expect(res.body[0]).not.toHaveProperty('password_hash');
    });

    test('Uzman, kendisine bağlı çocukları görür', async () => {
      const res = await request(app)
        .get('/api/specialists')
        .set('Authorization', `Bearer ${tokens.teacher}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([{ id: ids.child1, name: 'Child One' }]);
    });

  });

  describe('DELETE /api/specialists/:id - bağlantı kaldırma', () => {
    test('Veli bağlı uzmanı kaldırınca 200 döner ve ilişki silinir', async () => {
      const res = await request(app)
        .delete(`/api/specialists/${ids.teacher}?childId=${ids.child1}`)
        .set('Authorization', `Bearer ${tokens.parentA}`);

      expect(res.statusCode).toBe(200);
      expect(relationExists(ids.child1, ids.teacher)).toBe(false);
    });

    test('Başka velinin çocuğu için kaldırma 403 döner ve ilişki korunur', async () => {
      const res = await request(app)
        .delete(`/api/specialists/${ids.teacher}?childId=${ids.child1}`)
        .set('Authorization', `Bearer ${tokens.parentB}`);

      expect(res.statusCode).toBe(403);
      expect(relationExists(ids.child1, ids.teacher)).toBe(true);
    });

  });

  describe('GET /api/children - çocuk listesi', () => {
    test('Veli sadece kendi çocuklarını görür', async () => {
      const resA = await request(app)
        .get('/api/children')
        .set('Authorization', `Bearer ${tokens.parentA}`);
      const resB = await request(app)
        .get('/api/children')
        .set('Authorization', `Bearer ${tokens.parentB}`);

      expect(resA.statusCode).toBe(200);
      expect(resA.body).toEqual([{ id: ids.child1, name: 'Child One' }]);
      expect(resB.body).toEqual([{ id: ids.child2, name: 'Child Two' }]);
    });

    test('Uzman sadece kendisine bağlı çocukları görür', async () => {
      const teacherRes = await request(app)
        .get('/api/children')
        .set('Authorization', `Bearer ${tokens.teacher}`);
      const psychRes = await request(app)
        .get('/api/children')
        .set('Authorization', `Bearer ${tokens.psych}`);

      expect(teacherRes.body).toEqual([{ id: ids.child1, name: 'Child One' }]);
      expect(psychRes.body).toEqual([]);
    });

  });
});