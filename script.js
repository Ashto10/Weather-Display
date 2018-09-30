var weatherData;                // Stores the weather object recieved from the API
var inMetric = false;           // Used to toggle what measurements to use
var loadSpin = 0;               // Counter used to rotate the loading screen
var weekday = ["Sunday",
               "Monday",
               "Tuesday",
               "Wednesday",
               "Thursday",
               "Friday",
               "Saturday"];     // Array used to display the current date

function clamp(num, min, max) {
  return Math.max(Math.min(num, max), min);
}

function numToPerc(num, max, min = 0) {
  return ((num - min) * 100) / (max - min);
}

function percToNum(num, min, max){
  return min + (num / 100) * (max-min);
}


/// <summary> Get the user's location, and get weather if found. </summary>
function GetWeather() {
  if(navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var lat = position.coords.latitude;
      var long = position.coords.longitude;

      FetchWeatherObject(lat,long);
    }, function() {
      $.getJSON("http://ip-api.com/json", function(data) {
        FetchWeatherObject(data.lat,data.long);
      });
    });
  }
}

/// <summary> Pull weather data from API, then call UpdateDisplay function. </summary>
///<param name="lat" type="Number [float]"> The latitude to search for. </param>
///<param name="long" type="Number [float]"> The longitude to search for. </param>
function FetchWeatherObject(lat,long) {
  var appID = "&APPID=f309b05a1b54b9419370a8a2a1ca9f36";
  var unit = "&units=metric";
  var urlAPI = "https://cors-anywhere.herokuapp.com/api.openweathermap.org/data/2.5/weather?lat="+lat+"&lon="+long+unit+appID;

  $.ajax({
    dataType:"json",
    cache: false,
    url: urlAPI,
    success: function(_weatherData) {
      weatherData = _weatherData;
      UpdateDisplay();
    }, timeout: 3000
  });
}

///<summary> Pull relevant info from weather data, and update display data. </summary>
function UpdateDisplay() {
  var sunrise = weatherData.sys.sunrise;
  var sunset = weatherData.sys.sunset;
  var currentTime = weatherData.dt;

  UpdateScene(sunrise, sunset, currentTime);
  UpdateUnits();

  $("#location").html(weatherData.name);

  var updateTime = new Date(currentTime * 1000);
  $("#last-update").html(weekday[updateTime.getDay()] + ", " + updateTime.toLocaleTimeString());
  $("#description").html(weatherData.weather[0].description);

  var weatherIcon = "http://openweathermap.org/img/w/" + weatherData.weather[0].icon + ".png";
  $("#icon").attr("src",weatherIcon);

  $("#humidity").html(weatherData.main.humidity);

  $("#wind-direction").css({"transform":"rotate("+weatherData.wind.deg+"deg)"});

  var riseOrSet, riseOrSetTime;
  if (currentTime < sunrise) {
    riseOrSet = "rise";
    riseOrSetTime = new Date(sunrise).toLocaleTimeString();
  } else {
    riseOrSet = "set";
    riseOrSetTime = new Date(sunset).toLocaleTimeString();
  }

  $("#sun-time").html("The sun will "+ riseOrSet +" at " + riseOrSetTime);
}

/// <summary> Pull measurement info from weather data, convert if necessary, and update display area. </summary>
function UpdateUnits() {
  var current_temperature, min_temperature, max_temperature, wind_Speed;

  if(inMetric) {
    current_temperature = Math.round(weatherData.main.temp) + "&deg;C";
    min_temperature = Math.round(weatherData.main.temp_min) + "&deg;C";
    max_temperature = Math.round(weatherData.main.temp_max) + "&deg;C";
    wind_Speed = weatherData.wind.speed.toFixed(2) + " m/s";
  } else {
    current_temperature = Math.round((weatherData.main.temp * 1.8) + 32) + "&deg;F";
    min_temperature = Math.round((weatherData.main.temp_min * 1.8) + 32) + "&deg;F";
    max_temperature = Math.round((weatherData.main.temp_max * 1.8) + 32) + "&deg;F";
    wind_Speed = Math.round((weatherData.wind.speed * 2.2369)*100) / 100 + " mph";
  }

  $("#current-temperature").html(current_temperature);
  $("#min-temperature").html(min_temperature);
  $("#max-temperature").html(max_temperature);
  $("#wind-speed").html(wind_Speed);
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

function getGroundColor(angle) {
  angle = Math.abs(angle - 50);

  let hue = mixColor(130, 100, angle, 40, 55);
  let sat = mixColor(60, 35, angle, 40, 55);
  let val = mixColor(51, 20, angle, 38, 55);

  return `hsl(${hue}, ${sat}%, ${val}%)`
}

function mixColor(startColor, endColor, currentAngle, startAngle, endAngle) {
  let perc = clamp(numToPerc(currentAngle, endAngle, startAngle),0,100);
  return percToNum(perc, startColor, endColor);
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

// On click: Toggle measurement of unit used, then update display
$("#toggle-units").click(function(){
  inMetric = !inMetric;
  UpdateUnits();
});

// Fetch weather data when page fully loads
$(document).ready(function(){
  GetWeather();
});