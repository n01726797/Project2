const express = require('express');
const router = express.Router();

// Home
router.get('/', (req, res) => {
  res.render('home', { title: 'Home' });
});

// About
router.get('/about', (req, res) => {
  res.render('about', { title: 'About' });
});

// Contact
router.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contact' });
});

// Login
router.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
});

module.exports = router;
