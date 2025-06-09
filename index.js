// index.js
require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const controller = require('./controller');

app.use('/img', express.static(path.join(__dirname, 'static/img')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'new.html'));
});

app.get('/weather', controller.getWeather);
app.get('/regions', controller.getRegions);
app.get('/outfit', controller.getOutfit);


app.use((req, res, next) => {

    const error = {
        status: 404, 
        message: 'PAGE_NOT_FOUND'
    };

    return next(error);
});

app.use((err, req, res, next) => { 

    console.log({err});

    res.status(err.status || 500);
    res.json(err); 
});

app.listen(PORT, () =>
    console.log(`Server listening on http://localhost:${PORT}`)
);
