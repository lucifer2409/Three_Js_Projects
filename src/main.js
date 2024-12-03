import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const gameCards = document.querySelectorAll('.game-card');
gameCards.forEach((card, index) => {
    gsap.from(card, {
        x: -100,
        opacity: 0,
        duration: 0.8,
        delay: index * 0.05,
        ease: "power1.out",
        scrollTrigger: {
            trigger: card,
            start: "top 85%",
            toggleActions: "play none none none",
            scrub: 0.5,
            end: "top 60%",
        }
    });
});

// Create scene, camera and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true , alpha:true}); // Add antialiasing
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio); // Handle high DPI displays
renderer.shadowMap.enabled = true; // Enable shadow mapping
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
document.body.appendChild(renderer.domElement);

// Setup post-processing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms['amount'].value = 0.0030;
composer.addPass(rgbShiftPass);

// Load HDR environment map
new RGBELoader()
    .load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/4k/pond_bridge_night_4k.hdr', function(texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        // scene.background = texture;
        scene.environment = texture;
    });

// Add lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // Increased intensity
directionalLight.position.set(5, 5, 5); // Adjusted position
directionalLight.castShadow = true; // Enable shadow casting
scene.add(directionalLight);


// Position camera
camera.position.z = 2;
camera.position.y = 2; // Slight elevation
camera.lookAt(0, 0, 0);

// Create loader and load model
const loader = new GLTFLoader();
let model;

loader.load(
    './DamagedHelmet.gltf',
    function (gltf) {
        model = gltf.scene;
        model.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });
        scene.add(model);
    },
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
        console.error('An error happened:', error);
    }
);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    composer.render(); // Use composer instead of renderer
}

animate();

// Handle window resize
window.addEventListener('resize', onWindowResize, false);
window.addEventListener('mousemove' , (e) => {
  if(model){
    const rotationX = (e.clientX / window.innerWidth - .5) * Math.PI * .12;
    const rotationY = (e.clientY / window.innerHeight - .5) * Math.PI * .12;
    gsap.to(model.rotation, {
      x: rotationY,
      y: rotationX,
      duration: 0.5,
      ease: "power2.out"
    });

    
  }
})  

window.addEventListener('resize' , () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth , window.innerHeight);
  composer.setSize(window.innerWidth , window.innerHeight);
})

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight); // Update composer size too
}

// Add this after gsap.registerPlugin(ScrollTrigger);
let lastScrollTop = 0;
const nav = document.querySelector('nav');

const navTimeline = gsap.timeline({ paused: true });
navTimeline.to(nav, {
    yPercent: -100,
    duration: 0.3,
    ease: "power2.inOut"
});

// Throttle function
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Throttled scroll handler
window.addEventListener('scroll', throttle(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > lastScrollTop && scrollTop > nav.offsetHeight) {
        navTimeline.play();
    } else {
        navTimeline.reverse();
    }
    
    lastScrollTop = scrollTop;
}, 150)); // Throttle to run at most every 150ms

// Music Player Implementation
document.addEventListener('DOMContentLoaded', function() {
  const musicPlayer = document.getElementById('music-player');
  const hideButton = document.getElementById('hide-player');
  const playPauseButton = document.getElementById('playPause');
  const audio = document.getElementById('bgMusic');
  const waveContainer = document.querySelector('.wave-container');

  // Auto-play setup
  const startMusic = () => {
    audio.play()
      .then(() => {
        waveContainer.classList.remove('paused');
        playPauseButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `;
      })
      .catch(error => {
        console.log("Autoplay prevented:", error);
      });
  };

  // Try to autoplay
  startMusic();

  // Fallback for browsers that block autoplay
  document.addEventListener('click', function autoplayHandler() {
    startMusic();
    document.removeEventListener('click', autoplayHandler);
  }, { once: true });

  // Show/Hide Player with music stop
  hideButton.addEventListener('click', () => {
    musicPlayer.style.display = 'none';
    audio.pause(); // Stop the music
    waveContainer.classList.add('paused'); // Pause the wave animation
    playPauseButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    `;
  });

  // Play/Pause functionality
  playPauseButton.addEventListener('click', () => {
    if (audio.paused) {
      audio.play();
      waveContainer.classList.remove('paused');
      playPauseButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      `;
    } else {
      audio.pause();
      waveContainer.classList.add('paused');
      playPauseButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      `;
    }
  });
});
