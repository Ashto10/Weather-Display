(function() {
  'use strict';

  /**
  * Object used to store weather data. Useful for maintaining the
  * state of a conversion, and for recalling updateSky() whenever
  * the page is resized or scrolled.
  */
  let weatherData = {};

  /**
  * Helper object that stores commonly used functions.
  */
  const $ = {
    elByID: (el) => {
      return document.getElementById(el);
    },
    query: (search, callback) => {
      let els = Array.from(document.querySelectorAll(search));
      els.forEach(callback);
    }, 
    fetchWTimeout: (src, t, success, failure) => {
      return new Promise((resolve, reject) => {
        let timeout = setTimeout(() => {
          return reject("Error: timeout");
        }, t);
        let didTimeout = false;
        fetch(src)
          .then(data => data.json())
          .then(data => {
          clearInterval(timeout);
          didTimeout = true;
          return resolve(data);
        }).catch(err => {
          if (didTimeout) return;
          reject(err);
        });
      }).then(success).catch(failure);
    }
  };

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

  /**
  * Fills in specified elements with error information.
  * @param {String} message - the error message to display.
  */
  function throwLoadingError(message) {
    $.elByID('loading-icon').style.display = 'none';
    $.elByID('loading-text').innerHTML = 'An error has occured. Please try again. ';
    if (message) {
      $.elByID('loading-error').innerHTML = message;
    }
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
    $.fetchWTimeout("https://cors-anywhere.herokuapp.com/http://ip-api.com/json", 5000, data => {
      getWeather(data.lat, data.lon);
    }, err => {
      throwLoadingError(err);
    });
  }

  /**
  * Get weather information from OpenWeatherMap API
  * @param {Number} - user's latitude.
  * @param {Number} - user's longitude.
  */
  function getWeather(lat, lon) {
    if (lat === null) {
      return throwLoadingError();
    }

    /** Temp location for testing purposes. */
    let localAPI = window.location.href + `current?lat=${lat}&lon=${lon}`;

    $.fetchWTimeout(localAPI, 5000, data => {
      weatherData = data;

      UpdateSky();
      UpdateTime();
      UpdateWeatherDisplay();
      Tick();

      $.query('.weather-info', (el) => {
        el.style.opacity = '1';
      }, err => {
        throwLoadingError(err);
      });

      $.elByID('loading-screen').style.display = 'none';

    });
  }

  /**
  * Helper function used to round and label temperature.
  * @param {Float} temp - temperature in farenheit.
  */
  function getF (temp) {
    return Math.round(temp * 10) / 10 + '&deg;F';
  }

  /**
  * Helper function used to round and label speed.
  * @param {Float} speed - speed in MPH.
  */
  function getMPH (speed) {
    return Math.round(speed * 10) / 10 + ' MPH';
  }

  /**
  * Converts farenheit to celsius, then rounds to tenths place, and labels the result.
  * @param {String/Float} temp - temperature in farenheit.
  */
  function FtoC (temp) {
    temp = (parseFloat(temp) - 32) * (5/9);
    return Math.round(temp * 10) / 10 + '&deg;C';
  }

  /**
  * Converts MPH to KPH, then rounds to tenths place, and labels the result.
  * @param {String/Float} speed - speed in MPH.
  */
  function mphToKph (speed) {
    return Math.round(parseFloat(speed) * 1.609 * 10) / 10 + ' KPH';
  }

  /**
  * Pull data from weatherData object, and plug it into
  */
  function UpdateWeatherDisplay() {    
    $.elByID('city').innerHTML = weatherData.city;
    $.elByID('description').innerHTML = weatherData.description;

    $.elByID('icon').setAttribute('src', weatherData.icon);
    $.elByID('wind-direction').style.transform = `rotateZ(${weatherData.windDirection}deg)`;
    $.elByID('humidity').innerHTML = weatherData.humidity + '%';

    UpdateUnits();

    let eventText, eventTime;
    if (weatherData.currentTime < weatherData.sunrise) {
      eventText = 'rise';
      eventTime = new Date(weatherData.sunrise * 1000).toLocaleTimeString();
    } else {
      eventText = 'set';
      eventTime = new Date(weatherData.sunrise * 1000).toLocaleTimeString();
    }

    $.elByID('sun-event').innerHTML = `Sun will ${eventText} at ${eventTime}`;
  }

  /** Toggle units of measurement used in display. */
  function UpdateUnits() {
    let currentTemp = getF(weatherData.currentTemp),
        minTemp = getF(weatherData.minTemp),
        maxTemp = getF(weatherData.maxTemp),
        windSpeed = getMPH(weatherData.windSpeed);

    if (weatherData.inMetric) {
      currentTemp = FtoC(currentTemp);
      minTemp = FtoC(minTemp);
      maxTemp = FtoC(maxTemp);
      windSpeed = mphToKph(windSpeed);
    }

    $.elByID('currentTemp').innerHTML = currentTemp;
    $.elByID('minTemp').innerHTML = minTemp;
    $.elByID('maxTemp').innerHTML = maxTemp;
    $.elByID('wind-speed').innerHTML = windSpeed;
  }

  /** Update the current time. */
  function UpdateTime() {
    $.elByID('currentTime').innerHTML = new Date().toLocaleString('en-US', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
  }

  /**
  * Calculate the position and coloring of the scenery,
  * based on screen size and current time relevant to sunrise/sunset
  */
  function UpdateSky() {
    let percOfDay = numToPerc(weatherData.currentTime, weatherData.sunset, weatherData.sunrise);
    let angle = percToNum(percOfDay, 180,360);

    let sky = $.elByID('sky');

    let skyHalfWidth = sky.offsetWidth / 2;
    let skyHeight = sky.offsetHeight;
    let xPos = skyHalfWidth * Math.cos(angle * Math.PI / 180) + skyHalfWidth;
    let yPos = (skyHeight * 0.8) * Math.sin(angle * Math.PI / 180) + (skyHeight);
    sky.style.backgroundImage = `radial-gradient(circle farthest-corner at ${xPos}px ${yPos}px, ${getSunColor(percOfDay)})`;

    $.elByID('ground').style.backgroundColor = getGroundColor(percOfDay);

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

    return `hsl(${hue}, ${sat}%, ${val}%)`;
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
    let shadowElements = Array.from($.elByID('shadow').children);

    if (angle < 180 || angle > 360) {
      shadowElements.forEach(el => {
        el.style.display = 'none';
      });

      $.query('.sign-leg', el => {
        el.style.background = 'darkgray';
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

    $.query('.sign-leg', el => {
      el.style.backgroundImage = legGradient;
    });
  }

  /** Calls certain functions every second in order to update the visual display. */
  function Tick() {
    weatherData.currentTime = new Date().getTime() / 1000;
    UpdateTime();
    UpdateSky();

    setTimeout(Tick, 1000);
  }

  // Fetch weather data when page fully loads
  window.addEventListener('DOMContentLoaded', () => {
    getLocationGPS();
  });

  window.addEventListener('resize', () => {
    UpdateSky();
  });

  $.elByID('toggle-units').addEventListener('click', () => {
    weatherData.inMetric = !weatherData.inMetric;
    UpdateUnits();
  });

  $.elByID('sidebar-toggle').addEventListener('click', () => {
    let sidebar = $.elByID('sidebar');
    if (sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
    } else {
      sidebar.classList.add('open');
    }
  });
})();