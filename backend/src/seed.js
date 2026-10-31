// uydurma kullanıcı verilerini olulturmak için kullanılacak

const db = require('./db');

// Uydurma kullanıcı verilerini ekleyelim
const users = [
  { name: 'Taha Küçük', email: 'parent@example.com', role: 'parent' },
  { name: 'Zübeyde Günler', email: 'specialist@example.com', role: 'specialist' },
  { name: 'Ayaz Küçük', email: 'child@example.com', role: 'child' },
];

db.exec('DELETE FROM users');
db.exec("DELETE FROM sqlite_sequence WHERE name = 'users'");

const insert = db.prepare(
  'INSERT INTO users (name, email, role) VALUES (@name, @email, @role)'
);

for (const user of users) {
  insert.run(user);
}

console.log('Seeded users:');
console.log(db.prepare('SELECT * FROM users').all());