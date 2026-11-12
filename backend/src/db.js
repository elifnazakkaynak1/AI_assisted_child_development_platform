// bu modül veritabanı dosyasının duracağı klasorü hazırlar 
// o dosyaya bağlanır ve veri tabanı işlemlerini yapar.

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'app.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('parent', 'specialist', 'child')),
    type TEXT
  );

  CREATE TABLE IF NOT EXISTS relations (
    child_id INTEGER NOT NULL,
    related_user_id INTEGER NOT NULL,
    relation_type TEXT NOT NULL CHECK (relation_type IN ('parent', 'specialist')),
    PRIMARY KEY (child_id, related_user_id),
    FOREIGN KEY (child_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

module.exports = db;
