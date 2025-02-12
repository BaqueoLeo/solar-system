// Constantes globales
const ESCALA_DISTANCIA = 200;  // Aumentada para mejor espaciado entre planetas
const ESCALA_GALAXIA = 100000;  // Aumentada para mejor vista de la galaxia
const ESCALA_TAMANO = 80.0;  // Aumentada para mejor visibilidad de planetas
let escalaActual = ESCALA_DISTANCIA;
let vistaGalaxia = false;

// Configuración inicial de Three.js
const escena = new THREE.Scene();
const camara = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000000);
const renderizador = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true
});
renderizador.setClearColor(0x000000, 1); // Fondo negro
renderizador.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderizador.domElement);

// Inicializar grupo del sistema solar
const grupoSistemaSolar = new THREE.Group();
escena.add(grupoSistemaSolar);

// Crear planetas
const planetas = [
    { nombre: "Mercurio", color: 0x8C8C8C, distancia: 4, tamaño: 0.38 },
    { nombre: "Venus", color: 0xE6B800, distancia: 7, tamaño: 0.95 },
    { nombre: "Tierra", color: 0x3333FF, distancia: 10, tamaño: 1.0 },
    { nombre: "Marte", color: 0xCC3300, distancia: 15, tamaño: 0.53 },
    { nombre: "Júpiter", color: 0xFFB366, distancia: 25, tamaño: 11.2 },
    { nombre: "Saturno", color: 0xFFCC99, distancia: 35, tamaño: 9.45 },
    { nombre: "Urano", color: 0x99FFFF, distancia: 42, tamaño: 4.0 },
    { nombre: "Neptuno", color: 0x3399FF, distancia: 48, tamaño: 3.88 }
];

// Crear estrellas
const estrellasGeometry = new THREE.BufferGeometry();
const estrellasVertices = [];
for (let i = 0; i < 10000; i++) {
    const x = (Math.random() - 0.5) * 200000;
    const y = (Math.random() - 0.5) * 200000;
    const z = (Math.random() - 0.5) * 200000;
    estrellasVertices.push(x, y, z);
}
estrellasGeometry.setAttribute('position', new THREE.Float32BufferAttribute(estrellasVertices, 3));
const estrellasMaterial = new THREE.PointsMaterial({ color: 0xFFFFFF });
const estrellas = new THREE.Points(estrellasGeometry, estrellasMaterial);
escena.add(estrellas);

// Parámetros orbitales realistas (excentricidad y semi-eje mayor)
const parametrosOrbitales = [
    { excentricidad: 0.2056, semiEjeMayor: 57909050 }, // Mercurio
    { excentricidad: 0.0068, semiEjeMayor: 108208000 }, // Venus
    { excentricidad: 0.0167, semiEjeMayor: 149598023 }, // Tierra
    { excentricidad: 0.0934, semiEjeMayor: 227939200 }, // Marte
    { excentricidad: 0.0489, semiEjeMayor: 778340821 }, // Júpiter
    { excentricidad: 0.0565, semiEjeMayor: 1426666422 }, // Saturno
    { excentricidad: 0.0472, semiEjeMayor: 2870658186 }, // Urano
    { excentricidad: 0.0086, semiEjeMayor: 4498396441 }  // Neptuno
];

// Crear órbitas elípticas basadas en las leyes de Kepler
const orbitas = planetas.map((planeta, index) => {
    const puntosOrbita = [];
    const segmentos = 200;
    const { excentricidad, semiEjeMayor } = parametrosOrbitales[index];
    const semiEjeMenor = semiEjeMayor * Math.sqrt(1 - excentricidad * excentricidad);
    const escalaOrbital = ESCALA_DISTANCIA / 149598023; // Escala basada en 1 AU
    
    for (let i = 0; i <= segmentos; i++) {
        const angulo = (i / segmentos) * Math.PI * 2;
        const radio = (semiEjeMayor * semiEjeMenor) / 
            Math.sqrt(Math.pow(semiEjeMenor * Math.cos(angulo), 2) + 
                     Math.pow(semiEjeMayor * Math.sin(angulo), 2));
        
        puntosOrbita.push(
            Math.cos(angulo) * radio * escalaOrbital,
            0,
            Math.sin(angulo) * radio * escalaOrbital
        );
    }
    
    const geometriaOrbita = new THREE.BufferGeometry();
    geometriaOrbita.setAttribute('position', new THREE.Float32BufferAttribute(puntosOrbita, 3));
    const materialOrbita = new THREE.LineBasicMaterial({ 
        color: 0xFFFFFF, 
        transparent: true, 
        opacity: 0.3 
    });
    const orbita = new THREE.LineLoop(geometriaOrbita, materialOrbita);
    grupoSistemaSolar.add(orbita);
    return orbita;
});

