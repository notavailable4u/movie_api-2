const express = require('express');
const app = express();
const path = require('path');
const serveStatic = require('serve-static');
const bodyParser = require('body-parser');
const uuid = require('uuid');

app.use(bodyParser.json());

// Temporary in-memory data for testing purposes only
let top10Movies = [
    {
        title: 'Movie Tittle 1'
    },
    {

        title: 'Movie Tittle 2'
    },
    {

        title: 'Movie Tittle 3'
    },
    {

        title: 'Movie Tittle 4'
    },
    {

        title: 'Movie Tittle 5'
    },
    {

        title: 'Movie Tittle 6'
    },
    {

        title: 'Movie Tittle 7'
    },
    {

        title: 'Movie Tittle 8'
    },
    {

        title: 'Movie Tittle 9'
    },
    {

        title: 'Movie Tittle 10'
    }
];

let movies = [
    {
        "Title": "Movie Title",
        "Description": "Description of movie goes here.",
        "Genre": {
            "Name": "Genre 1",
            "Description": "Description of movie genre goes here."
        },
        "Director": {
            "Name": "Director One",
            "Bio": "Bio of director One goes here.",
            "Birth": "Year of Birth"
        }
    },
    {
        "Title": "Movie Title 2",
        "Description": "Description of movie2 goes here.",
        "Genre": {
            "Name": "Genre 2",
            "Description": "Description of movie2 genre goes here."
        },
        "Director": {
            "Name": "Director Two",
            "Bio": "Bio of director goes here.",
            "Birth": "Year of Birth"
        }
    }
];

let users = [
    {
        id: 1,
        name: "Jane",
        favoriteMovies: []
    },
    {
        id: 2,
        name: "Ray",
        favoriteMovies: ["Purple Rain"]
    },
];

//Morgan
const morgan = require('morgan');
const fs = require('fs'); // import built in node modules fs and path 
// create a write stream (in append mode)
// a ‘log.txt’ file is created in root directory
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' });
// setup the logger
app.use(morgan('combined', { stream: accessLogStream }));

// GET requests
app.get('/topTen', (req, res) => {
    res.json(top10Movies);
});

app.get('/', (req, res) => {
    res.send('<h2>This is a default textual response of my choosing.</h2>');
});

//GET all movies
app.get('/movies', (req, res) => {
    res.status(200).json(movies);
});

//GET single movie by title
app.get('/movies/:title', (req, res) => {
    const { title } = req.params;
    const movie = movies.find(movie => movie.Title === title);
    if (movie) {
        res.status(200).json(movie);
    } else {
        res.status(400).send('No such movie found.')
    }
});

//GET single genre description by name/title
app.get('/movies/genre/:genreName', (req, res) => {
    const { genreName } = req.params;
    const genre = movies.find(movie => movie.Genre.Name === genreName).Genre;
    if (genre) {
        res.status(200).json(genre);
    } else {
        res.status(400).send('No such genre found.')
    }
});

//GET single director by name
app.get('/movies/director/:directorName', (req, res) => {
    const { directorName } = req.params;
    const director = movies.find(movie => movie.Director.Name === directorName).Director;
    if (director) {
        res.status(200).json(director);
    } else {
        res.status(400).send('No such director found.')
    }
});

//POST requests
// POST new user
app.post('/users', (req, res) => {
    const newUser = req.body;
    if (newUser.name) {
        newUser.id = uuid.v4();
        users.push(newUser);
        res.status(201).json(newUser)
    } else {
        res.status(400).send('User name cannot be blank.')
    }
});

// PUT request to change users name -search by id
app.put('/users/:id', (req, res) => {
    const updatedName = req.body.name;
    const id = req.params.id;
    // Find the user with the given id and update their name
    const user = users.find(user => user.id == id);
    if (user) {
        user.name = updatedName;
        res.status(200).send(`Your Username has been successfully changed to "${updatedName}"`);
    } else {
        res.status(400).send('User not found.');
    }
});

// Add movie to user Favorite list
app.post('/users/:id/:movieTitle', (req, res) => {
    const { id, movieTitle } = req.params;
    // Find the user with the given id and update their name
    let user = users.find(user => user.id == id);
    if (user) {
        user.favoriteMovies.push(movieTitle);
        res.status(200).send(`The movie,"${movieTitle}", has been added to your Favorites List.`);
    } else {
        res.status(400).send('User not found.');
    }
});

// Remove movie from user Favorite List
app.delete('/users/:id/:movieTitle', (req, res) => {
    const { id, movieTitle } = req.params;
    // Find the user with the given id and update their name
    let user = users.find(user => user.id == id);
    if (user) {
        user.favoriteMovies = user.favoriteMovies.filter(title => title !== movieTitle);
        res.status(200).send(`The movie,"${movieTitle}", has been removed from your Favorites List.`);
    } else {
        res.status(400).send('User not found.');
    }
});

//Delete / Deregister User
app.delete('/users/:id', (req, res) => {
    const { id } = req.params;
    // Find the user
    let user = users.find(user => user.id == id);
    if (user) {
        users = users.filter(user => user.id != id);
        res.status(200).send(`User"${id}", has been deleted.`);
    } else {
        res.status(400).send('User not found.');
    }
});


//static files
app.use(serveStatic('./public', { extensions: ['html', 'htm'] }));

//terminal error logging
// const methodOverride = require('method-override');
// app.use(bodyParser.urlencoded({
//     extended: true
// }));
// app.use(bodyParser.json());
// app.use(methodOverride());
// app.use((err, req, res) => {
//     console.error(err.stack);
//     res.status(500).send({ error: "Something went wrong." });
// });

// listen for requests
app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});