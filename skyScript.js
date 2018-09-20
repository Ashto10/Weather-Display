let counter = -90;

setInterval(()=> {
  UpdateSky(counter);
  counter+= 1;
  if (counter >= 270) {
    counter = -90;
  }
}, 100);

function UpdateSky(angle) {
  let sky = document.getElementById('sky');
  let skyHalfWidth = sky.offsetWidth / 2;
  let skyHeight = sky.offsetHeight;
  let xPos = skyHalfWidth * Math.cos(angle * Math.PI / 180) + skyHalfWidth;
  let yPos = (skyHeight * 0.8) * Math.sin(angle * Math.PI / 180) + (skyHeight);
  sky.style.backgroundImage = `radial-gradient(circle farthest-corner at ${xPos}px ${yPos}px, ${getSunColor(angle)})`;
}

function getSunColor(angle) {
  angle = Math.abs(angle-90);
  sky.innerHTML = angle;
  sky.style.color = 'white';
  if (angle > 105) {
    return 'white, yellow 15px, #5EA2AF 7%';
  } else {
    return '#FEFAD3 15px, #F3ED70 7%, #5EA2AF 30%';
  }
}