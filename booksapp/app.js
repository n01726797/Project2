const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const indexRoutes = require('./routes/index');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'changeMe', resave: false, saveUninitialized: true }));

app.use('/', indexRoutes);

app.use((req, res) => res.status(404).render('404', { message: 'Not Found' }));

app.listen(3000, () => console.log('Server listening on port 3000'));
