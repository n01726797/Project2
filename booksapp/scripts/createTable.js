// scripts/createTable.js
const { Client } = require('pg');

async function createTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:@localhost:5432/booksapp'
  });
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS books (
      id SERIAL PRIMARY KEY,
      google_id TEXT UNIQUE,
      title TEXT NOT NULL,
      author TEXT,
      isbn TEXT,
      genre TEXT,
      description TEXT,
      thumbnail TEXT
    );
  `);

  console.log('Table books is ready.');
  await client.end();
}

createTable().catch(err => {
  console.error(err);
  process.exit(1);
});
