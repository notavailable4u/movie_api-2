const express = require('express');
const app = express();
const path = require('path');
//const staticPath = path.join(__dirname, 'public');
//const docuRouter = require('./routes/docuRoute.js');

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

//Morgan
const morgan = require('morgan');
const fs = require('fs'); // import built in node modules fs and path 
// create a write stream (in append mode)
// a ‘log.txt’ file is created in root directory
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' });
// setup the logger
app.use(morgan('combined', { stream: accessLogStream }));

// GET requests
app.get('/movies', (req, res) => {
    res.json(top10Movies);
});

app.get('/', (req, res) => {
    res.send('<h2>This is a default textual response of my choosing.</h2>');
});

app.get('/documentation.html', (req, res) => {
    res.redirect('/public/documentation.html')
});

app.use(express.static(path.join(__dirname, 'public')));
// app.use('/documentation', docuRouter);

module.exports = app;

//terminal logging
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride());
app.use((err, req, res) => {
    console.error(err.stack);
    res.status(500).send('Internal Server Error');
});

// listen for requests
app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});