// uydurma kullanıcı verilerini oluşturmak için kullanılacak

const db = require('./db');
const bcrypt = require('bcryptjs'); 

db.exec('DROP TABLE IF EXISTS tasks');
db.exec('DROP TABLE IF EXISTS events');
db.exec('DROP TABLE IF EXISTS relations');         //veritabanı temizle
db.exec('DROP TABLE IF EXISTS users');
  

// Veritabanı tablolarını oluştur
db.exec(`                                    
  CREATE TABLE users (                     
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('parent', 'specialist', 'child')),
    type TEXT
  );

  CREATE TABLE relations (                     
    child_id INTEGER NOT NULL,
    related_user_id INTEGER NOT NULL,
    relation_type TEXT NOT NULL CHECK (relation_type IN ('parent', 'specialist')),
    PRIMARY KEY (child_id, related_user_id),
    FOREIGN KEY (child_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE CASCADE
  );

    CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    child_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    event_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    created_by INTEGER NOT NULL,
    FOREIGN KEY (child_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE tasks (
    task_id INTEGER PRIMARY KEY AUTOINCREMENT,
    child_id INTEGER NOT NULL,
    assigned_by INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    area TEXT NOT NULL
      CHECK (area IN (
        'academic',
        'language',
        'motor',
        'social-emotional',
        'self-care'
      )),
    due_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'completed')),
    assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT,

    FOREIGN KEY (child_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id)
  );

`);

