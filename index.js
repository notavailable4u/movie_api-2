const mongoose = require('mongoose');
const models = require('./models.js');

const movies = models.movie;
const users = models.user;

const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { check, validationResult } = require('express-validator');


const cors = require('cors');
app.use(cors());

// Import and configure authentication
// eslint-disable-next-line no-unused-vars
let auth = require('./auth')(app);

const passport = require('passport');
require('./passport');

const serveStatic = require('serve-static');


mongoose.connect(process.env.CONNECTION_URI); //Heroku connection

// GET requests
app.get('/', (req, res) => {
    res.send('<h2>Movie Database API</h2><h4>Patrick Gannon</h4>');
});

//GET all movies
app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await movies.find()
        .then((movies) => {
            res.status(201).json(movies)
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send(`Error: ${err}`)
        });
});

// GET a user by username
app.get('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await users.findOne({ username: req.params.username })
        .then((user) => {
            res.json(user);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send(`Error: ${err}`);
        });
});

//GET single movie by title
app.get('/movies/:title', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await movies.findOne({ title: req.params.title })
        .then((movie) => {
            res.json(movie);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send(`Error: err`);
        });
});

//GET single genre description by name
app.get('/movies/genre/:name', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await movies.findOne({ 'genre.name': req.params.Name }, { 'genre.name': 1, 'genre.description': 1, _id: 0 })
        .then((genre) => {
            res.json(genre);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send(`Error: err`);
        });
});

//GET single director by name
app.get('/movies/director/:name', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await movies.findOne({ 'director.name': req.params.Name }, { 'director.name': 1, 'director.bio': 1, 'director.birth': 1, 'director.death': 1, _id: 0 })
        .then((director) => {
            res.json(director);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send(`Error: err`);
        });
});

//POST requests 
// POST new user - User Registration
app.post('/users',
    //Validation Logic Username, Password, Email
    [
        check('username', 'Username must be a minimum of 5 characters in length.').isLength({ min: 5 }),
        check('username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric().trim().escape(),
        check('password', 'Password is required').not().isEmpty(),
        check('password', 'Password must be a minimum of 8 characters in length and cannot use any special characters or punctuation marks.').isLength({ min: 8 }).isAlphanumeric().trim().escape(),
        check('email', 'Email does not appear to be valid').isEmail().normalizeEmail().trim().escape()
    ],
    async (req, res) => {
        // Check validation object for errors
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        let hashedPassword = users.hashPassword(req.body.Password);
        await users.findOne({ username: req.body.username })
            .then((user) => {
                if (user) {
                    return res.status(400).send(`${req.body.username} already exists`);
                } else {
                    users
                        .create({
                            username: req.body.username,
                            password: hashedPassword,
                            email: req.body.email,
                            birthday: req.body.birthday,
                            favoriteMovies: []
                        })
                        .then((user) => { res.status(201).json(user) })
                        .catch((error) => {
                            console.error(error);
                            res.status(500).send(`Error: ${error}`);
                        });
                }
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send(`Error: ${error}`);
            });
    });

// Add movie to user Favorite list - search by username
app.post('/users/:username/movies/:movieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await users.findOneAndUpdate({ username: req.params.username }, {
        $addToSet: { favoriteMovies: req.params.movieID }
    },
        { new: true }) //return updated document
        .then((updatedUser) => {
            res.json(updatedUser);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send(`Error: ${err}`);
        });
});

// PUT request to update user info (username,email) -search by username
app.put('/users/:username', passport.authenticate('jwt', { session: false }),
    //Validation Logic Username, Email
    [
        check('username', 'Username must be a minimum of 5 characters in length.').isLength({ min: 5 }),
        check('username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric().trim().escape(),
        check('email', 'Email does not appear to be valid').isEmail().normalizeEmail().trim().escape()
    ],
    async (req, res) => {
        //check validation object for errors
        let errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        // Check to see if User exists
        if (req.user.username !== req.params.username) {
            return res.status(400).send('Permission denied');
        }
        await users.findOneAndUpdate({ username: req.params.username }, {
            $set:
            {
                username: req.body.username,
                email: req.body.Email,
            }
        },
            { new: true }) //return updated document
            .then((updatedUser) => {
                res.json(updatedUser);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send(`Error: ${err}`);
            })
    });

//DELETE Requests
// Remove movie from user Favorite List
app.delete('/users/:username/movies/:movieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await users.findOneAndUpdate({ username: req.params.username }, {
        $pull: { favoriteMovies: req.params.movieID }
    },
        { new: true }) //return updated document
        .then((updatedUser) => {
            res.json(updatedUser);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send(`Error: ${err}`);
        });
});


//Delete - Deregister User
app.delete('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await users.findOneAndDelete({ username: req.params.username })
        .then((user) => {
            if (!user) {
                res.status(400).send(`${req.params.username} was not found`);
            } else {
                res.status(200).send(`${req.params.username} was deleted.`);
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send(`Error: ${err}`);
        });
});

//static files
app.use(serveStatic('./public', { extensions: ['html', 'htm'] }));

// listen for requests
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log('Listening on Port ' + port);
});
