```javascript
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/postprocessing/SSAOPass.js';
import { ShaderPass } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/postprocessing/ShaderPass.js';
import { VignetteShader } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/shaders/VignetteShader.js';
import TWEEN from 'https://cdn.jsdelivr.net/npm/@tweenjs/tween.js@23.1.3/dist/tween.esm.js';

// Core Weather Engine
const API_KEY = 'fa9e78cadd76a9a61cfc87dbca1a5826';
const searchInput = document.getElementById('search-input');
const weatherCard = document.getElementById('weather-card');
const cityNameEl = document.getElementById('city-name');
const weatherIconEl = document.getElementById('weather-icon');
const temperatureEl = document.getElementById('temperature');
const feelsLikeEl = document.getElementById('feels-like');
const conditionEl = document.getElementById('condition');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const sunriseEl = document.getElementById('sunrise');
const sunsetEl = document.getElementById('sunset');

async function fetchWeather(city) {
    try {
        const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`);
        const geoData = await geoRes.json();
        if (geoData.length === 0) throw new Error('City not found');
        const { lat, lon, name } = geoData[0];

        const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
        const weatherData = await weatherRes.json();

        cityNameEl.textContent = name;
        weatherIconEl.src = `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`;
        temperatureEl.textContent = `Temperature: ${weatherData.main.temp} °C`;
        feelsLikeEl.textContent = `Feels Like: ${weatherData.main.feels_like} °C`;
        conditionEl.textContent = `Condition: ${weatherData.weather[0].description}`;
        humidityEl.textContent = `Humidity: ${weatherData.main.humidity}%`;
        windEl.textContent = `Wind: ${weatherData.wind.speed} m/s, ${weatherData.wind.deg}°`;
        sunriseEl.textContent = `Sunrise: ${new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString()}`;
        sunsetEl.textContent = `Sunset: ${new Date(weatherData.sys.sunset * 1000).toLocaleTimeString()}`;
        weatherCard.style.display = 'block';

        addCityMarker(lat, lon, weatherData.main.temp);
        animateCameraToCity(lat, lon);
        addWeatherEffect(lat, lon, weatherData.weather[0].main);

        setTimeout(() => fetchWeather(city), 600000);
    } catch (error) {
        console.error(error);
        alert('Error fetching weather data');
    }
}

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        fetchWeather(searchInput.value);
    }
});

// Globe Base
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const textureLoader = new THREE.TextureLoader();
const earthRadius = 5;

const dayTexture = textureLoader.load('https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg');
const nightTexture = textureLoader.load('https://www.solarsystemscope.com/textures/download/2k_earth_nightmap.jpg');
const bumpTexture = textureLoader.load('https://www.solarsystemscope.com/textures/download/2k_earth_bumpmap.jpg');
const specularTexture = textureLoader.load('https://www.solarsystemscope.com/textures/download/2k_earth_specular_map.jpg');
const cloudsTexture = textureLoader.load('https://www.solarsystemscope.com/textures/download/2k_earth_clouds.jpg');

const earthMaterial = new THREE.MeshPhongMaterial({
    map: dayTexture,
    bumpMap: bumpTexture,
    bumpScale: 0.05,
    specularMap: specularTexture,
    specular: new THREE.Color('grey'),
    shininess: 10,
    emissiveMap: nightTexture,
    emissive: new THREE.Color('#111111'),
    emissiveIntensity: 1
});

const earth = new THREE.Mesh(new THREE.SphereGeometry(earthRadius, 64, 64), earthMaterial);
scene.add(earth);

const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(earthRadius + 0.05, 64, 64),
    new THREE.MeshLambertMaterial({ map: cloudsTexture, transparent: true })
);
scene.add(clouds);