// Uydurma kullanıcı verilerini ekle
function seedUsers() {
  console.log('Preparing synthetic users with secure password hashing...');

  const testPassword = 'test';
  const saltRounds = 10;
  
  const hashedPassword = bcrypt.hashSync(testPassword, saltRounds);

  const getUserId = db.prepare('SELECT id FROM users WHERE email = ?');
  const insertRelation = db.prepare(
  'INSERT INTO relations (child_id, related_user_id, relation_type) VALUES (?, ?, ?)'
  );

  const users = [
    { name: 'Selin Yildiz', email: 'parent@example.com', role: 'parent', type: null },
    { name: 'Murat Kaya', email: 'teacher@example.com', role: 'specialist', type: 'teacher' },
    { name: 'Elif Arslan', email: 'psychologist@example.com', role: 'specialist', type: 'psychologist' },
    { name: 'Deniz Yildiz', email: 'child@example.com', role: 'child', type: null },
    { name: 'Kerem Yildiz', email: 'child2@example.com', role: 'child', type: null },
    { name: 'Burak Yildiz', email: 'parent2@example.com', role: 'parent', type: null },
    { name: 'Zeynep Demir', email: 'parent3@example.com', role: 'parent', type: null },
    { name: 'Ada Demir', email: 'child3@example.com', role: 'child', type: null },
    { name: 'Cem Aydin', email: 'teacher2@example.com', role: 'specialist', type: 'teacher' },
  ];

    const relations = [
    // Ebeveyn bağlantıları
    { child: 'child@example.com',  adult: 'parent@example.com',  type: 'parent' },     // Deniz -> Selin
    { child: 'child2@example.com', adult: 'parent@example.com',  type: 'parent' },     // Kerem -> Selin
    { child: 'child@example.com',  adult: 'parent2@example.com', type: 'parent' },     // Deniz -> Burak
    { child: 'child3@example.com', adult: 'parent3@example.com', type: 'parent' },     // Ada -> Zeynep

    // Uzman bağlantıları
    { child: 'child@example.com',  adult: 'teacher@example.com',      type: 'specialist' }, // Deniz -> Murat
    { child: 'child2@example.com', adult: 'teacher@example.com',      type: 'specialist' }, // Kerem -> Murat
    { child: 'child@example.com',  adult: 'psychologist@example.com', type: 'specialist' }, // Deniz -> Elif
  ];

    const events = [
    {
      childEmail: 'child@example.com',
      creatorEmail: 'parent@example.com',
      title: 'Çocuk doktoru kontrolü',
      date: '2026-11-13',
      startTime: '10:00',
      endTime: '11:00'
    },
    {
      childEmail: 'child@example.com',
      creatorEmail: 'teacher@example.com',
      title: 'Öğretmen görüşmesi',
      date: '2026-11-11',
      startTime: '15:00',
      endTime: '16:00'
    },
    {
      childEmail: 'child@example.com',
      creatorEmail: 'parent@example.com',
      title: 'Yüzme antrenmanı',
      date: '2026-11-12',
      startTime: '14:00',
      endTime: '15:00'
    }
  ];


    const tasks = [
      {
        childEmail: 'child@example.com',
        assignerEmail: 'parent@example.com',
        title: '15 dakika sesli okuma',
        description: 'Seçtiğin bir kitabı 15 dakika boyunca sesli oku.',
        area: 'language',
        dueDate: '2026-11-16',
        status: 'completed',
        assignedAt: '2026-11-10 09:00:00',
        completedAt: '2026-11-13 18:30:00'
      },
      {
        childEmail: 'child@example.com',
        assignerEmail: 'psychologist@example.com',
        title: '5 dakika nefes egzersizi',
        description: 'Sessiz bir ortamda 5 dakika sakin nefes alıp verme çalışması yap.',
        area: 'social-emotional',
        dueDate: '2026-11-20',
        status: 'pending',
        assignedAt: '2026-11-13 10:00:00',
        completedAt: null
      },
      {
        childEmail: 'child@example.com',
        assignerEmail: 'parent@example.com',
        title: 'Okul çantasını hazırla',
        description: 'Ertesi günün ders programını kontrol et ve gerekli eşyaları çantana yerleştir.',
        area: 'self-care',
        dueDate: '2026-11-12',
        status: 'completed',
        assignedAt: '2026-11-09 17:00:00',
        completedAt: '2026-11-11 19:00:00'
      },
      {
        childEmail: 'child@example.com',
        assignerEmail: 'teacher@example.com',
        title: 'Kitaptan sevdiğin sahneyi çiz',
        description: 'Okuduğun kitaptan bir sahne seç ve resmini çiz.',
        area: 'motor',
        dueDate: '2026-11-26',
        status: 'pending',
        assignedAt: '2026-11-14 09:30:00',
        completedAt: null
      },
      {
        childEmail: 'child@example.com',
        assignerEmail: 'teacher@example.com',
        title: 'Okuma günlüğünü doldur',
        description: 'Okuduğun hikâyenin adını ve hikâyeyle ilgili üç cümleyi günlüğüne yaz.',
        area: 'academic',
        dueDate: '2026-11-30',
        status: 'pending',
        assignedAt: '2026-11-14 10:00:00',
        completedAt: null
      },
      {
        childEmail: 'child2@example.com',
        assignerEmail: 'teacher@example.com',
        title: '10 toplama sorusu çöz',
        description: 'Hazırlanan çalışma kâğıdındaki 10 toplama sorusunu tamamla.',
        area: 'academic',
        dueDate: '2026-11-18',
        status: 'pending',
        assignedAt: '2026-11-10 10:00:00',
        completedAt: null
      },
      {
        childEmail: 'child2@example.com',
        assignerEmail: 'parent@example.com',
        title: 'Kısa hikâyeyi sesli anlat',
        description: 'Okuduğun kısa bir hikâyeyi kendi cümlelerinle anlat.',
        area: 'language',
        dueDate: '2026-11-13',
        status: 'completed',
        assignedAt: '2026-11-08 12:00:00',
        completedAt: '2026-11-12 17:00:00'
      },
      {
        childEmail: 'child3@example.com',
        assignerEmail: 'parent3@example.com',
        title: 'Top yakalama çalışması',
        description: 'Bir yetişkinle karşılıklı olarak topu 10 kez atıp yakalama çalışması yap.',
        area: 'motor',
        dueDate: '2026-12-02',
        status: 'pending',
        assignedAt: '2026-11-14 11:00:00',
        completedAt: null
      }
  ];




  // Veritabanına kullanıcıları ekle
  const insert = db.prepare(
    'INSERT INTO users (name, email, password_hash, role, type) VALUES (?, ?, ?, ?, ?)'
  );

  // Transaction kullanarak kullanıcıları ekle
  const seedTransaction = db.transaction((userList) => {
    for (const user of userList) {
      insert.run(user.name, user.email, hashedPassword, user.role, user.type);
    }
  });

  const seedRelationsTransaction = db.transaction((relationList) => {
    for (const relation of relationList) {
      const childId = getUserId.get(relation.child).id;
      const adultId = getUserId.get(relation.adult).id;
      if(!childId || !adultId) {
        throw new Error(`Child or adult not found for relation: ${relation.child} - ${relation.adult}`);
      }
      insertRelation.run(childId, adultId, relation.type);
    }
  });

// Etkinlikleri veritabanına eklemek için SQL sorgusu
  const insertEvent = db.prepare(`
    INSERT INTO events
    (child_id, title, event_date, start_time, end_time, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Örnek etkinlikleri tek bir işlemde veritabanına kaydet
  const seedEventsTransaction = db.transaction((eventList) => {
    for (const event of eventList) {
      const child = getUserId.get(event.childEmail);
      const creator = getUserId.get(event.creatorEmail);

      if (!child || !creator) {
        throw new Error('Child or event creator not found.');
      }

      insertEvent.run(
        child.id,
        event.title,
        event.date,
        event.startTime,
        event.endTime,
        creator.id
      );
    }
  });


  // Görevleri tasks tablosuna eklemek için SQL sorgusu
  const insertTask = db.prepare(`
    INSERT INTO tasks (
      child_id,
      assigned_by,
      title,
      description,
      area,
      due_date,
      status,
      assigned_at,
      completed_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Örnek görevleri tek bir transaction içinde veritabanına kaydet
  const seedTasksTransaction = db.transaction((taskList) => {
    for (const task of taskList) {
      const child = getUserId.get(task.childEmail);
      const assigner = getUserId.get(task.assignerEmail);

      // Çocuk ve görevi atayan kullanıcı veritabanında bulunmalı
      if (!child || !assigner) {
        throw new Error('Child or task assigner not found.');
      }

      insertTask.run(
        child.id,
        assigner.id,
        task.title,
        task.description,
        task.area,
        task.dueDate,
        task.status,
        task.assignedAt,
        task.completedAt
      );
    }
  });



  // Transaction'ı çalıştır
  seedTransaction(users);
  seedRelationsTransaction(relations);
  seedEventsTransaction(events);
  seedTasksTransaction(tasks);

  console.log('Synthetic users successfully seeded! (All passwords: "test")');
  console.log(db.prepare('SELECT id, name, email, role, type FROM users').all());
  console.log(db.prepare('SELECT * FROM relations').all());
  console.log(db.prepare('SELECT * FROM events').all());
  console.log(db.prepare('SELECT * FROM tasks').all());
}

try {
  seedUsers();
} catch (err) {
  console.error('Error during database seeding:', err.message);
}
