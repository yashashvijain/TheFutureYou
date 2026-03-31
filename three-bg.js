const initThreeJS = () => {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    
    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 3;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Particle System (Nebula Dust)
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 2000;
    const posArray = new Float32Array(particlesCount * 3);

    for(let i = 0; i < particlesCount * 3; i++) {
        // Spread particles out in a 3D sphere/area
        posArray[i] = (Math.random() - 0.5) * 12;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    // Material with Additive Blending for a glowing effect
    const material = new THREE.PointsMaterial({
        size: 0.015,
        color: 0x818cf8, // Indigo core branding
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    const particlesMesh = new THREE.Points(particlesGeometry, material);
    scene.add(particlesMesh);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - windowHalfX);
        mouseY = (event.clientY - windowHalfY);
    });

    const clock = new THREE.Clock();

    const animate = () => {
        requestAnimationFrame(animate);

        const elapsedTime = clock.getElapsedTime();

        // Parallax Effect based on Mouse
        targetX = mouseX * 0.001;
        targetY = mouseY * 0.001;

        // Base idle rotation
        particlesMesh.rotation.y += 0.0003;
        particlesMesh.rotation.x += 0.0001;

        // Easing interpolation for smooth mouse tracking
        particlesMesh.rotation.y += 0.05 * (targetX - particlesMesh.rotation.y);
        particlesMesh.rotation.x += 0.05 * (targetY - particlesMesh.rotation.x);

        // Optional undulating scale
        particlesMesh.scale.x = 1 + Math.sin(elapsedTime * 0.5) * 0.05;
        particlesMesh.scale.y = 1 + Math.sin(elapsedTime * 0.5) * 0.05;

        renderer.render(scene, camera);
    };

    animate();

    // Responsive Resizing
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
};

document.addEventListener('DOMContentLoaded', initThreeJS);
