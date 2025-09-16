document.addEventListener('DOMContentLoaded', () => {

  // ----------------------------
  // Globe Initialization
  // ----------------------------
  const globeContainer = document.getElementById('globeViz');

  const myGlobe = Globe()(globeContainer)
    .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-night.jpg')
    .backgroundColor('#111')
    .showAtmosphere(true)
    .atmosphereColor('lightskyblue')
    .atmosphereAltitude(0.25)
    .pointsData([{ lat: 0, lng: 0 }])
    .pointAltitude(0.05)
    .pointColor(() => 'yellow')
    .pointRadius(0.5)
    .pointsTransitionDuration(1000);

  // Make myGlobe globally accessible for other functions
  window.myGlobe = myGlobe;

  // ----------------------------
  // Auto-rotation
  // ----------------------------
  let rotation = 0;
  function rotateGlobe() {
    rotation += 0.001;
    myGlobe.pointOfView({ lat: 0, lng: rotation * 180 / Math.PI, altitude: 2 });
    requestAnimationFrame(rotateGlobe);
  }
  rotateGlobe();

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
  // Smooth camera fly
  // ----------------------------
  function flyTo(lat, lon, duration = 2000) {
    const start = myGlobe.pointOfView();
    const startTime = performance.now();

    function animate() {
      const now = performance.now();
      const t = Math.min((now - startTime) / duration, 1);
      const easeT = t * (2 - t);

      myGlobe.pointOfView({
        lat: start.lat + (lat - start.lat) * easeT,
        lng: start.lng + (lon - start.lng) * easeT,
        altitude: start.altitude + (2 - start.altitude) * easeT
      });

      if (t < 1) requestAnimationFrame(animate);
    }
    animate();
  }

  // ----------------------------
  // Marker pulse (no PNG needed)
  // ----------------------------
  let pulse = 0;
  function pulseMarker() {
    pulse += 0.05;
    myGlobe.pointAltitude(p => 0.05 + Math.sin(pulse) * 0.01);
    requestAnimationFrame(pulseMarker);
  }
  pulseMarker();

  // ----------------------------
  // Search & Geocoding
  // ----------------------------
  searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (!city) return alert("Please enter a city");

    fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${OPENWEATHER_API_KEY}`)
      .then(res => res.json())
      .then(data => {
        if (!data || data.length === 0) return alert("City not found");

        const { lat, lon, name } = data[0];

        // Move globe and set marker
        flyTo(lat, lon);
        myGlobe.pointsData([{ lat, lng: lon }])
               .pointColor(() => 'yellow')
               .pointRadius(0.5);

        // Fetch weather
        getWeather(lat, lon, name);
      })
      .catch(err => console.error(err));
  });

  // ----------------------------
  // Fetch weather & update card
  // ----------------------------
  function getWeather(lat, lon, name) {
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`)
      .then(res => res.json())
      .then(data => {
        const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString();
        const sunset  = new Date(data.sys.sunset * 1000).toLocaleTimeString();

        cityNameEl.textContent = name;
        tempEl.textContent = `Temperature: ${data.main.temp}°C`;
        humidityEl.textContent = `Humidity: ${data.main.humidity}%`;
        conditionEl.textContent = `Condition: ${data.weather[0].description}`;
        extraEl.textContent = `Feels like: ${data.main.feels_like}°C, Wind: ${data.wind.speed} m/s, 🌅 ${sunrise}, 🌇 ${sunset}`;

        weatherCard.style.display = 'block';
      })
      .catch(err => console.error(err));
  }

});
