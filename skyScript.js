(function() {
  'use strict';

  let counter = -50;

  setInterval(()=> {
    UpdateScene(counter);
    counter+= 1;
    if (counter >= 270) {
      counter = -90;
    }
  }, 100);

  function clamp(num, min, max) {
    return Math.max(Math.min(num, max), min);
  }

  function numToPerc(num, max, min = 0) {
    return ((num - min) * 100) / (max - min);
  }

  function UpdateScene(angle) {
    let sky = document.getElementById('sky');
    let skyHalfWidth = sky.offsetWidth / 2;
    let skyHeight = sky.offsetHeight;
    let xPos = skyHalfWidth * Math.cos(angle * Math.PI / 180) + skyHalfWidth;
    let yPos = (skyHeight * 0.8) * Math.sin(angle * Math.PI / 180) + (skyHeight);
    sky.style.backgroundImage = `radial-gradient(circle farthest-corner at ${xPos}px ${yPos}px, ${getSunColor(angle)})`;

    document.getElementById('ground').style.backgroundColor = getGroundColor(angle);
  }

  function getGroundColor(angle) {
    angle = Math.abs(angle-90);

    let hue = 130 - (clamp(numToPerc(angle, 130, 70), 0, 100) / 4);
    let sat = clamp(numToPerc(angle, 130, 70), 35, 60); 
    let val = clamp(numToPerc(angle, 130, 60), 20, 51); 

    return `hsl(${hue}, ${sat}%, ${val}%)`
  }


  function getSunColor(angle) {
    angle = Math.abs(angle-90);

    let sunColor, skyStart;  
    let skyHue = 238 - (clamp(numToPerc(angle, 115, 30), 0, 100) / 2);
    let skySat = clamp(numToPerc(angle, 180), 20, 50); 
    let skyVal = clamp(numToPerc(angle, 150, 25), 5, 70);  

    let skyColor = `hsl(${skyHue},${skySat}%,${skyVal}%)`;

    if (angle < 60) {
      return skyColor;
    } else if (angle < 95) {
      sunColor = `white, yellow 10px, orange 7%, red 13%`;
      skyStart = '25%';
    } else if (angle < 110) {
      sunColor = `white, yellow 25px, orange 7%`;
      skyStart = '15%';
    } else {
      sunColor = 'white, yellow 25px';
      skyStart = '40px';  
    }

    return `${sunColor}, ${skyColor} ${skyStart}`;
  }
}());