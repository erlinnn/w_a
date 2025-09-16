import { API_KEY } from './config.js';

// Initialize Globe.gl
const globe = Globe()
  .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
  .backgroundColor('#000000')
  .showAtmosphere(true)
  .atmosphereColor('#3a228a')
  .atmosphereAltitude(0.25)
  (document.getElementById('globeViz'));

// Auto-rotate globe
globe.controls().autoRotate = true;
globe.controls().autoRotateSpeed = 1;

// Handle city search
const cityInput = document.getElementById('city-input');
const weatherCard = document.getElementById('weather-card');
cityInput.addEventListener('keypress', async (e) => {
  if (e.key === 'Enter' && cityInput.value) {
    const city = cityInput.value.trim();
    try {
      // Geocode city to lat/long
      const geoResponse = await fetch(
        `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`
      );
      const geoData = await geoResponse.json();
      if (!geoData.length) {
        alert('City not found!');
        return;
      }
      const { lat, lon } = geoData[0];

      // Zoom to city
      globe.pointOfView({
        lat: lat,
        lng: lon,
        altitude: 1.5
      }, 1000);

      // Add glowing city point
      globe.pointsData([{ lat, lng: lon, size: 0.1, color: '#ffcc00' }])
        .pointRadius(0.5)
        .pointsMerge(true)
        .pointAltitude(0.07)
        .pointColor('color');

      // Fetch weather data
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
      );
      const weatherData = await weatherResponse.json();

      // Update weather card
      document.getElementById('city-name').textContent = weatherData.name;
      document.getElementById('temperature').textContent = `Temperature: ${weatherData.main.temp} °C`;
      document.getElementById('humidity').textContent = `Humidity: ${weatherData.main.humidity}%`;
      document.getElementById('condition').textContent = `Condition: ${weatherData.weather[0].description}`;
      document.getElementById('wind-speed').textContent = `Wind Speed: ${weatherData.wind.speed} m/s`;
      document.getElementById('sunrise').textContent = `Sunrise: ${new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString()}`;
      document.getElementById('sunset').textContent = `Sunset: ${new Date(weatherData.sys.sunset * 1000).toLocaleTimeString()}`;

      // Show weather card with fade-in
      weatherCard.classList.add('show');
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error fetching data. Please try again.');
    }
  }
});
