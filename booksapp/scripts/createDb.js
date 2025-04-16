// scripts/createDb.js
const { Client } = require('pg');

async function createDb() {
  // Connect to default postgres database
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:@localhost:5432/postgres'
  });
  await client.connect();

  // Create bookapp database if not exists
  await client.query(`CREATE DATABASE booksapp;`)
    .catch(err => {
      if (err.code === '42P04') {
        console.log('Database bookaspp already exists.');
      } else {
        throw err;
      }
    });

  console.log('Database booksapp is ready.');
  await client.end();
}

createDb().catch(err => {
  console.error(err);
  process.exit(1);
});
