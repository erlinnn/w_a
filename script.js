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

// Enable slow auto-rotation using globe.gl's controls
let controls;
try {
    controls = globe.controls();
    if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
        controls.enableZoom = false;
    } else {
        console.error('Controls not available from globe.controls()');
    }
} catch (err) {
    console.error('Controls initialization failed:', err);
}

// Animation loop to ensure rendering
function animate() {
    requestAnimationFrame(animate);
    if (controls && controls.update) controls.update();
    globe.renderer().render(globe.scene(), globe.camera());
}
animate();

// Debug rendering
console.log('Globe initialized:', globe);
if (!container.children.length) {
    console.error('Globe canvas not appended to container');
}

// Debounce function
function debounce(fn, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
    };
}

// Geocode city to coordinates with retry
async