const objetosPlanetas = planetas.map(planeta => {
    const geometria = new THREE.SphereGeometry(planeta.tamaño * ESCALA_TAMANO, 64, 64);
    const material = new THREE.MeshStandardMaterial({ 
        color: planeta.color,
        metalness: 0.1,
        roughness: 0.8,
        emissive: planeta.color,
        emissiveIntensity: 0.2
    });
    const mesh = new THREE.Mesh(geometria, material);
    mesh.position.x = planeta.distancia * ESCALA_DISTANCIA;
    
    // Crear etiqueta
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.font = '24px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(planeta.nombre, canvas.width/2, canvas.height/2);
    
    const textura = new THREE.CanvasTexture(canvas);
    const materialEtiqueta = new THREE.SpriteMaterial({ map: textura });
    const etiqueta = new THREE.Sprite(materialEtiqueta);
    etiqueta.position.set(0, planeta.tamaño * ESCALA_TAMANO * 1.5, 0);
    mesh.add(etiqueta);
    etiqueta.visible = false;
    
    // Interactividad
    mesh.userData = { nombre: planeta.nombre };
    mesh.addEventListener('mouseenter', () => {
        etiqueta.visible = true;
    });
    mesh.addEventListener('mouseleave', () => {
        etiqueta.visible = false;
    });
    
    grupoSistemaSolar.add(mesh);
    return mesh;
});

// Crear sol
const geometriaSol = new THREE.SphereGeometry(20, 32, 32);
const materialSol = new THREE.MeshStandardMaterial({ 
    color: 0xFFFF00,
    emissive: 0xFFFF00,
    emissiveIntensity: 1.0,
    metalness: 0.1,
    roughness: 0.8
});
const sol = new THREE.Mesh(geometriaSol, materialSol);
grupoSistemaSolar.add(sol);

// Configurar luces
const luzAmbiental = new THREE.AmbientLight(0x404040);
escena.add(luzAmbiental);

const luzDireccional = new THREE.DirectionalLight(0xffffff, 1);
luzDireccional.position.set(1, 1, 1).normalize();
escena.add(luzDireccional);

// Función de animación
function animar() {
    requestAnimationFrame(animar);
    
    // Rotar planetas
    objetosPlanetas.forEach((planeta, index) => {
        planeta.rotation.y += 0.01 * (index + 1);
    });
    
    // Rotar sol
    sol.rotation.y += 0.005;
    
    renderizador.render(escena, camara);
}
animar();

// Cambiar vista
function cambiarVista() {
    vistaGalaxia = !vistaGalaxia;
    
    if (vistaGalaxia) {
        camara.position.set(0, 50000, 100000);
        camara.lookAt(new THREE.Vector3(0, 0, 0));
    } else {
        camara.position.set(0, 1000, 2000);
        camara.lookAt(new THREE.Vector3(0, 0, 0));
    }
}

// Botón para cambiar vista
const botonVista = document.createElement('button');
botonVista.textContent = 'Cambiar Vista';
botonVista.style.position = 'absolute';
botonVista.style.top = '10px';
botonVista.style.left = '10px';
botonVista.addEventListener('click', cambiarVista);
document.body.appendChild(botonVista);

// Configuración inicial de la cámara


// Objeto de configuración
const Configuracion = {
    vista: {
        vistaGalaxia: false
    },
    galaxia: {
        anguloSistemaSolar: 0,
        periodoOrbitalSolar: 250 // en millones de años
    },
    periodosOrbitales: [0.24, 0.62, 1.0, 1.88, 11.86, 29.46, 84.01, 164.8] // en años terrestres
};

camara.position.set(0, 1000, 2000);
camara.lookAt(new THREE.Vector3(0, 0, 0));

// Controles de órbita
const controles = new THREE.OrbitControls(camara, renderizador.domElement);
controles.target.set(0, 0, 0);
controles.maxDistance = 10000;
controles.minDistance = 50;
controles.update();
