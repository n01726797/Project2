// routes/index.js
const express = require('express');
const fetch   = require('node-fetch');
const router  = express.Router();

// Helper: map Google Books volume to our shape
function mapVolumeToBook(vol) {
  const info = vol.volumeInfo;
  return {
    title:  info.title || 'No title',
    author: (info.authors && info.authors.join(', ')) || 'Unknown',
    genre:  (info.categories && info.categories[0]) || 'General',
    // Google Books doesn’t give quotes, so we’ll pick the first sentence of the description
    quote:  info.description
              ? info.description.split('. ')[0] + '.'
              : 'No quote available.'
  };
}

// Home: show books by genre, author, or default
router.get('/', async (req, res, next) => {
  try {
    // Query params: ?q=inauthor:Orwell or ?q=subject:Fantasy
    const rawQ = req.query.q || 'subject:Fiction';
    // URL‑encode and fetch
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(rawQ)}&maxResults=20`;
    const apiRes = await fetch(url);
    const json   = await apiRes.json();

    // Map items to our book shape, filter out any without volumeInfo
    const books = (json.items || [])
                    .filter(v => v.volumeInfo)
                    .map(mapVolumeToBook);

    res.render('home', { title: 'Home', books, rawQ });
  } catch (err) {
    next(err);
  }
});

// (The rest of your routes—About, Contact, Login—stay the same.)

module.exports = router;
