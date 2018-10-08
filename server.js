require('dotenv').config();

var express = require('express');
var path = require('path');
var app = express();

var request = require('request');

app.use(express.static('public'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/current', (req, res) => {
  let appID = process.env.APP_ID;
  let openWeatherURL = `https://api.openweathermap.org/data/2.5/weather?lat=${req.query.lat}&lon=${req.query.lon}&unit=metric&APPID=${appID}`;

  request(openWeatherURL, (err, response, body) => {
    if (err) {
      //TODO: Error management
      res.json({err: err});
    }
    res.send(body);
  });

});

var listener = app.listen(process.env.PORT);
