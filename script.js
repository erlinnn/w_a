import Globe from './globe.gl.min.js';

const globeContainer = document.getElementById('globeViz');

// ----------------------------
// Initialize Globe
// ----------------------------
const myGlobe = Globe()(globeContainer)
  .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
  .atmosphereColor('lightskyblue')
  .atmosphereAltitude(0.25)
  .pointsData([{ lat: 0, lng: 0, size: 0.1, color: 'yellow' }])
  .pointAltitude('size')
  .pointColor('color');

// Auto-rotate the globe
myGlobe.controls().autoRotate = true;
myGlobe.controls().autoRotateSpeed = 0.3;

// ----------------------------
// DOM Elements
// ----------------------------
const searchBtn = document.getElementById('searchBtn');
const cityInput = document.getElementById('cityInput');
const weatherCard = document.getElementById('weatherCard');
const cityNameEl = document.getElementById('cityName');
const tempEl = document.getElementById('temperature');
const humidityEl = document.getElementById('humidity');
const conditionEl = document.getElementById('condition');
const extraEl = document.getElementById('extra');

// ----------------------------
// Search & fetch weather
// ----------------------------
function searchCity() {
  const city = cityInput.value.trim();
  if (!city) return alert("Please enter a city name.");

  // Fetch coordinates for the city
  fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${OPENWEATHER_API_KEY}`)
    .then(res => res.json())
    .then(data => {
      if (!data || data.length === 0) {
        return alert("City not found. Please try again.");
      }

      const { lat, lon, name } = data[0];

      // Fly to location
      myGlobe.pointOfView({ lat, lng: lon, altitude: 0.5 }, 2000);

      // Fetch weather data
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`)
        .then(res => res.json())
        .then(weather => {
          const temp = weather.main.temp;
          const sunrise = new Date(weather.sys.sunrise * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          const sunset = new Date(weather.sys.sunset * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

          // Determine marker color based on temperature
          let color = temp < 10 ? 'cyan' : temp > 25 ? 'red' : 'yellow';

          // Update marker on the globe
          myGlobe.pointsData([{ lat, lng: lon, size: 0.1, color: color }]);

          // Update and show weather card
          cityNameEl.textContent = name;
          tempEl.innerHTML = `🌡️ Temperature: ${temp.toFixed(1)}°C`;
          humidityEl.innerHTML = `💧 Humidity: ${weather.main.humidity}%`;
          conditionEl.textContent = `Condition: ${weather.weather[0].description}`;
          extraEl.innerHTML = `Feels like: ${weather.main.feels_like.toFixed(1)}°C, Wind: ${weather.wind.speed} m/s | 🌅 ${sunrise} | 🌇 ${sunset}`;

          weatherCard.style.display = 'block';
        });
    })
    .catch(err => {
      console.error("Error:", err);
      alert("An error occurred while fetching data.");
    });
}

searchBtn.addEventListener('click', searchCity);
cityInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') {
    searchCity();
  }
});
