// routes/index.js
const express = require('express');
const db      = require('../db');
const fs      = require('fs');
const path    = require('path');
const router  = express.Router();


// Persisted reviews
const REVIEWS_FILE = path.join(__dirname, '..', 'reviews.json');
let reviews = {};
try {
  reviews = JSON.parse(fs.readFileSync(REVIEWS_FILE));
} catch {
  reviews = {};
}

// In‑memory to‑read set
let wantToRead = new Set();

// Static genres & quotes
// Static genres & quotes
const genres = [
  'Art','Biography','Business',"Children's",'Christian','Classics','Comics','Cookbooks','Ebooks',
  'Fantasy','Fiction','Graphic Novels','Historical Fiction','History','Horror','Memoir','Music',
  'Mystery','Nonfiction','Poetry','Psychology','Romance','Science','Science Fiction','Self Help',
  'Sports','Thriller','Travel','Young Adult'
];
const quotes = [
  { text: 'Be yourself; everyone else is already taken.', author: 'Oscar Wilde' },
  { text: 'Not all those who wander are lost.', author: 'J.R.R. Tolkien' },
  // …etc.
];

// Home: READ all books, filter, and show random quote
router.get('/', async (req, res, next) => {
  try {
    // READ: fetch all books from DB
    const { rows: allBooks } = await db.query('SELECT * FROM books');

    // Apply search & genre filters in memory
    const q     = (req.query.q     || '').toLowerCase();
    const genre = (req.query.genre || '').toLowerCase();
    let books = allBooks;
    if (q) {
      books = books.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.includes(q)
      );
    }
    if (genre) {
      books = books.filter(b => b.genre.toLowerCase() === genre);
    }

 // After filtering books array:
let randomQuote = { text: 'No quote available.', author: '' };
if (books.length > 0) {
  // Pick a random book
  const book = books[Math.floor(Math.random() * books.length)];
  // Use its description (first sentence) as the quote
  const desc = book.description || '';
  const firstSentence = desc.split(/\. |\.$/)[0];
  randomQuote = {
    text: firstSentence.length > 0 ? firstSentence : book.title,
    author: book.author
  };
}


    res.render('home', {
      title:       'Home',
      books,
      genres,
      randomQuote,
      searchTerm:  req.query.q || '',
      genreFilter: req.query.genre || ''
    });
  } catch (err) {
    next(err);
  }
});

// Detail: READ one book
router.get('/book/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rows } = await db.query('SELECT * FROM books WHERE id=$1', [id]);
    const book = rows[0];
    if (!book) return res.status(404).render('404', { title: 'Not Found' });

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

// Create: SHOW form (optional admin)
// router.get('/books/new', (req,res)=> res.render('new-book', { title:'Add Book' }));

// Create: CREATE a new book record
router.post('/books', async (req, res, next) => {
  try {
    const { google_id, title, author, isbn, genre, description, thumbnail } = req.body;
    await db.query(
      `INSERT INTO books (google_id,title,author,isbn,genre,description,thumbnail)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [google_id, title, author, isbn, genre, description, thumbnail]
    );
    res.redirect('/');
  } catch (err) {
    next(err);
  }
});

// Update: SHOW edit form (optional admin)
// router.get('/books/:id/edit', async (req,res,next)=>{ /* fetch and render */ });

// Update: UPDATE a book
router.post('/books/:id/edit', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { title, author, isbn, genre, description, thumbnail } = req.body;
    await db.query(
      `UPDATE books
       SET title=$1, author=$2, isbn=$3, genre=$4, description=$5, thumbnail=$6
       WHERE id=$7`,
      [title, author, isbn, genre, description, thumbnail, id]
    );
    res.redirect(`/book/${id}`);
  } catch (err) {
    next(err);
  }
});

// Delete: DELETE a book
router.post('/books/:id/delete', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.query('DELETE FROM books WHERE id=$1', [id]);
    res.redirect('/');
  } catch (err) {
    next(err);
  }
});
// Show “Add Book” form
router.get('/books/new', (req, res) => {
  res.render('book-form', {
    title: 'Add Book',
    book: {},        // empty object for the form
    action: '/books',
    submitLabel: 'Create'
  });
});

// Handle “Add Book” submission
router.post('/books', async (req, res, next) => {
  try {
    const { google_id, title, author, isbn, genre, description, thumbnail } = req.body;
    await db.query(
      `INSERT INTO books (google_id,title,author,isbn,genre,description,thumbnail)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [google_id, title, author, isbn, genre, description, thumbnail]
    );
    res.redirect('/');
  } catch (err) {
    next(err);
  }
});
// Show “Edit Book” form
router.get('/books/:id/edit', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id,10);
    const { rows } = await db.query('SELECT * FROM books WHERE id=$1', [id]);
    const book = rows[0];
    if (!book) return res.status(404).render('404', { title: 'Not Found' });

    res.render('book-form', {
      title: 'Edit Book',
      book,
      action: `/books/${id}/edit`,
      submitLabel: 'Update'
    });
  } catch (err) {
    next(err);
  }
});

// Handle “Edit Book” submission
router.post('/books/:id/edit', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id,10);
    const { title, author, isbn, genre, description, thumbnail } = req.body;
    await db.query(
      `UPDATE books SET title=$1,author=$2,isbn=$3,genre=$4,description=$5,thumbnail=$6
       WHERE id=$7`,
      [title, author, isbn, genre, description, thumbnail, id]
    );
    res.redirect(`/book/${id}`);
  } catch (err) {
    next(err);
  }
});
// Handle “Delete Book”
router.post('/books/:id/delete', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id,10);
    await db.query('DELETE FROM books WHERE id=$1', [id]);
    res.redirect('/');
  } catch (err) {
    next(err);
  }
});

// Toggle Want‑to‑Read (in‑memory)
router.post('/book/:id/want', (req, res) => {
  const id = parseInt(req.params.id, 10);
  wantToRead.has(id) ? wantToRead.delete(id) : wantToRead.add(id);
  res.redirect(`/book/${id}`);
});

// Submit review (in‑memory + persisted to JSON)
router.post('/book/:id/review', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { user, text, rating } = req.body;
  if (!reviews[id]) reviews[id] = [];
  reviews[id].push({
    user,
    text,
    rating: Number(rating),
    date: new Date().toLocaleString()
  });
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
  res.redirect(`/book/${id}`);
});

// To‑Read list: READ selected books
router.get('/to-read', async (req, res, next) => {
  try {
    const ids = Array.from(wantToRead);
    if (ids.length === 0) {
      return res.render('to-read', { title: 'My To‑Read List', books: [] });
    }
    const { rows: books } = await db.query(
      `SELECT * FROM books WHERE id = ANY($1::int[])`,
      [ids]
    );
    res.render('to-read', { title: 'My To‑Read List', books });
  } catch (err) {
    next(err);
  }
});

// Remove from To‑Read
router.post('/to-read/:id/remove', (req, res) => {
  const id = parseInt(req.params.id, 10);
  wantToRead.delete(id);
  res.redirect('/to-read');
});

// Static pages
router.get('/about',   (req, res) => res.render('about',   { title: 'About' }));
router.get('/contact', (req, res) => res.render('contact', { title: 'Contact' }));
router.post('/contact',(req, res) => res.send('Thanks!'));
router.get('/login',   (req, res) => res.render('login',   { title: 'Login' }));
router.post('/login',  (req, res) => res.send('Logged in!'));

module.exports = router;
