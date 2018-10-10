(function() {
  'use strict';

  /** Object used to store weather data. Useful for maintaining the state of a conversion, and for recalling updateScenery() whenever the page is resized or scrolled */
  let weatherData = {}

  /** Array used to display the current date. */
  let weekday = ["Sunday",
                 "Monday",
                 "Tuesday",
                 "Wednesday",
                 "Thursday",
                 "Friday",
                 "Saturday"];

  /**
  * Clamps a number between two specified points.
  * @param {Number} num - The number to compare
  * @param {Number} min - Lower limit.
  * @param {Number} max - Upper limit.
  * @returns {Number}
  */
  function clamp(num, min, max) {
    return Math.max(Math.min(num, max), min);
  }

  /**
  * Converts a number's position along a range into a percentage.
  * @param {Number} num - The number to compare.
  * @param {Number} max - Upper limit.
  * @param {Number} min - Lower limit, defaults to 0.
  * @returns {Number}
  */
  function numToPerc(num, max, min = 0) {
    return ((num - min) * 100) / (max - min);
  }

  /**
  * Converts a percentage within a range into a number.
  * @param {Number} num - The number to compare.
  * @param {Number} min - Lower limit.
  * @param {Number} max - Upper limit.
  * @returns {Number}
  */
  function percToNum(num, min, max){
    return min + (num / 100) * (max-min);
  }

  /** Get GPS information from browser, then fetch weather info. */
  function getLocationGPS() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        getWeather(pos.coords.latitude, pos.coords.longitude);
      }, getLocationAPI, {timeout: 5000});
    } else {
      getLocationAPI();
    }
  }

  /** If browser GPS unavailable, get from API, then fetch weather info. */
  function getLocationAPI() {
    fetch("http://ip-api.com/json").then(data => {
      return data.json();
    }).then(data => {
      getWeather(data.lat, data.lon);
    }).catch(err => {
      //TODO: Error management
    })
  }

  /**
  * Get weather information from OpenWeatherMap API
  * @param {Number} - user's latitude.
  * @param {Number} - user's longitude.
  */
  function getWeather(lat, lon) {
    if (lat === null) {
      //TODO: Error management
    }

    let localAPI = window.location.href + `/current?lat=${lat}&lon=${lon}`;
    fetch(localAPI).then(data => data.json()).then(data => {
      weatherData = {...data};
      UpdateScene();
    }).catch(err => {
      //TODO: Error management
    })
  }

  /**
  * Calculate the position and coloring of the scenery, based on screen size and current time relevant to sunrise/sunset
  */
  function UpdateScene() {
    let percOfDay = numToPerc(weatherData.currentTime, weatherData.sunset, weatherData.sunrise);
    let angle = percToNum(percOfDay, 180,360);

    let sky = document.getElementById('sky');

    let skyHalfWidth = sky.offsetWidth / 2;
    let skyHeight = sky.offsetHeight;
    let xPos = skyHalfWidth * Math.cos(angle * Math.PI / 180) + skyHalfWidth;
    let yPos = (skyHeight * 0.8) * Math.sin(angle * Math.PI / 180) + (skyHeight);
    sky.style.backgroundImage = `radial-gradient(circle farthest-corner at ${xPos}px ${yPos}px, ${getSunColor(percOfDay)})`;

    document.getElementById('ground').style.backgroundColor = getGroundColor(percOfDay);

    drawShadow(angle);
  }

  /**
  * Helper function used to transition from one value to another, based on the position of a number within a range.
  * @param {Integer} start - the starting value.
  * @param {Integer} end - the desired value to end on.
  * @param {Integer} angle - current angle.
  * @param {Integer} startAngle - the angle at which output would equal start.
  * @param {Integer} endAngle - the angle at which output would equal end.
  */
  function mixColor(start, end, angle, startAngle, endAngle) {
    let perc = clamp(numToPerc(angle, endAngle, startAngle),0,100);
    return percToNum(perc, start, end);
  }

  /**
  * Helper function used to determine what color the ground should be depending on the hour of day.
  * @param {Number} angle - The position of the sun in the sky, where 0 is midnight, and 100 is noon.
  */
  function getGroundColor(angle) {
    angle = Math.abs(angle - 50);

    let hue = mixColor(130, 100, angle, 40, 55);
    let sat = mixColor(60, 35, angle, 40, 55);
    let val = mixColor(51, 20, angle, 38, 55);

    return `hsl(${hue}, ${sat}%, ${val}%)`
  }

  /**
  * Helper function used to determine what color the sun should be depending on the hour of day.
  * @param {Number} angle - The position of the sun in the sky, where 0 is midnight, and 100 is noon.
  */
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

  /**
  * Update position and coloring of elements inside #shadow div
  * @param {Number} angle - The position of the sun in the sky, where 0 is midnight, and 100 is noon.
  */
  function drawShadow(angle) {
    let shadowElements = Array.from(document.getElementById('shadow').children);
    let signLegs = Array.from(document.querySelectorAll('.sign-leg'));

    if (angle < 180 || angle > 360) {
      shadowElements.forEach(el => {
        el.style.display = 'none';
      });
      signLegs.forEach(el => {
        el.style.background = 'gray';
      });
      return;
    }

    angle = (angle - 270) * -1;

    shadowElements.forEach(el => {
      el.style.display = 'block';
      el.style.transform = `skewX(${angle}deg)`;
    });

    let legGradient;

    if (angle >= 0) {
      legGradient = `linear-gradient(90deg, darkgray, gray ${Math.abs(angle)}%)`;
    } else {
      legGradient = `linear-gradient(90deg, gray ${90 - Math.abs(angle)}%, darkgray)`;
    }

    signLegs.forEach(leg => {
      leg.style.backgroundImage = legGradient;
    });
  }

  // Fetch weather data when page fully loads
  window.addEventListener('DOMContentLoaded', () => {
    getLocationGPS();
  });

  window.addEventListener('resize', () => {
    UpdateScene();
  });
})();