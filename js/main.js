// Constantes y configuración
const SCALE = 40; // Escala para hacer visible el sistema
const AU = 149597870.7; // 1 AU en kilómetros
const ORBIT_SEGMENTS = 128;

// Datos de los planetas (mantener los datos existentes)
const PLANETS = {
    mercury: {
        name: 'Mercurio',
        semiMajorAxis: 0.387098,
        eccentricity: 0.205630,
        inclination: 7.005,
        color: 0x8c8c8c,
        size: 0.383,
        orbitPeriod: 87.969
    },
    venus: {
        name: 'Venus',
        semiMajorAxis: 0.723332,
        eccentricity: 0.006772,
        inclination: 3.39458,
        color: 0xe39e1c,
        size: 0.949,
        orbitPeriod: 224.701
    },
    earth: {
        name: 'Tierra',
        semiMajorAxis: 1.000000,
        eccentricity: 0.016709,
        inclination: 0.00005,
        color: 0x2b82d9,
        size: 1,
        orbitPeriod: 365.256
    },
    mars: {
        name: 'Marte',
        semiMajorAxis: 1.523679,
        eccentricity: 0.093405,
        inclination: 1.85061,
        color: 0xc1440e,
        size: 0.532,
        orbitPeriod: 686.980
    },
    jupiter: {
        name: 'Júpiter',
        semiMajorAxis: 5.204267,
        eccentricity: 0.048498,
        inclination: 1.303,
        color: 0xd8ca9d,
        size: 11.209,
        orbitPeriod: 4332.589
    },
    saturn: {
        name: 'Saturno',
        semiMajorAxis: 9.582018,
        eccentricity: 0.054309,
        inclination: 2.485,
        color: 0xead6b8,
        size: 9.449,
        orbitPeriod: 10759.22
    },
    uranus: {
        name: 'Urano',
        semiMajorAxis: 19.229412,
        eccentricity: 0.047318,
        inclination: 0.773,
        color: 0xc5d5d6,
        size: 4.007,
        orbitPeriod: 30688.5
    },
    neptune: {
        name: 'Neptuno',
        semiMajorAxis: 30.103658,
        eccentricity: 0.008676,
        inclination: 1.770,
        color: 0x3f54ba,
        size: 3.883,
        orbitPeriod: 60182
    },
    pluto: {
        name: 'Plutón',
        semiMajorAxis: 39.482,
        eccentricity: 0.248,
        inclination: 17.16,
        color: 0x8b7355,
        size: 0.186,
        orbitPeriod: 90560
    }
};

// Variables globales
let scene, camera, renderer, labelRenderer, controls;
let planets = {};
let planetLabels = {};
let currentDate = new Date();

