import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
//import { GUI } from 'dat.gui';

// Shaders de fragmentos como ejemplos simples
const shaders = {
    'Shader1': {
        fragmentShader: `
        uniform vec3 color;
        void main() {
            gl_FragColor = vec4(color, 1.0);
        }
        `, // Tu código GLSL para el Shader 1
    },
    'Shader2': {
        fragmentShader: ` 
        varying vec3 vPosition;
        void main() {
            float brightness = normalize(vPosition.y + 1.0) * 0.5;
            gl_FragColor = vec4(vec3(brightness), 1.0);
        }
        `, // Tu código GLSL para el Shader 2
    },
    // Agrega más shaders según sea necesario
};

// Configuración inicial de Three.js
let camera, scene, renderer, model;
const meshTree = {};
var loader = null;



function init() {
    // Configuración básica de la escena, cámara y renderer
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff); // Establece el fondo de la escena a blanco

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);

    // Agregar luz ambiental
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // color, intensidad
    scene.add(ambientLight);

    // Agregar luz direccional
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Color blanco, intensidad de 1
    directionalLight.position.set(0, 1, 0); // Posición arriba y apuntando hacia abajo
    directionalLight.castShadow = true;
    directionalLight.intensity = 2; // Aumenta para una luz más brillante
    directionalLight.shadow.mapSize.width = 2048; // Mayor para sombras más detalladas
    directionalLight.shadow.mapSize.height = 2048;

    scene.add(directionalLight);
    
    const areaLight = new THREE.RectAreaLight(0xffffff, 1, 10, 10); // color, intensidad, ancho, alto
    areaLight.position.set(0, 1, 0);
    areaLight.lookAt(0, 0, 0);
    scene.add(areaLight);


    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(100, 1000, 100);
    spotLight.intensity = 2;
    scene.add(spotLight);

    const spotLight2 = new THREE.SpotLight(0xffffff, 1); // Color blanco, intensidad de 1
    spotLight2.position.set(0, 10, 0); // Colocada arriba en el eje Y
    spotLight2.angle = Math.PI / 4; // Ángulo del cono de luz
    spotLight2.intensity = 2;
    spotLight2.penumbra = 0.1; // Un pequeño penumbra para suavizar los bordes del cono
    spotLight2.target.position.set(0, 0, 0); // Apuntando hacia el origen
    scene.add(spotLight2);
    scene.add(spotLight2.target);
    

    // Cargar modelo GLB
    loader = new GLTFLoader();
    loader.load('./aa.glb', function(gltf) {
        model = gltf.scene;

        model.traverse((o) => {
            if (o.isMesh) {
                console.log(o.name);
                 // Guardar referencia del mesh en el árbol
                meshTree[o.name] = {
                    mesh: o,
                    name: o.name,
                };
                
               // o.material.color.setHex(0xff0000);
                // Asegurándonos de que el material refleje el entorno
                o.material.envMap = scene.environment;
                o.material.metalness = 0.5; // Ajusta según sea necesario
                o.material.roughness = 0.1; // Ajusta según sea necesario
            }
        });
        console.log(model)
        console.log(meshTree)

        scene.add(model);

        createMeshColorControls();

        // Aplicar el primer shader por defecto al cargar
       // updateShader('Shader1');
    });




    camera.position.z = 5;
    animate();
}

function createMeshColorControls() {
  const gui = new dat.GUI();
  const folder = gui.addFolder('Mesh Colors');
  // Verifica si 'object_357' existe en meshTree antes de añadir el control
  if (meshTree['Object_357']) {
      const meshInfo = meshTree['Object_357'];
      const color = { value: '#ffffff' }; // Color inicial blanco, ajusta si es necesario
      // Añade un control para cambiar el color de 'object_357'
      folder.addColor(color, 'value').name(meshInfo.name).onChange(value => {
          changeMeshColor(meshInfo.name, parseInt(value.replace('#', ''), 16));
      });
  } else {
      console.log('Mesh "Object_357" no encontrado.');
  }
  folder.open();
}


function updateShader(shaderName) {
    const shader = shaders[shaderName];
    if (model && shader) {
        model.traverse((child) => {
            if (child.isMesh) {
                const material = new THREE.ShaderMaterial({
                    fragmentShader: shader.fragmentShader,
                    vertexShader: THREE.ShaderLib.standard.vertexShader, // Usa el vertex shader estándar
                    uniforms: THREE.UniformsUtils.clone(THREE.ShaderLib.standard.uniforms), // Clona los uniforms estándar
                });
                child.material = material;
            }
        });
    }
}

function changeMeshColor(meshName, colorHex) {
  if (meshTree[meshName]) {
      meshTree[meshName].mesh.material.color.setHex(colorHex);
  } else {
      console.log('Mesh no encontrado: ' + meshName);
  }
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

init();
