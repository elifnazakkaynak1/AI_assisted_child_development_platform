const fs = require('fs');
const os = require('os');
const path = require('path');
const bcrypt = require('bcryptjs');
const request = require('supertest');

// Her test dosyasi kendi gecici SQLite veritabanini kullanir.
// Gercek backend/data/app.db dosyasina dokunulmaz.
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'g3-61-schedule-'));
process.env.DB_PATH = path.join(testDir, 'test.db');
process.env.JWT_SECRET = 'g3-61-jest-test-secret';

const db = require('../src/db');
const app = require('../src/app');

const password = 'Test1234!';
const passwordHash = bcrypt.hashSync(password, 4);

function createUser(name, email, role, type = null) {
  const result = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, type)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, email, passwordHash, role, type);
  return Number(result.lastInsertRowid);
}

function linkChild(childId, userId, relationType) {
  db.prepare(`
    INSERT INTO relations (child_id, related_user_id, relation_type)
    VALUES (?, ?, ?)
  `).run(childId, userId, relationType);
}

async function getToken(email) {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  expect(response.status).toBe(200);
  return response.body.token;
}

const eventBody = {
  title: 'Haftalik okuma etkinligi',
  date: '2026-11-23',
  startTime: '10:00',
  endTime: '10:30'
};

let childId;
let otherChildId;
let parentToken;
let specialistToken;
let unlinkedSpecialistToken;
let childToken;

beforeAll(async () => {
  const parentId = createUser('Parent', 'm3-parent@test.local', 'parent');
  const specialistId = createUser('Linked Specialist', 'm3-specialist@test.local', 'specialist', 'teacher');
  createUser('Unlinked Specialist', 'm3-unlinked@test.local', 'specialist', 'teacher');
  childId = createUser('Child', 'm3-child@test.local', 'child');
  otherChildId = createUser('Other Child', 'm3-other-child@test.local', 'child');

  linkChild(childId, parentId, 'parent');
  linkChild(otherChildId, parentId, 'parent');
  linkChild(childId, specialistId, 'specialist');

  [parentToken, specialistToken, unlinkedSpecialistToken, childToken] = await Promise.all([
    getToken('m3-parent@test.local'),
    getToken('m3-specialist@test.local'),
    getToken('m3-unlinked@test.local'),
    getToken('m3-child@test.local')
  ]);
});

beforeEach(() => {
  db.prepare('DELETE FROM events').run();
});

afterAll(() => {
  db.close();
  fs.rmSync(testDir, { recursive: true, force: true });
});

describe('G3-61 - M3 Schedule Tests (FR-M3-01..04)', () => {
  test('Parent etkinlik ekler; etkinlik haftalik listede gorunur', async () => {
    const created = await request(app)
      .post(`/api/children/${childId}/events`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send(eventBody);

    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      child_id: childId,
      title: eventBody.title,
      event_date: eventBody.date,
      start_time: eventBody.startTime,
      end_time: eventBody.endTime
    });

    const listed = await request(app)
      .get(`/api/children/${childId}/events`)
      .set('Authorization', `Bearer ${parentToken}`)
      .query({ from: '2026-11-23', to: '2026-11-29' });

    expect(listed.status).toBe(200);
    expect(listed.body).toHaveLength(1);
    expect(listed.body[0].id).toBe(created.body.id);
  });

  test('Bagli Specialist cocuga etkinlik ekleyebilir', async () => {
    const response = await request(app)
      .post(`/api/children/${childId}/events`)
      .set('Authorization', `Bearer ${specialistToken}`)
      .send({ ...eventBody, title: 'Uzman gorusmesi' });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Uzman gorusmesi');
    expect(response.body.child_id).toBe(childId);
  });

  test('Bagli olmayan Specialist 403 alir', async () => {
    const response = await request(app)
      .post(`/api/children/${childId}/events`)
      .set('Authorization', `Bearer ${unlinkedSpecialistToken}`)
      .send(eventBody);

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('error');
  });

  test('Child kendi etkinliklerini gorur, baska cocugunkileri goremez', async () => {
    await request(app)
      .post(`/api/children/${childId}/events`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ ...eventBody, title: 'Benim etkinligim' });

    await request(app)
      .post(`/api/children/${otherChildId}/events`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ ...eventBody, title: 'Baska cocugun etkinligi' });

    const ownEvents = await request(app)
      .get(`/api/children/${childId}/events`)
      .set('Authorization', `Bearer ${childToken}`)
      .query({ from: '2026-11-23', to: '2026-11-29' });

    expect(ownEvents.status).toBe(200);
    expect(ownEvents.body.map(event => event.title)).toEqual(['Benim etkinligim']);

    const otherEvents = await request(app)
      .get(`/api/children/${otherChildId}/events`)
      .set('Authorization', `Bearer ${childToken}`)
      .query({ from: '2026-11-23', to: '2026-11-29' });

    expect(otherEvents.status).toBe(403);
  });

  test('Etkinlik olmayan hafta bos dizi doner', async () => {
    const response = await request(app)
      .get(`/api/children/${childId}/events`)
      .set('Authorization', `Bearer ${parentToken}`)
      .query({ from: '2026-12-07', to: '2026-12-13' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});
