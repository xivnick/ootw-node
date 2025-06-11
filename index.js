// index.js
require('dotenv').config();
process.env.TZ = 'Asia/Seoul';

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/img', express.static(path.join(__dirname, 'static/img')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'new.html'));
});

const controller = require('./controller');

app.get('/api/weather', controller.getWeather);
app.get('/api/regions', controller.getRegions);
app.get('/api/outfit', controller.getOutfit);
app.post('/api/chatbot', controller.postChatbot);

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
