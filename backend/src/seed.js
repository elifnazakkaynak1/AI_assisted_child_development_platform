// uydurma kullanıcı verilerini oluşturmak için kullanılacak

const db = require('./db');
const bcrypt = require('bcryptjs'); 

db.exec('DROP TABLE IF EXISTS users');

db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('parent', 'specialist', 'child')),
    type TEXT
  )
`);

function seedUsers() {
  console.log('Preparing synthetic users with secure password hashing...');

  const testPassword = 'test';
  const saltRounds = 10;
  
  const hashedPassword = bcrypt.hashSync(testPassword, saltRounds);

  const users = [
    { name: 'Selin Yildiz', email: 'parent@example.com', role: 'parent', type: null },
    { name: 'Murat Kaya', email: 'teacher@example.com', role: 'specialist', type: 'teacher' },
    { name: 'Elif Arslan', email: 'psychologist@example.com', role: 'specialist', type: 'psychologist' },
    { name: 'Deniz Yildiz', email: 'child@example.com', role: 'child', type: null },
  ];

  const insert = db.prepare(
    'INSERT INTO users (name, email, password_hash, role, type) VALUES (?, ?, ?, ?, ?)'
  );

  const seedTransaction = db.transaction((userList) => {
    for (const user of userList) {
      insert.run(user.name, user.email, hashedPassword, user.role, user.type);
    }
  });

  seedTransaction(users);

  console.log('Synthetic users successfully seeded! (All passwords: "test")');
  console.log(db.prepare('SELECT id, name, email, role, type FROM users').all());
}

try {
  seedUsers();
} catch (err) {
  console.error('Error during database seeding:', err.message);
}
