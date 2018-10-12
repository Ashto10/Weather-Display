require('dotenv').config();

const express = require('express');
const path = process.cwd();
const app = express();

const ServerFunctions = require(path + '/ServerFunctions.js');
const sf = new ServerFunctions();

app.use(express.static('public'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/current', sf.getCurrentWeather);

app.listen(process.env.PORT);