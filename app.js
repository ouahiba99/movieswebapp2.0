

const ACC_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzZDBlN2FiNzhjODUyMjUwMzQ1ODhmODY0ZDNiYmQ4ZiIsInN1YiI6IjY1NWJjOGFhYjU0MDAyMTRkMTE4YTc4YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.81S8bZifrVSUhDsHNUgZcRLXLlaqNF4HTEVXQXZL6oE'; // Replace with your actual access token
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const bodyParser = require('body-parser');
const LocalStrategy = require('passport-local');
const passportLocalMongoose = require('passport-local-mongoose');
// Import 'node-fetch' using dynamic import
const fetch = (...args) => import('node-fetch').then(module => module.default(...args));
const PORT = 3000; // Replace with your desired port
const cors = require('cors');


const User = require('./model/User');
const app = express();
// Middleware to parse request bodies as JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

mongoose.connect('mongodb://127.0.0.1:27017/login');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require('express-session')({
  secret: 'Rusty is a dog',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// =====================
// ROUTES
// =====================

// Showing home page
app.get('/', (req, res) => {
  res.render('home');
});

// Showing secret page
app.get('/secret', isLoggedIn, (req, res) => {
  res.render('secret');
});

// Showing register form
app.get('/register', (req, res) => {
  res.render('register');
});

// Handling user signup
app.post('/register', async (req, res) => {
  const user = await User.create({
    username: req.body.username,
    password: req.body.password,
  });

  return res.status(200).json(user);
});

// Showing login form
app.get('/login', (req, res) => {
  res.render('login');
});

// Handling user login
app.post('/login', async (req, res) => {
  try {
    // check if the user exists
    const user = await User.findOne({ username: req.body.username });
    if (user) {
      // check if password matches
      const result = req.body.password === user.password;
      if (result) {
        res.render('secret');
      } else {
        res.status(400).json({ error: "password doesn't match" });
      }
    } else {
      res.status(400).json({ error: "User doesn't exist" });
    }
  } catch (error) {
    res.status(400).json({ error });
  }
});

// Handling user logout
app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/');
  });
});

// Showing movies page
app.get('/movies', (req, res) => {
  res.render('movies');
});

// Handle movie page form submission
app.post('/fetch-movies', async (req, res) => {
  try {
    const { page } = req.body;

    // Validate that the page is a number
    const pageNumber = parseInt(page, 10);

    if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > 55) {
      return res.status(400).json({
        error: 'Invalid page number. Please provide a number between 1 and 55.',
      });
    }

    const movieApiBaseUrl = 'https://api.themoviedb.org/3/movie/changes?page=';
    const movieApiOptions = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${ACC_TOKEN}`,
      },
    };

    const movieApiUrl = `${movieApiBaseUrl}${pageNumber}`;
    const response = await fetch(movieApiUrl, movieApiOptions);
    const json = await response.json();

    console.log(json);
    res.json(json);
  } catch (err) {
    console.error('error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Showing series page
app.get('/series', (req, res) => {
  res.render('series');
});

// Handle series page form submission
app.post('/fetch-series', async (req, res) => {
  try {
    const { page } = req.body;

    // Validate that the page is a number
    const pageNumber = parseInt(page, 10);

    if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > 55) {
      return res.status(400).json({
        error: 'Invalid page number. Please provide a number between 1 and 55.',
      });
    }

    const seriesApiBaseUrl = 'https://api.themoviedb.org/3/tv/changes?page=';
    const seriesApiOptions = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${ACC_TOKEN}`,
      },
    };

    const seriesApiUrl = `${seriesApiBaseUrl}${pageNumber}`;
    const response = await fetch(seriesApiUrl, seriesApiOptions);
    const json = await response.json();

    console.log(json);
    res.json(json);
  } catch (err) {
    console.error('error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Add this route to serve the HTML page
app.get('/select-movie-page', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});


function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

app.use(express.static('public'));
app.use(bodyParser.json());

app.get('/movies/', (req, res) => {
  const genreId = req.query.genre;

  if (!genreId) {
    return res.status(400).json({ error: 'Invalid genre ID' });
  }

  getTopRatedMoviesByGenre(genreId)
    .then(result => res.json(result))
    .catch(error => res.status(500).json({ error: error.message }));
});

function getTopRatedMoviesByGenre(genreId) {
  const ACC_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzZDBlN2FiNzhjODUyMjUwMzQ1ODhmODY0ZDNiYmQ4ZiIsInN1YiI6IjY1NWJjOGFhYjU0MDAyMTRkMTE4YTc4YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.81S8bZifrVSUhDsHNUgZcRLXLlaqNF4HTEVXQXZL6oE';  // Replace with your actual access token

  const url = `https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc&with_genres=${genreId}`;

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${ACC_TOKEN}`
    }
  };

  return fetch(url, options)
    .then(response => response.json())
    .then(data => {
      if (!data.results) {
        throw new Error('Failed to retrieve movie data');
      }
      const topRatedMovies = data.results.slice(0, 5);
      return { genreId, topRatedMovies };
    })
    .catch(() => {
      throw new Error('Failed to retrieve movie data');
    });
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});