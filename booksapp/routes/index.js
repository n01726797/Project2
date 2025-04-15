const express = require('express');
const fetch   = require('node-fetch');
const router  = express.Router();

// In‑memory stores
const fs   = require('fs');
const path = require('path');
const REVIEWS_FILE = path.join(__dirname, '..', 'reviews.json');

let reviews = {};
try {
  reviews = JSON.parse(fs.readFileSync(REVIEWS_FILE));
} catch {
  reviews = {};
}
let wantToRead = new Set();

// Sample genres and quotes
const genres = [
  'Art','Biography','Business',"Children's",'Christian','Classics','Comics','Cookbooks','Ebooks',
  'Fantasy','Fiction','Graphic Novels','Historical Fiction','History','Horror','Memoir','Music',
  'Mystery','Nonfiction','Poetry','Psychology','Romance','Science','Science Fiction','Self Help',
  'Sports','Thriller','Travel','Young Adult'
];
const quotes = [
  { text:'Be yourself; everyone else is already taken.', author:'Oscar Wilde' },
  { text:'Not all those who wander are lost.', author:'J.R.R. Tolkien' },
  // …add more…
];

// Helper to map Google Books API data to our shape
function mapVolumeToBook(vol) {
  const info = vol.volumeInfo || {};
  return {
    id:          vol.id,
    title:       info.title || 'No title',
    author:      (info.authors || []).join(', '),
    isbn:        (info.industryIdentifiers || []).map(i=>i.identifier).join(', '),
    genre:       (info.categories || ['Unknown'])[0],
    description: info.description || 'No description available.',
    thumbnail:   info.imageLinks?.thumbnail || '/images/placeholder.png'
  };
}

router.get('/', async (req, res, next) => {
  console.log('--- Home Route Debug ---');
  console.log('Query:', req.query);

  const q     = req.query.q     || '';
  const genre = req.query.genre || '';

  console.log('Search term:', q);
  console.log('Genre filter:', genre);

  try {
    // Default query logic
    let query;
    if (!q && !genre) {
      query = 'subject:Fiction';
    } else {
      query = q;
      if (genre) {
        query += (q ? '+' : '') + `subject:${genre}`;
      }
    }

    console.log('Using query:', query);
    const url   = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20`;
    console.log('Fetching URL:', url);

    const apiRes = await fetch(url);
    if (!apiRes.ok) throw new Error(`Google API status ${apiRes.status}`);
    const data = await apiRes.json();
    const items = data.items || [];
    console.log('API returned items:', items.length);

    const books = items.map(vol => {
      const info = vol.volumeInfo || {};
      return {
        id:    vol.id,
        title: info.title || 'No title',
        author:(info.authors || []).join(', '),
        genre: (info.categories || ['Unknown'])[0],
        isbn:  (info.industryIdentifiers||[]).map(i=>i.identifier).join(', '),
        thumbnail: info.imageLinks?.thumbnail || '/images/placeholder.png'
      };
    });
    console.log('Mapped books:', books.length);

    const randomQuote = quotes[Math.floor(Math.random()*quotes.length)];
    console.log('Random quote:', randomQuote);

    res.render('home', {
      title:       'Home',
      books,
      genres,
      randomQuote,
      searchTerm:  q,
      genreFilter: genre
    });
  } catch (err) {
    console.error('Home route error:', err);
    next(err);
  }
});

// Book detail
router.get('/book/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const url    = `https://www.googleapis.com/books/v1/volumes/${id}`;
    const apiRes = await fetch(url);
    const json   = await apiRes.json();
    const book   = mapVolumeToBook(json);

    res.render('book', {
      title:   book.title,
      book,
      reviews: reviews[id] || [],
      want:    wantToRead.has(id)
    });
  } catch (err) {
    next(err);
  }
});
// To‑Read list page (full details)
router.get('/to-read', async (req, res, next) => {
  try {
    // wantToRead is a Set of volume IDs
    const ids = Array.from(wantToRead);
    // Fetch details for each ID in parallel
    const promises = ids.map(id =>
      fetch(`https://www.googleapis.com/books/v1/volumes/${id}`)
        .then(r => r.json())
        .then(json => mapVolumeToBook(json))
    );
    const books = await Promise.all(promises);

    res.render('to-read', {
      title: 'My To‑Read List',
      books
    });
  } catch (err) {
    console.error('Error in /to-read:', err);
    next(err);
  }
});

// Remove from To‑Read
router.post('/to-read/:id/remove', (req, res) => {
  wantToRead.delete(req.params.id);
  res.redirect('/to-read');
});

// Remove from To‑Read
router.post('/to-read/:id/remove', (req, res) => {
  try {
    wantToRead.delete(req.params.id);
    res.redirect('/to-read');
  } catch (err) {
    console.error('Error removing from to-read:', err);
    res.status(500).send('Server Error');
  }
});


// Toggle Want‑to‑Read
router.post('/book/:id/want', (req, res) => {
  const id = req.params.id;
  if (wantToRead.has(id)) wantToRead.delete(id);
  else wantToRead.add(id);
  res.redirect(`/book/${id}`);
});

// Submit review + rating
router.post('/book/:id/review', (req, res) => {
  const { user, text, rating } = req.body;
  if (!reviews[req.params.id]) reviews[req.params.id] = [];
  reviews[req.params.id].push({
    user,
    text,
    rating: Number(rating),
    date: new Date().toLocaleString()
  });
  res.redirect(`/book/${req.params.id}`);
});

// Static pages
router.get('/about',   (req, res) => res.render('about',   { title: 'About' }));
router.get('/contact', (req, res) => res.render('contact', { title: 'Contact' }));
router.post('/contact',(req, res) => res.send('Thanks!'));
router.get('/login',   (req, res) => res.render('login',   { title: 'Login' }));
router.post('/login',  (req, res) => res.send('Logged in!'));

module.exports = router;
