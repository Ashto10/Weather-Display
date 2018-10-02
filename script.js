(function() {
  'use strict';

  // Array used to display the current date
  let weekday = ["Sunday",
                 "Monday",
                 "Tuesday",
                 "Wednesday",
                 "Thursday",
                 "Friday",
                 "Saturday"];

  function clamp(num, min, max) {
    return Math.max(Math.min(num, max), min);
  }

  function numToPerc(num, max, min = 0) {
    return ((num - min) * 100) / (max - min);
  }

  function percToNum(num, min, max){
    return min + (num / 100) * (max-min);
  }

  function getLocationGPS() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        getWeather(pos.coords.latitude, pos.coords.longitude);
      }, getLocationAPI, {timeout: 5000});
    } else {
      getLocationAPI();
    }
  }

  function getLocationAPI() {
    fetch("http://ip-api.com/json").then(data => {
      return data.json();
    }).then(data => {
      getWeather(data.lat, data.lon);
    }).catch(err => {
      //TODO: Error management
    })
  }

  function getWeather(lat, lon) {
    if (lat === null) {
      //TODO: Error management
    }
    let appID = "&APPID=f309b05a1b54b9419370a8a2a1ca9f36";
    let openWeatherURL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&unit=metric${appID}`;

    fetch(openWeatherURL).then(data => {
      return data.json();
    }).then(displayInformation).catch(err => {
      //TODO: Error management
    })
  }

  function displayInformation(data) {
    let currentTime = data.dt,
        sunrise = data.sys.sunrise,
        sunset = data.sys.sunset,
        description = data.weather[0].description,
        icon = `http://openweathermap.org/img/w/${data.weather[0].icon}.png`,
        humidity = data.main.humidity,
        windDirection = data.wind.deg,
        currentTemp = data.main.temp,
        minTemp = data.main.temp_min,
        maxTemp = data.main.temp_max,
        windSpeed = data.wind.speed;

    UpdateScene(currentTime, sunrise, sunset);
  }

  function UpdateScene(currentTime, sunrise, sunset) {
    let percOfDay = numToPerc(currentTime, sunset, sunrise);
    if (currentTime < sunrise) {
      percOfDay += 100;
    }
    let angle = percToNum(percOfDay, 180,360);

    let sky = document.getElementById('sky');

    let skyHalfWidth = sky.offsetWidth / 2;
    let skyHeight = sky.offsetHeight;
    let xPos = skyHalfWidth * Math.cos(angle * Math.PI / 180) + skyHalfWidth;
    let yPos = (skyHeight * 0.8) * Math.sin(angle * Math.PI / 180) + (skyHeight);
    sky.style.backgroundImage = `radial-gradient(circle farthest-corner at ${xPos}px ${yPos}px, ${getSunColor(percOfDay)})`;

    document.getElementById('ground').style.backgroundColor = getGroundColor(percOfDay);
  }

  function mixColor(startColor, endColor, currentAngle, startAngle, endAngle) {
    let perc = clamp(numToPerc(currentAngle, endAngle, startAngle),0,100);
    return percToNum(perc, startColor, endColor);
  }

  function getGroundColor(angle) {
    angle = Math.abs(angle - 50);

    let hue = mixColor(130, 100, angle, 40, 55);
    let sat = mixColor(60, 35, angle, 40, 55);
    let val = mixColor(51, 20, angle, 38, 55);

    return `hsl(${hue}, ${sat}%, ${val}%)`
  }

  function getSunColor(angle) {
    angle = Math.abs(angle - 50);

    let sunColor, skyStart = '40px';  
    let skyHue = mixColor(184, 223, angle, 40, 55);
    let skySat = mixColor(90, 20, angle, 40, 55);
    let skyVal = mixColor(73, 30, angle, 38,55);

    let skyColor = `hsl(${skyHue},${skySat}%,${skyVal}%)`;

    if (angle > 80) {
      sunColor = skyColor;
    } else if (angle > 50) {
      sunColor = `white, yellow 10px, orange 7%, red 13%`;
      skyStart = '25%';
    } else if (angle > 40) {
      sunColor = `white, yellow 25px, orange 7%`;
      skyStart = '15%';
    } else {
      sunColor = 'white, yellow 25px';
    }

    return `${sunColor}, ${skyColor} ${skyStart}`;
  }

  // Fetch weather data when page fully loads
  window.addEventListener('DOMContentLoaded', () => {
    getLocationGPS();
  });
})();