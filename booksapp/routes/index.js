const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.render('home'));
router.get('/about', (req, res) => res.render('about'));
router.get('/contact', (req, res) => res.render('contact'));
router.get('/auth/login', (req, res) => res.render('login'));
router.post('/auth/login', (req, res) => {
  // dummy auth or redirect
  res.redirect('/');
});

module.exports = router;
