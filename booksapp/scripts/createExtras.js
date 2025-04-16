// scripts/createExtras.js
const { Client } = require('pg');
async function run() {
  const c = new Client({ connectionString: 'postgres://postgres@localhost:5432/booksapp' });
  await c.connect();
  await c.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      username TEXT NOT NULL,
      text TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS to_read (
      user_id TEXT NOT NULL,
      book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, book_id)
    );
  `);
  console.log('Extras tables created');
  await c.end();
}
run();
