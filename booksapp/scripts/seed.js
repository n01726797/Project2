// scripts/seed.js
const db = require('../db');
const fetch = require('node-fetch');

async function seed() {
  const url = 'https://www.googleapis.com/books/v1/volumes?q=subject:Fiction&maxResults=20';
  const res = await fetch(url);
  const { items = [] } = await res.json();

  for (const vol of items) {
    const info = vol.volumeInfo || {};
    const authors = (info.authors || []).join(', ');
    const isbn = (info.industryIdentifiers || []).map(i=>i.identifier).join(', ');
    const genre = (info.categories || ['Unknown'])[0];
    const thumbnail = info.imageLinks?.thumbnail || '';

    await db.query(
      `INSERT INTO books
       (google_id, title, author, isbn, genre, description, thumbnail)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (google_id) DO NOTHING`,
      [vol.id, info.title, authors, isbn, genre, info.description, thumbnail]
    );
  }
  console.log('Seed complete');
  process.exit();
}

seed().catch(err => { console.error(err); process.exit(1); });