function createSaturnRings(planet, planetData) {
    const innerRadius = planetData.size * 4;
    const outerRadius = planetData.size * 7;
    const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
    
    const ringMaterial = new THREE.MeshPhongMaterial({
        color: 0xc2a278,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
        emissive: 0xc2a278,
        emissiveIntensity: 0.2
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    planet.add(ring);

    const ring2 = new THREE.Mesh(
        new THREE.RingGeometry(innerRadius * 1.2, outerRadius * 0.9, 64),
        new THREE.MeshPhongMaterial({
            color: 0x937047,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6,
            emissive: 0x937047,
            emissiveIntensity: 0.1
        })
    );
    ring2.rotation.x = Math.PI / 2;
    planet.add(ring2);
}

function calculateOrbitalPosition(planetData, meanAnomaly) {
    const e = planetData.eccentricity;
    const M = meanAnomaly * Math.PI / 180;
    const a = planetData.semiMajorAxis;
    const inclination = planetData.inclination * Math.PI / 180;

    let E = M;
    for (let i = 0; i < 10; i++) {
        E = M + e * Math.sin(E);
    }

    const x = a * (Math.cos(E) - e);
    const y = a * Math.sqrt(1 - e * e) * Math.sin(E);

    return {
        x: x,
        y: y * Math.cos(inclination),
        z: y * Math.sin(inclination)
    };
}

function createLabel(text, position) {
    const div = document.createElement('div');
    div.className = 'label';
    div.style.color = 'white';
    div.style.padding = '2px 6px';
    div.style.background = 'rgba(0, 0, 0, 0.6)';
    div.style.borderRadius = '3px';
    div.textContent = text;

    const label = new THREE.CSS2DObject(div);
    label.position.set(position.x, position.y + 5, position.z);
    
    return label;
}

function createOrbit(planetData) {
    const points = [];
    for (let i = 0; i <= ORBIT_SEGMENTS; i++) {
        const angle = (i / ORBIT_SEGMENTS) * Math.PI * 2;
        const position = calculateOrbitalPosition(planetData, angle * 180 / Math.PI);
        points.push(new THREE.Vector3(position.x * SCALE, position.y * SCALE, position.z * SCALE));
    }

    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const orbitMaterial = new THREE.LineBasicMaterial({ 
        color: 0x666666,
        transparent: true,
        opacity: 0.8,
        linewidth: 2
    });
    const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
    scene.add(orbit);
}

function createPlanets() {
    const J2000 = new Date('2000-01-01T12:00:00Z');
    const daysSinceJ2000 = (currentDate - J2000) / (1000 * 60 * 60 * 24);

    // Limpiar planetas y etiquetas existentes
    Object.values(planets).forEach(planet => {
        if (planet.parent) {
            planet.parent.remove(planet);
        }
    });
    Object.values(planetLabels).forEach(label => {
        if (label.parent) {
            label.parent.remove(label);
        }
    });
    planets = {};
    planetLabels = {};

    for (const [key, data] of Object.entries(PLANETS)) {
        const meanAnomaly = (360 / data.orbitPeriod) * daysSinceJ2000 % 360;
        const position = calculateOrbitalPosition(data, meanAnomaly);

        const geometry = new THREE.SphereGeometry(data.size * 2, 32, 32);
        const material = new THREE.MeshPhongMaterial({ 
            color: data.color,
            emissive: data.color,
            emissiveIntensity: 0.4,
            shininess: 30
        });

        const planet = new THREE.Mesh(geometry, material);
        planet.position.set(position.x * SCALE, position.y * SCALE, position.z * SCALE);
        
        if (key === 'saturn') {
            createSaturnRings(planet, data);
        }

        scene.add(planet);
        planets[key] = planet;

        const label = createLabel(data.name, planet.position);
        scene.add(label);
        planetLabels[key] = label;

        createOrbit(data);
    }
}

function updateSystemDate(newDate) {
    currentDate = newDate;
    const dateInput = document.getElementById('dateInput');
    if (dateInput) {
        dateInput.value = newDate.toISOString().split('T')[0];
    }
    createPlanets();
}

function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(100, 75, 100);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    labelRenderer = new THREE.CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    document.body.appendChild(labelRenderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 500;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.1;

    // Crear Sol con brillo
    const sunGeometry = new THREE.SphereGeometry(3, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);

    // Añadir brillo al Sol
    const sunGlowGeometry = new THREE.SphereGeometry(4, 32, 32);
    const sunGlowMaterial = new THREE.ShaderMaterial({
        uniforms: {
            viewVector: { type: "v3", value: camera.position }
        },
        vertexShader: `
            uniform vec3 viewVector;
            varying float intensity;
            void main() {
                vec3 vNormal = normalize(normalMatrix * normal);
                vec3 vNormel = normalize(normalMatrix * viewVector);
                intensity = pow(0.6 - dot(vNormal, vNormel), 2.0);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying float intensity;
            void main() {
                vec3 glow = vec3(1.0, 0.8, 0.0) * intensity;
                gl_FragColor = vec4(glow, 1.0);
            }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true
    });
    const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
    scene.add(sunGlow);

    // Añadir luz ambiental
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    // Añadir luz del Sol
    const sunLight = new THREE.PointLight(0xffffff, 2.5);
    scene.add(sunLight);

    // Añadir estrellas de fondo
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 0.1
    });

    const starsVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = THREE.MathUtils.randFloatSpread(2000);
        const y = THREE.MathUtils.randFloatSpread(2000);
        const z = THREE.MathUtils.randFloatSpread(2000);
        starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    createPlanets();

    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();

    const sunGlow = scene.children.find(child => child.material && child.material.type === 'ShaderMaterial');
    if (sunGlow) {
        sunGlow.material.uniforms.viewVector.value = new THREE.Vector3().subVectors(camera.position, sunGlow.position);
    }

    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

// Esperar a que el DOM esté listo antes de iniciar
document.addEventListener('DOMContentLoaded', () => {
    init();
    animate();
    
    // Configurar controles de fecha
    const dateInput = document.getElementById('dateInput');
    if (dateInput) {
        dateInput.value = currentDate.toISOString().split('T')[0];
        
        dateInput.addEventListener('change', (e) => {
            const newDate = new Date(e.target.value);
            newDate.setHours(12, 0, 0, 0);
            updateSystemDate(newDate);
        });
    }

    const prevButton = document.getElementById('prevDay');
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            const newDate = new Date(currentDate);
            newDate.setDate(newDate.getDate() - 1);
            updateSystemDate(newDate);
        });
    }

    const nextButton = document.getElementById('nextDay');
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            const newDate = new Date(currentDate);
            newDate.setDate(newDate.getDate() + 1);
            updateSystemDate(newDate);
        });
    }
});
