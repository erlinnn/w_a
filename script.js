const API_KEY = 'fa9e78cadd76a9a61cfc87dbca1a5826'; // OpenWeatherMap key 

let globe;
let currentView = { lat: 0, lng: 0, altitude: 2.5 };
let timeoutId;

// Initialize globe
function initGlobe() {
    globe = new Globe(document.getElementById('globeViz'), {
        globeImageUrl: '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg'
    });

    globe.pointOfView(currentView, 0);

    const controls = globe.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.2;

    window.addEventListener('resize', () => globe.resize());
}

// Debounce function
function debounce(func, delay) {
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Handle location input
const input = document.getElementById('locationInput');
const debouncedSearch = debounce(handleSearch, 500);

input.addEventListener('input', (e) => {
    const value = e.target.value.trim();
    if (value.length < 3) {
        if (value === '') handleClear();
        return;
    }
    debouncedSearch(value);
});

function handleSearch(city) {
    // Geocoding via OpenWeatherMap
    fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`)
        .then(res => {
            if (!res.ok) throw new Error(`Geocoding error: ${res.status}`);
            return res.json();
        })
        .then(data => {
            if (data.length > 0) {
                const loc = data[0];
                globe.controls().autoRotate = false;
                const newView = { lat: loc.lat, lng: loc.lon, altitude: 0.1 };
                globe.pointOfView(newView, 2500); // 2.5s zoom
                currentView = newView;
                document.getElementById('cityName').textContent = `${loc.name}${loc.country ? ', ' + loc.country : ''}`;
                document.getElementById('errorMsg').style.display = 'none';
                fetchWeather(loc.lat, loc.lon);
            } else {
                showError('City not found. Try another!');
            }
        })
        .catch(err => {
            console.error(err);
            showError('Search failed—check connection or API key.');
        });
}

function fetchWeather(lat, lng) {
    // OpenWeatherMap Current Weather API
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric`;
    fetch(url)
        .then(res => {
            if (!res.ok) throw new Error(`Weather error: ${res.status}`);
            return res.json();
        })
        .then(data => {
            document.getElementById('temp').textContent = Math.round(data.main.temp);
            document.getElementById('feelsLike').textContent = Math.round(data.main.feels_like);
            document.getElementById('humidity').textContent = data.main.humidity;
            document.getElementById('precip').textContent = data.rain?.['1h'] || data.snow?.['1h'] || 0;

            const desc = data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1);
            const icon = data.weather[0].icon;
            document.getElementById('weatherDesc').innerHTML = `${desc} <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}" style="width:20px; vertical-align:middle;">`;

            const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            document.getElementById('sunrise').textContent = sunrise;
            document.getElementById('sunset').textContent = sunset;

            document.getElementById('wind').textContent = Math.round(data.wind.speed * 3.6); // m/s to km/h

            document.getElementById('weatherInfo').style.display = 'block';
        })
        .catch(err => {
            console.error(err);
            showError('Weather fetch failed—check API key or try later.');
        });
}

function handleClear() {
    globe.controls().autoRotate = true;
    globe.pointOfView({ lat: 0, lng: 0, altitude: 2.5 }, 2500);
    currentView = { lat: 0, lng: 0, altitude: 2.5 };
    document.getElementById('weatherInfo').style.display = 'none';
    document.getElementById('errorMsg').style.display = 'none';
}

function showError(msg = 'Something went wrong—try again!') {
    document.getElementById('errorMsg').textContent = msg;
    document.getElementById('errorMsg').style.display = 'block';
    document.getElementById('weatherInfo').style.display = 'block';
}

input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        clearTimeout(timeoutId);
        handleSearch(e.target.value.trim());
    }
});

// Init
initGlobe();
