// app.js
const express    = require('express');
const path       = require('path');
const bodyParser = require('body-parser');
const morgan     = require('morgan');
const indexRoute = require('./routes/index');
console.log('indexRoute is:', indexRoute);

const app = express();

// View engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Globals
app.use((req, res, next) => {
  res.locals.searchTerm  = req.query.q     || '';
  res.locals.genreFilter = req.query.genre || '';
  next();
});

// Static assets
app.use(express.static(path.join(__dirname, 'public')));

// Logging & parsing
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));

// Main routes
app.use('/', indexRoute);

// 404 handler
app.use((req, res) => res.status(404).render('404', { title: 'Not Found' }));

// Error handler
// 7) Error handler (must have 4 args)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
});

app.listen(3000, () => console.log('Listening on http://localhost:3000'));
