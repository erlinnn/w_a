// Initialize Globe.gl
const globe = Globe()
  .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
  .backgroundColor('#000000')
  .pointOfView({ lat: 0, lng: 0, altitude: 2.5 }, 0)
  .pointRadius(0.5)
  .pointAltitude(0.1)
  .pointColor(() => '#ff0000')
  .pointLabel('label')
  (document.getElementById('globe-container'));

// Auto-rotate globe
globe.controls().autoRotate = true;
globe.controls().autoRotateSpeed = 0.5;

// Search input and weather card elements
const cityInput = document.getElementById('city-input');
const weatherCard = document.getElementById('weather-card');
const cityNameEl = document.getElementById('city-name');
const conditionEl = document.getElementById('weather-condition');
const tempEl = document.getElementById('temperature');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('wind-speed');
const sunriseEl = document.getElementById('sunrise');
const sunsetEl = document.getElementById('sunset');

// Handle city search
cityInput.addEventListener('keypress', async (e) => {
  if (e.key === 'Enter' && cityInput.value.trim()) {
    const city = cityInput.value.trim();
    try {
      // Get coordinates from OpenWeather Geocoding API
      const geoResponse = await fetch(
        `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${config.OPENWEATHER_API_KEY}`
      );
      const geoData = await geoResponse.json();
      if (!geoData.length) {
        alert('City not found!');
        return;
      }

      const { lat, lon, name } = geoData[0];

      // Zoom to city
      globe.pointOfView({ lat, lng: lon, altitude: 1.5 }, 1000);

      // Add glowing city marker
      globe.pointsData([{ lat, lng: lon, label: name }]);

      // Get weather data
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${config.OPENWEATHER_API_KEY}`
      );
      const weatherData = await weatherResponse.json();

      // Update weather card
      cityNameEl.textContent = name;
      conditionEl.textContent = `Condition: ${weatherData.weather[0].description}`;
      tempEl.textContent = `Temperature: ${weatherData.main.temp}°C (Feels like: ${weatherData.main.feels_like}°C)`;
      humidityEl.textContent = `Humidity: ${weatherData.main.humidity}%`;
      windSpeedEl.textContent = `Wind Speed: ${weatherData.wind.speed} m/s`;
      sunriseEl.textContent = `Sunrise: ${new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString()}`;
      sunsetEl.textContent = `Sunset: ${new Date(weatherData.sys.sunset * 1000).toLocaleTimeString()}`;

      // Show weather card with fade-in
      weatherCard.style.display = 'block';
      weatherCard.style.opacity = '0';
      setTimeout(() => { weatherCard.style.opacity = '1'; }, 10);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch weather data. Check your API key or try again.');
    }
  }
});
