const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//const path = require('path');
const serveStatic = require('serve-static');
//const uuid = require('uuid');

mongoose.connect('mongodb://127.0.0.1/project2');

//Morgan
// const morgan = require('morgan');
// const fs = require('fs'); // import built in node modules fs and path 
// const { error } = require('console');
// // create a write stream (in append mode)
// // a ‘log.txt’ file is created in root directory
// const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' });
// // setup the logger
// app.use(morgan('combined', { stream: accessLogStream }));

// GET requests
app.get('/', (req, res) => {
    res.send('<h2>This is a default textual response of my choosing.</h2>');
});

//GET all movies
app.get('/Movies', async (req, res) => {
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
app.get('/users/:Username', async (req, res) => {
    await Users.findOne({ Username: req.params.Username })
        .then((user) => {
            res.json(user);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send(`Error: ${err}`);
        });
});

//GET single movie by title
app.get('/Movies/:Title', async (req, res) => {
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
app.get('/Movies/Genre/:Name', async (req, res) => {
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
app.get('/Movies/Director/:Name', async (req, res) => {
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
app.post('/users', async (req, res) => {
    await Users.findOne({ Username: req.body.Username })
        .then((user) => {
            if (user) {
                return res.status(400).send(`${req.body.Username} already exists`);
            } else {
                Users
                    .create({
                        Username: req.body.Username,
                        Password: req.body.Password,
                        Email: req.body.Email,
                        Birthday: req.body.Birthday,
                        favoriteMovies: []
                    })
                    .then((user) => { res.status(201).json(user) })
                    .catch((error) => {
                        console.error(error);
                        res.status(500).send(`Error: ${error}`);
                    })
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send(`Error: ${error}`);
        });
});

// PUT request to change users name -search by username
app.put('/users/:Username', async (req, res) => {
    await Users.findOneAndUpdate({ Username: req.params.Username }, {
        $set:
        {
            Username: req.body.Username,
            Password: req.body.Password,
            Email: req.body.Email,
            Birthday: req.body.Birthday
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

// Add movie to user Favorite list - search by username
app.post('/users/:Username/movies/:MovieID', async (req, res) => {
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

//DELETE Requests
// Remove movie from user Favorite List
app.delete('/users/:Username/movies/:MovieID', async (req, res) => {
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
app.delete('/users/:Username', async (req, res) => {
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
app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});