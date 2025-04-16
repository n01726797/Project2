// scripts/seed.js
const db    = require('../db');
const fetch = require('node-fetch');

const genres = [
  'Art','Biography','Business',"Children's",'Christian','Classics','Comics','Cookbooks','Ebooks',
  'Fantasy','Fiction','Graphic Novels','Historical Fiction','History','Horror','Memoir','Music',
  'Mystery','Nonfiction','Poetry','Psychology','Romance','Science','Science Fiction','Self Help',
  'Sports','Thriller','Travel','Young Adult'
];

async function seed() {
  for (const genre of genres) {
    console.log(`Seeding genre: ${genre}`);
    const url = `https://www.googleapis.com/books/v1/volumes?q=subject:${encodeURIComponent(genre)}&maxResults=10`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Failed to fetch for genre ${genre}:`, res.statusText);
      continue;
    }
    const { items = [] } = await res.json();

    for (const vol of items) {
      const info        = vol.volumeInfo || {};
      const authors     = (info.authors || []).join(', ');
      const isbn        = (info.industryIdentifiers || []).map(i => i.identifier).join(', ');
      const thumbnail   = info.imageLinks?.thumbnail || '';
      const description = info.description || '';

      try {
        await db.query(
          `INSERT INTO books
           (google_id, title, author, isbn, genre, description, thumbnail)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT (google_id) DO NOTHING`,
          [vol.id, info.title, authors, isbn, genre, description, thumbnail]
        );
      } catch (err) {
        console.error(`DB insert error for volume ${vol.id}:`, err.message);
      }
    }
  }

  console.log('Seeding complete.');
  process.exit();
}

seed().catch(err => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