const atmosphereMaterial = new THREE.ShaderMaterial({
    uniforms: { c: { value: 0.5 }, p: { value: 1.4 } },
    vertexShader: `
        varying vec3 vNormal;
        void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float c;
        uniform float p;
        varying vec3 vNormal;
        void main() {
            float intensity = pow(c - dot(vNormal, vec3(0.0, 0.0, 1.0)), p);
            gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
        }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true
});
const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(earthRadius + 0.1, 64, 64), atmosphereMaterial);
scene.add(atmosphere);

// Camera System
camera.position.z = 15;

function animateCameraToCity(lat, lon) {
    const targetPos = latLonToVector3(lat, lon, earthRadius + 8);
    new TWEEN.Tween(camera.position)
        .to({ x: targetPos.x, y: targetPos.y, z: targetPos.z }, 2000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(() => camera.lookAt(0, 0, 0))
        .start();
}

function latLonToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
}

// City Markers
const markers = [];
function addCityMarker(lat, lon, temp) {
    markers.forEach(m => scene.remove(m));
    markers.length = 0;

    const position = latLonToVector3(lat, lon, earthRadius);
    const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xff0000, emissive: 0xff0000 })
    );
    marker.position.copy(position);
    scene.add(marker);
    markers.push(marker);

    new TWEEN.Tween(marker.scale)
        .to({ x: 1.5, y: 1.5, z: 1.5 }, 1000)
        .repeat(Infinity)
        .yoyo(true)
        .start();
}

// Advanced Post-Processing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
composer.addPass(bloomPass);

const ssaoPass = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
ssaoPass.kernelRadius = 16;
composer.addPass(ssaoPass);

const vignettePass = new ShaderPass(VignetteShader);
vignettePass.uniforms['offset'].value = 1.0;
vignettePass.uniforms['darkness'].value = 1.0;
composer.addPass(vignettePass);

// Space & Background
const starsTexture = textureLoader.load('https://www.solarsystemscope.com/textures/download/2k_stars_milky_way.jpg');
const stars = new THREE.Mesh(
    new THREE.SphereGeometry(100, 32, 32),
    new THREE.MeshBasicMaterial({ map: starsTexture, side: THREE.BackSide })
);
scene.add(stars);

// Weather Visualization Layer
const weatherEffects = [];
function addWeatherEffect(lat, lon, condition) {
    weatherEffects.forEach(e => scene.remove(e));
    weatherEffects.length = 0;

    const position = latLonToVector3(lat, lon, earthRadius + 0.5);
    let effect;

    if (condition === 'Rain') {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        for (let i = 0; i < 1000; i++) {
            vertices.push(Math.random() * 2 - 1, Math.random() * 2 + 1, Math.random() * 2 - 1);
        }
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const material = new THREE.PointsMaterial({ color: 0xaaaaaa, size: 0.005 });
        effect = new THREE.Points(geometry, material);
        effect.position.copy(position);
        weatherEffects.push(effect);
        scene.add(effect);

        function animateRain() {
            effect.geometry.attributes.position.array.forEach((_, i) => {
                if (i % 3 === 1) {
                    effect.geometry.attributes.position.array[i] -= 0.01;
                    if (effect.geometry.attributes.position.array[i] < -1) {
                        effect.geometry.attributes.position.array[i] = 2;
                    }
                }
            });
            effect.geometry.attributes.position.needsUpdate = true;
        }
        animateFunctions.push(animateRain);
    }
}

// Time of Day Simulation
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(50, 0, 0);
scene.add(sun);
scene.add(new THREE.AmbientLight(0x333333));

function updateSun() {
    const time = Date.now() * 0.0005;
    sun.position.x = 50 * Math.cos(time);
    sun.position.z = 50 * Math.sin(time);
}

// Aurora + Polar Effects (Optional)
const auroraMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 });
const aurora = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2, 32), auroraMaterial);
aurora.position.y = earthRadius + 1;
// scene.add(aurora);

// Animation Loop
const animateFunctions = [];
function animate() {
    requestAnimationFrame(animate);
    earth.rotation.y += 0.001;
    clouds.rotation.y += 0.0012;
    updateSun();
    TWEEN.update();
    animateFunctions.forEach(f => f());
    composer.render();
}
animate();

// Resize Handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});
```
