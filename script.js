// Import the 'three' library, which is now available thanks to the importmap.
import * as THREE from 'three';

// 1. Scene: The container for all objects.
const scene = new THREE.Scene();

// 2. Camera: The viewpoint from which we see the scene.
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// 3. Renderer: The engine that draws the scene onto the screen.
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 4. Object: A simple cube to display.
const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// 5. Animation Loop: A function that runs on every frame to update the scene.
function animate() {
    requestAnimationFrame(animate);

    // Rotate the cube on each frame
    cube.rotation.x += 0.005;
    cube.rotation.y += 0.005;

    // Render the scene from the camera's perspective
    renderer.render(scene, camera);
}

// Start the animation loop
animate();
