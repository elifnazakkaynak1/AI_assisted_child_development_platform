// uydurma kullanıcı verilerini oluşturmak için kullanılacak

const db = require('./db');
const bcrypt = require('bcryptjs'); 


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

  // Transaction'ı çalıştır
  seedTransaction(users);
  seedRelationsTransaction(relations);

  console.log('Synthetic users successfully seeded! (All passwords: "test")');
  console.log(db.prepare('SELECT id, name, email, role, type FROM users').all());
  console.log(db.prepare('SELECT * FROM relations').all());
}

try {
  seedUsers();
} catch (err) {
  console.error('Error during database seeding:', err.message);
}
