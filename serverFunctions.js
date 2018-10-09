const request = require('request');

function ServerFunctions() {
  this.getWeatherToday = (req, res) => {
    let appID = process.env.APP_ID;
    let openWeatherURL = `https://api.openweathermap.org/data/2.5/weather?lat=${req.query.lat}&lon=${req.query.lon}&unit=metric&APPID=${appID}`;

    request(openWeatherURL, (err, response, body) => {
      if (err) {
        //TODO: Error management
        res.json({err: err});
      }

      let data = JSON.parse(body);

      res.json({
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
        windSpeed: data.wind.speed
      });    
    });
  }
};

module.exports = ServerFunctions