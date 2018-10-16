const request = require('request');

function ServerFunctions() {
  this.getCurrentWeather = (req, res) => {
    let appID = process.env.APP_ID;
    let openWeatherURL = `https://api.openweathermap.org/data/2.5/weather?lat=${req.query.lat}&lon=${req.query.lon}&units=imperial&APPID=${appID}`;

    request(openWeatherURL, (err, response, body) => {
      if (err) {
        res.status(500).send('OpenWeatherMap API timeout!');
      }

      let data = JSON.parse(body);

      res.json({
        city: data.name,
        currentTime: data.dt,
        sunrise: data.sys.sunrise,
        sunset: data.sys.sunset,
        description: data.weather[0].description,
        icon: `http://openweathermap.org/img/w/${data.weather[0].icon}.png`,
        humidity: data.main.humidity,
        windDirection: data.wind.deg,
        currentTemp: data.main.temp,
        minTemp: data.main.temp_min,
        maxTemp: data.main.temp_max,
        windSpeed: data.wind.speed,
        isMetric: false
      });    
    });
  };
  this.getPlaceholderData = (req, res) => {
    res.json({
      city: 'New York',
      currentTemp: 70.52,
      currentTime: 1539082903,
      description: "clear sky",
      humidity: 92,
      icon: 'http://openweathermap.org/img/w/01d.png',
      maxTemp: 71.96,
      minTemp: 69.08,
      sunrise: 1539082903,
      sunset: 1539123806,
      windDirection: 212.501,
      windSpeed: 6.2,
      isMetric: false
    });
  };
}

module.exports = ServerFunctions;