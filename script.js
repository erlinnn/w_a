document.addEventListener('DOMContentLoaded', () => {
  const globeContainer = document.getElementById('globeViz');

  // ----------------------------
  // Initialize Globe
  // ----------------------------
  const myGlobe = Globe()(globeContainer)
    .globeImageUrl('https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/earthmap1k.jpg')
    .globeCloudsUrl('https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/earthcloudmaptrans.jpg')
    .backgroundColor('#111')
    .showAtmosphere(true)
    .atmosphereColor('lightskyblue')
    .atmosphereAltitude(0.25)
    .pointsData([{ lat: 0, lng: 0 }])
    .pointAltitude(0.05)
    .pointColor(() => 'yellow')
    .pointRadius(0.5)
    .pointsTransitionDuration(1000);

  // ----------------------------
  // Auto-rotation + cloud rotation
  // ----------------------------
  let rotation = 0;
  function rotateGlobe() {
    rotation += 0.0005;
    myGlobe.pointOfView({ lat: 0, lng: rotation * 180 / Math.PI, altitude: 2 });
    requestAnimationFrame(rotateGlobe);
  }
  rotateGlobe();

  // ----------------------------
  // Pulse marker
  // ----------------------------
  let pulse = 0;
  function pulseMarker() {
    pulse += 0.05;
    myGlobe.pointAltitude(p => 0.05 + Math.sin(pulse) * 0.01);
    requestAnimationFrame(pulseMarker);
  }
  pulseMarker();

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
      const easeT = t * (2 - t); // easeOutQuad

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
  // Search & fetch weather
  // ----------------------------
  function searchCity() {
    const city = cityInput.value.trim();
    if (!city) return alert("Enter a city");

    fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${OPENWEATHER_API_KEY}`)
      .then(res => res.json())
      .then(data => {
        if (!data || data.length === 0) return alert("City not found");

        const { lat, lon, name } = data[0];
        flyTo(lat, lon);

        // Marker color based on temperature (default yellow)
        myGlobe.pointsData([{ lat, lng: lon }]).pointColor(() => 'yellow').pointRadius(0.5);

        // Fetch weather
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`)
          .then(res => res.json())
          .then(weather => {
            const temp = weather.main.temp;
            const sunrise = new Date(weather.sys.sunrise * 1000).toLocaleTimeString();
            const sunset  = new Date(weather.sys.sunset * 1000).toLocaleTimeString();

            // Dynamic marker color
            let color = temp < 15 ? 'blue' : temp > 25 ? 'red' : 'yellow';
            myGlobe.pointsData([{ lat, lng: lon }]).pointColor(() => color).pointRadius(0.6);

            // Weather card update
            cityNameEl.textContent = name;
            tempEl.textContent = `Temperature: ${temp}°C`;
            humidityEl.textContent = `Humidity: ${weather.main.humidity}%`;
            conditionEl.textContent = `Condition: ${weather.weather[0].description}`;
            extraEl.textContent = `Feels like: ${weather.main.feels_like}°C, Wind: ${weather.wind.speed} m/s, 🌅 ${sunrise}, 🌇 ${sunset}`;

            weatherCard.style.display = 'block';
            weatherCard.style.opacity = 0;
            let opacity = 0;
            const fadeIn = () => {
              opacity += 0.05;
              weatherCard.style.opacity = opacity;
              if (opacity < 1) requestAnimationFrame(fadeIn);
            };
            fadeIn();
          });
      })
      .catch(err => console.error(err));
  }

  searchBtn.addEventListener('click', searchCity);
  cityInput.addEventListener('keypress', e => { if(e.key==='Enter') searchCity(); });

});
