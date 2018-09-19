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

//TODO
var TESTRISE = 0;
var TESTCUR = 0;
var TESTSET = 0;
//ENDTODO

/// <summary> Either dismiss the loading screen, or warn user of an issue. </summary>
/// <param name="error" type="bool"> State if an error was thrown. </param>
/// <param name="errorMessage" type="bool"> What text to show, if there was an error. </param>
function HandleLoadingScreen($error, $errorMessage) {
    if($error) {
        $("#loading-icon").hide();
        $("#loading-text").html($errorMessage);
        
    } else {
        $(".loading-screen").fadeOut(1000);
    }
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
    } else {
        HandleLoadingScreen(true,"Your browser doesn't seem to be compatible with this application. Please try opening this page with Google Chrome or Mozilla Firefox");
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
        error: function(jqXHR, textStatus) {
            HandleLoadingScreen(true,"Error: "+textStatus+"<br /> Please try again shortly.");
        },
        success: function(_weatherData) {
            weatherData = _weatherData;
            HandleLoadingScreen(false);
            UpdateDisplay();
        }, timeout: 3000
    });
}

///<summary> Pull relevant info from weather data, and update display data. </summary>
function UpdateDisplay() {
    var sunrise = weatherData.sys.sunrise;
    var sunset = weatherData.sys.sunset;
    var currentTime = weatherData.dt;
    
    UpdateSky(sunrise, sunset, currentTime);
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
    
    //TODO
    TESTRISE = sunrise * 1000;
    TESTCUR = sunset * 1000;
    TESTSET = sunset * 1000;
    //ENDTODO
    
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

/// <summary> Change color and positioning of objects depending on time of day. </summary>
function UpdateSky(sunrise, sunset, currentTime) {
    // If current time is less than sunrise, that means the API is providing tomorrow's information.
    // Therefore, increase currentTime by one day.
    if (currentTime < sunrise) {
        currentTime += 8640;
    }

    // Convert the sun's position along the sky into a percentage.
    var sunPositionPercentage = ((currentTime - sunrise) * 100) / (sunset - sunrise);
    
    // Determine the min and max points for the parabola to span on screen.
    var min = -53;
    var max = 53;

    // Convert the sun's position percentage back into a number, relative to the range specified.
    var xPos = min + (sunPositionPercentage/100 * (max-min));
    var yPos = (0.05 * Math.pow(xPos,2)) - 10;
    
    // Move the sun to its position
    $(".sun-center").css({"top":yPos+"%","left":xPos+"%"});
    
    // Move the shadow to its position if it's daylight. Otherwise, hide it entirely.
    if (xPos >= -53 && xPos <= 53) {
        $("#shadow-container").show().css({"left": xPos * -1.5,"transform":"skew("+-xPos+"deg, 0deg)"});
    } else {
        $("#shadow-container").hide();
    }
    
    // Convert xPos to a positive number, in order to determine what color pallete to use.
    xPos = Math.abs(xPos);
    var skyColor, sunColor, groundColor;
    
    if (xPos >= 54) {
        skyColor = "#231D44";
        sunColor = "#231D44";
        groundColor = "#1b3011";
    } else if (xPos >= 53) {
        skyColor = "#2E3554";
        sunColor = "radial-gradient(ellipse, #FEED76 0%, #EF4754 40%, #2E3554 70%)";
        groundColor = "#194418";
    } else if (xPos > 49) {
        skyColor = "#394D67";
        sunColor = "radial-gradient(ellipse, #FFF066 0%, #EE2D3B 31%, #843D48 61%, #394D67 75%)";
        groundColor = "#245123";
    } else if (xPos > 47) {
        skyColor = "#45667C";
        sunColor = "radial-gradient(ellipse, #FFF066 10%, #ED1E2B 37%, #8D3E4B 48%, #45667C 60%)";
        groundColor = "64721E";
    } else if (xPos > 44) {
        skyColor = "#518294";
        sunColor = "radial-gradient(ellipse, #FEF5A3 5%, #FFCF7B 10%, #518294 55%)";
        groundColor = "#5F8224";
    } else if (xPos > 40) {
        skyColor = "#5EA2AF";
        sunColor = "radial-gradient(ellipse, #FEFAD3 3%, #F3ED70 10%, #5EA2AF 30%)";
        groundColor = "#56912E";
    } else {
        skyColor = "#6CCAD1";
        sunColor = "radial-gradient(ellipse, #FFFFFF 0%, #FFE600 8%, #6CCAD1 25%)";
        groundColor = "#61AD45";
    }
    
    $(".sky").css({"background-color":skyColor});
    $(".sun").css({"background":sunColor});
    $("body, .ground-curve").css({"background-color":groundColor});
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

//DEBUGGING
//setInterval(function() {
////    TESTCUR += 900000;
//    if (TESTCUR > TESTSET) {
//        TESTCUR = TESTRISE;
//    }
//    UpdateSky(TESTRISE,TESTSET,TESTCUR);
//    var date = new Date(TESTCUR).toLocaleTimeString();
//    $("#last-update").html(date);
//},2000);

$("#back").mousedown(function(){
    TESTCUR-= 500000;
    UpdateSky(TESTRISE,TESTSET,TESTCUR);
});

$("#forward").mousedown(function(){
    TESTCUR+= 500000;
    UpdateSky(TESTRISE,TESTSET,TESTCUR);
});
// END DEBUGGING