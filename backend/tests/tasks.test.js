const fs = require('fs');
const os = require('os');
const path = require('path');
const bcrypt = require('bcryptjs');
const request = require('supertest');

// Testler gecici veritabaninda calisir; gercek app.db korunur.
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'g3-69-tasks-'));
process.env.DB_PATH = path.join(testDir, 'test.db');
process.env.JWT_SECRET = 'g3-69-jest-test-secret';

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

const taskBody = {
  title: 'Matematik tekrari',
  description: 'On soru coz',
  area: 'academic',
  dueDate: '2026-11-25'
};

let childId;
let parentId;
let parentToken;
let childToken;
let otherChildToken;
let unlinkedSpecialistToken;

beforeAll(async () => {
  parentId = createUser('Parent', 'm4-parent@test.local', 'parent');
  createUser('Unlinked Specialist', 'm4-unlinked@test.local', 'specialist', 'teacher');
  childId = createUser('Child', 'm4-child@test.local', 'child');
  createUser('Other Child', 'm4-other-child@test.local', 'child');

  linkChild(childId, parentId, 'parent');

  [parentToken, childToken, otherChildToken, unlinkedSpecialistToken] = await Promise.all([
    getToken('m4-parent@test.local'),
    getToken('m4-child@test.local'),
    getToken('m4-other-child@test.local'),
    getToken('m4-unlinked@test.local')
  ]);
});

beforeEach(() => {
  db.prepare('DELETE FROM tasks').run();
});

afterAll(() => {
  db.close();
  fs.rmSync(testDir, { recursive: true, force: true });
});

describe('G3-69 - M4 Task Tests (FR-M4-01..05)', () => {
  test('Flow 2: Parent atar, Child gorur/tamamlar, Parent completed gorur', async () => {
    const assigned = await request(app)
      .post(`/api/children/${childId}/tasks`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send(taskBody);

    expect(assigned.status).toBe(201);
    expect(assigned.body.task).toMatchObject({
      child_id: childId,
      assigned_by: parentId,
      title: taskBody.title,
      status: 'pending'
    });
    const taskId = assigned.body.task.task_id;

    const childList = await request(app)
      .get(`/api/children/${childId}/tasks`)
      .set('Authorization', `Bearer ${childToken}`);

    expect(childList.status).toBe(200);
    expect(childList.body.map(task => task.task_id)).toContain(taskId);

    const completed = await request(app)
      .patch(`/api/children/${childId}/tasks/${taskId}/complete`)
      .set('Authorization', `Bearer ${childToken}`);

    expect(completed.status).toBe(200);
    expect(completed.body.task.status).toBe('completed');
    expect(completed.body.task.completed_at).toEqual(expect.any(String));

    const parentList = await request(app)
      .get(`/api/children/${childId}/tasks`)
      .set('Authorization', `Bearer ${parentToken}`);

    expect(parentList.status).toBe(200);
    expect(parentList.body).toEqual(expect.arrayContaining([
      expect.objectContaining({
        task_id: taskId,
        status: 'completed',
        completed_at: completed.body.task.completed_at
      })
    ]));
  });

  test('Bagli olmayan Specialist gorev atayamaz ve listeleyemez (403)', async () => {
    const assigned = await request(app)
      .post(`/api/children/${childId}/tasks`)
      .set('Authorization', `Bearer ${unlinkedSpecialistToken}`)
      .send(taskBody);

    const listed = await request(app)
      .get(`/api/children/${childId}/tasks`)
      .set('Authorization', `Bearer ${unlinkedSpecialistToken}`);

    expect(assigned.status).toBe(403);
    expect(listed.status).toBe(403);
  });

  test('Child baska cocugun gorevini tamamlayamaz (403)', async () => {
    const assigned = await request(app)
      .post(`/api/children/${childId}/tasks`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send(taskBody);

    expect(assigned.status).toBe(201);
    const response = await request(app)
      .patch(`/api/children/${childId}/tasks/${assigned.body.task.task_id}/complete`)
      .set('Authorization', `Bearer ${otherChildToken}`);

    expect(response.status).toBe(403);
    expect(db.prepare('SELECT status FROM tasks WHERE task_id = ?')
      .get(assigned.body.task.task_id).status).toBe('pending');
  });

  test.each([
    ['title', { area: 'academic', dueDate: '2026-11-25' }],
    ['area', { title: 'Eksik alan', dueDate: '2026-11-25' }],
    ['dueDate', { title: 'Eksik tarih', area: 'academic' }]
  ])('Eksik %s ile gorev atama 400 doner', async (_field, body) => {
    const response = await request(app)
      .post(`/api/children/${childId}/tasks`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send(body);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

});
