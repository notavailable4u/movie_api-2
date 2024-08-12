require('dotenv').config();
const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { check, validationResult } = require('express-validator');

const cors = require('cors');
// app.use(cors());
let allowedOrigins = ['http://localhost:8080', 'http://localhost:1234', 'https://movie-api-pgannon.netlify.app', 'http://localhost:4200', 'https://notavailable4u.github.io', 'https://notavailable4u.github.io/myflix-angular-client', 'https://movie-api-ptng-d305c73322c3.herokuapp.com', 'http://client-react-app-code.s3-website-us-east-1.amazonaws.com', '172.31.95.169', '23.21.126.79'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) { // If a specific origin isn’t found on the list of allowed origins
            let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
            return callback(new Error(message), false);
        }
        return callback(null, true);
    }
}));

// Import and configure authentication
// eslint-disable-next-line no-unused-vars
let auth = require('./auth')(app);

const passport = require('passport');
require('./passport');

const serveStatic = require('serve-static');

//mongoose.connect('mongodb://127.0.0.1/project2'); //Local Copy
mongoose.connect(process.env.CONNECTION_URI); //Heroku connection

// GET requests
app.get('/', (req, res) => {
    res.redirect('/documentation');
});

//GET all movies
app.get('/Movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.find()
        .then((movies) => {
            res.status(201).json(movies)
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send(`Error: ${err}`)
        });
});

// GET a user by username
app.get('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findOne({ Username: req.params.Username })
        .then((user) => {
            res.json(user);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send(`Error: ${err}`);
        });
});


// GET favorite movies of a user by username
app.get('/users/:Username/favoriteMovies', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findOne({ Username: req.params.Username })
        .then((user) => {
            if (user) {
                const favoriteMovies = user.FavoriteMovies;
                res.json(favoriteMovies);
            } else {
                res.status(404).send('User not found');
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send(`Error: ${err}`);
        });
});



//GET single movie by title
app.get('/Movies/:Title', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.findOne({ Title: req.params.Title })
        .then((movie) => {
            res.json(movie);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send(`Error: err`);
        });
});

//GET single genre description by name
app.get('/Movies/Genre/:Name', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.findOne({ 'Genre.Name': req.params.Name }, { 'Genre.Name': 1, 'Genre.Description': 1, _id: 0 })
        .then((genre) => {
            res.json(genre);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send(`Error: err`);
        });
});

//GET single director by name
app.get('/Movies/Director/:Name', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.findOne({ 'Director.Name': req.params.Name }, { 'Director.Name': 1, 'Director.Bio': 1, 'Director.Birth': 1, 'Director.Death': 1, _id: 0 })
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
        check('Username', 'Username must be a minimum of 5 characters in length.').isLength({ min: 5 }),
        check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric().trim().escape(),
        check('Password', 'Password is required').not().isEmpty(),
        check('Password', 'Password must be a minimum of 8 characters in length and cannot use any special characters or punctuation marks.').isLength({ min: 8 }).isAlphanumeric().trim().escape(),
        check('Email', 'Email does not appear to be valid').isEmail().normalizeEmail().trim().escape()
    ],
    async (req, res) => {
        // Check validation object for errors
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        let hashedPassword = Users.hashPassword(req.body.Password);
        await Users.findOne({ Username: req.body.Username })
            .then((user) => {
                if (user) {
                    return res.status(400).send(`${req.body.Username} already exists`);
                } else {
                    Users
                        .create({
                            Username: req.body.Username,
                            Password: hashedPassword,
                            Email: req.body.Email,
                            Birthday: req.body.Birthday,
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
app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findOneAndUpdate({ Username: req.params.Username }, {
        $addToSet: { FavoriteMovies: req.params.MovieID }
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
app.put('/users/:Username', passport.authenticate('jwt', { session: false }),
    //Validation Logic Username, Email
    [
        check('Username', 'Username must be a minimum of 5 characters in length.').isLength({ min: 5 }),
        check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric().trim().escape(),
        check('Email', 'Email does not appear to be valid').isEmail().normalizeEmail().trim().escape()
    ],
    async (req, res) => {
        //check validation object for errors
        let errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        // Check to see if User exists
        if (req.user.Username !== req.params.Username) {
            return res.status(400).send('Permission denied');
        }
        await Users.findOneAndUpdate({ Username: req.params.Username }, {
            $set:
            {
                Username: req.body.Username,
                Email: req.body.Email,
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
app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findOneAndUpdate({ Username: req.params.Username }, {
        $pull: { FavoriteMovies: req.params.MovieID }
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
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findOneAndDelete({ Username: req.params.Username })
        .then((user) => {
            if (!user) {
                res.status(400).send(`${req.params.Username} was not found`);
            } else {
                res.status(200).send(`${req.params.Username} was deleted.`);
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
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Listening on Port ${PORT}`);
});

