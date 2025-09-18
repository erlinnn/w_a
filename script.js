const API_KEY = 'fa9e78cadd76a9a61cfc87dbca1a5826';
const GLOBE_IMAGE_URL = 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
const WEATHER_ICON_BASE = 'https://openweathermap.org/img/wn/';

// DOM Elements
const container = document.getElementById('globeViz');
const input = document.getElementById('locationInput');
const overlay = document.getElementById('weatherOverlay');
const cityNameEl = document.getElementById('cityName');
const detailsEl = document.getElementById('weatherDetails');
const iconEl = document.getElementById('weatherIcon');

// Initialize globe
const globe = new Globe(container)
    .globeImageUrl(GLOBE_IMAGE_URL)
    .showGraticules(true)
    .backgroundColor('#000011')
    .pointOfView({ lat: 0, lng: 0, altitude: 2.5 }, 0);

// Enable slow auto-rotation
const controls = globe.controls();
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;
controls.enableZoom = false;

let currentLat = 0, currentLng = 0;
let autoRotateEnabled = true;

// Debounce function
function debounce(fn, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
    };
}

// Geocode city to coordinates with retry
async function geocodeCity(city, retries = 2) {
    for (let i = 0; i <= retries; i++) {
        try {
            const res = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            const data = await res.json();
            if (!data[0]) throw new Error('City not found');
            return { lat: data[0].lat, lon: data[0].lon, name: data[0].name };
        } catch (err) {
            console.error(`Geocode attempt ${i + 1}/${retries + 1} failed: ${err.message}`);
            if (i === retries) throw new Error('Unable to find city. Please check the name or try again later.');
        }
    }
}

// Fetch weather data with retry
async function fetchWeather(lat, lon, retries = 2) {
    for (let i = 0; i <= retries; i++) {
        try {
            const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            return await res.json();
        } catch (err) {
            console.error(`Weather fetch attempt ${i + 1}/${retries + 1} failed: ${err.message}`);
            if (i === retries) throw new Error('Unable to fetch weather. Please try again later.');
        }
    }
}

// Format Unix timestamp to local time
function formatTime(unix) {
    return new Date(unix * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Display weather data
function showWeather(data, city) {
    cityNameEl.textContent = `${city}${data.sys.country ? `, ${data.sys.country}` : ''}`;
    detailsEl.innerHTML = `
        <div><strong>${Math.round(data.main.temp)}°C</strong> (feels like ${Math.round(data.main.feels_like)}°C)</div>
        <div>${data.weather[0].description}</div>
        <div>Humidity: ${data.main.humidity}%</div>
        <div>Wind: ${data.wind.speed} m/s</div>
        <div>Sunrise: ${formatTime(data.sys.sunrise)}</div>
        <div>Sunset: ${formatTime(data.sys.sunset)}</div>
    `;
    iconEl.src = `${WEATHER_ICON_BASE}${data.weather[0].icon}@2x.png`;
    overlay.classList.remove('loading', 'hidden');
    input.value = city;
}

// Show loading state
function showLoading() {
    overlay.classList.add('loading', 'hidden');
    cityNameEl.textContent = '';
    detailsEl.innerHTML = '';
    iconEl.src = '';
}

// Zoom to city
function zoomToLocation(lat, lng, city) {
    controls.autoRotate = false;
    autoRotateEnabled = false;

    // Add city label
    globe
        .labelsData([{ lat, lng, text: city, color: 'white', altitude: 0.01 }])
        .labelLat(d => d.lat)
        .labelLng(d => d.lng)
        .labelText(d => d.text)
        .labelColor(d => d.color)
        .labelAltitude(0.01)
        .labelSize(0.5);

    // Animate zoom
    showLoading();
    globe.pointOfView({ lat, lng, altitude: 0.3 }, 2000);

    // Fetch weather after zoom
    setTimeout(async () => {
        try {
            const weather = await fetchWeather(lat, lng);
            showWeather(weather, city);
        } catch (err) {
            console.error('Weather error:', err);
            alert(err.message);
            zoomOut();
            input.value = '';
        }
    }, 2000);
}

// Zoom out to global view
function zoomOut() {
    globe.labelsData([]);
    controls.autoRotate = true;
    autoRotateEnabled = true;
    overlay.classList.add('hidden');
    globe.pointOfView({ lat: 0, lng: 0, altitude: 2.5 }, 2000);
}

// Handle input with debounce
const handleInput = debounce(async (e) => {
    const city = e.target.value.trim();
    if (city === '') {
        if (!autoRotateEnabled) zoomOut();
        input.value = '';
        return;
    }

    try {
        const geo = await geocodeCity(city);
        currentLat = geo.lat;
        currentLng = geo.lon;
        zoomToLocation(geo.lat, geo.lon, geo.name);
    } catch (err) {
        console.error('Input error:', err);
        alert(err.message);
        input.value = '';
        zoomOut();
    }
}, 500);

input.addEventListener('input', handleInput);

// Initial state
globe.pointOfView({ lat: 0, lng: 0, altitude: 2.5 }, 0);
