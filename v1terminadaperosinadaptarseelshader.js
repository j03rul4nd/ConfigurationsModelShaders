import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
//import { GUI } from 'dat.gui';

// Shaders de fragmentos como ejemplos simples
var shaders = {};
shaders['AnimatedGradient'] = {
  fragmentShader: `
  uniform float time;
  void main() {
    float green = mod(time / 2.0, 1.0); // Oscila entre 0.0 y 1.0
    float blue = mod(time / 4.0, 1.0); // Oscila entre 0.0 y 1.0 pero más lentamente
    gl_FragColor = vec4(1.0, green, blue, 1.0);
   // gl_FragColor = vec4(0., 1., 0., 1.0);
  }
  `,
  uniforms: {
      time: { value: 0.0 },
  }
};
shaders['RocketLeague'] = {
  fragmentShader: `
  #ifdef GL_ES
  precision mediump float;
  #endif
  
  uniform float time;
  uniform vec2 u_resolution;
  
  void main(){
    vec2 coord = (gl_FragCoord.xy / u_resolution.xy);
    float color = 0.0;
  
    color += sin(coord.x * 50.0 + cos(time + coord.y * 10.0 + sin(coord.x * 50.0 + time * 2.0))) * 2.0;
    color += cos(coord.x * 20.0 + sin(time + coord.y * 10.0 + cos(coord.x * 50.0 + time * 2.0))) * 2.0;
    color += sin(coord.x * 30.0 + cos(time + coord.y * 10.0 + sin(coord.x * 50.0 + time * 2.0))) * 2.0;
    color += cos(coord.x * 10.0 + sin(time + coord.y * 10.0 + cos(coord.x * 50.0 + time * 2.0))) * 2.0;
  
    gl_FragColor = vec4(vec3(color + coord.y, color + coord.x, color + coord.x + coord.y), 1.0);
  }
  `,
  uniforms: {
      time: { value: 0.0 },
      u_resolution: { 
        value: new THREE.Vector2(window.innerWidth, window.innerHeight) 
    },
  }
};

// Configuración inicial de Three.js
let camera, scene, renderer, model;
const meshTree = {};
var loader = null;



function init() {
    // Configuración básica de la escena, cámara y renderer
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x808080); // Establece el fondo de la escena a gris

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // para sombras suavizadas

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
    loader.load('./bb.glb', function(gltf) {
        model = gltf.scene;

        model.traverse((o) => {
            if (o.isMesh) {
                console.log(o.name);
                 // Guardar referencia del mesh en el árbol
                meshTree[o.name] = {
                    mesh: o,
                    name: o.name,
                    children: []
                    // Puedes añadir más propiedades aquí si es necesario
                };
                
               // o.material.color.setHex(0xff0000);
                // Asegurándonos de que el material refleje el entorno
                o.material.envMap = scene.environment;
                o.material.metalness = 0.5; // Ajusta según sea necesario
                o.material.roughness = 0.1; // Ajusta según sea necesario
                o.castShadow = true;
                o.receiveShadow = true;
            }
        });
        console.log(model)
        console.log(meshTree)

        scene.add(model);

        //createMeshColorControls();

        // Ejemplo de cómo usar la función applyShaders
        // Suponiendo que quieres aplicar el shader 'AnimatedGradient' a dos mallas y 'RocketLeague' a otra
        const meshShaderMap = {
          // 'nombreDeLaMalla1': 'AnimatedGradient',
          // 'nombreDeLaMalla2': 'AnimatedGradient',  euansenna_door_L_sennapaintmain_0
          'euansenna_flank_L_sennapaintmain_0': 'RocketLeague',
          'euansenna_flank_R_sennapaintmain_0': 'RocketLeague',
          'euansenna_fender_R_sennapaintmain_0': 'RocketLeague',
          'euansenna_fender_L_sennapaintmain_0': 'RocketLeague',

          'euansenna_sideskirt_R_GTR_sennapaintmain_0': 'RocketLeague',
          'euansenna_sideskirt_L_GTR_sennapaintmain_0': 'RocketLeague',

          'euansenna_door_R_senna_chrome_0': 'RocketLeague',
          
          'euansenna_hood_a_carbon_0': 'RocketLeague',
          'euansenna_bumper_R_a_carbon_0': 'RocketLeague',


          'euansenna_hood_sennapaintmain_0': 'RocketLeague',
          'euansenna_body_senna_chrome_0': 'RocketLeague',
          'euansenna_body_mainint_0': 'RocketLeague',

          'euansenna_door_L_sennapaintmain_0': 'RocketLeague',
          'euansenna_door_R_sennapaintmain_0': 'RocketLeague',

          'euansenna_flank_hardtop_sennapaintmain_0': 'RocketLeague',


        };

        // Llama a esta función después de haber cargado tus modelos y construido meshTree
        applyShaders(meshShaderMap);


    });




    camera.position.z = 5;
    animate();
}

// function createMeshColorControls() {
//   const gui = new dat.GUI();
//   const folder = gui.addFolder('Mesh Colors');
//   Object.keys(meshTree).forEach(meshName => {
//       const meshInfo = meshTree[meshName];
//       // Crea un control para el color inicial del mesh, puedes ajustarlo según sea necesario
//       const color = { value: '#ffffff' }; // Color inicial blanco
//       folder.addColor(color, 'value').name(meshInfo.name).onChange(value => {
//           changeMeshColor(meshInfo.name, parseInt(value.replace('#', ''), 16));
//       });
//   });


//   folder.open();
// }

// Función para aplicar un shader específico a una lista de nombres de mallas


function applyShaderToMultipleMeshes(meshNames, shaderName) {
  const shader = shaders[shaderName];
  if (!shader) {
      console.log('Shader no encontrado: ' + shaderName);
      return;
  }

  meshNames.forEach(meshName => {
      if (meshTree[meshName]) {
          const mesh = meshTree[meshName].mesh;
          mesh.material = new THREE.ShaderMaterial({
              fragmentShader: shader.fragmentShader,
              uniforms: THREE.UniformsUtils.clone(shader.uniforms),
          });
          console.log('Shader aplicado a: ' + meshName);
      } else {
          console.log('Mesh no encontrado: ' + meshName);
      }
  });
}

// Función para aplicar shaders seleccionados a las mallas especificadas
function applyShaders(meshShaderMap) {
  Object.keys(meshShaderMap).forEach(meshName => {
      const shaderName = meshShaderMap[meshName];
      applyShaderToMultipleMeshes([meshName], shaderName);
  });
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

    // Actualiza el shader solo si es aplicable
    updateShadersTime();

    renderer.render(scene, camera);
}

// Función para actualizar el uniforme 'time' en los shaders que lo requieran
function updateShadersTime() {
  Object.keys(meshTree).forEach(meshName => {
      const meshInfo = meshTree[meshName];
      if (meshInfo.mesh.material instanceof THREE.ShaderMaterial) {
          // Asumiendo que todos los ShaderMaterials usan el uniforme 'time'
          if (meshInfo.mesh.material.uniforms.time) {
              meshInfo.mesh.material.uniforms.time.value += 0.05; // Ajusta según la velocidad deseada
          }
      }
  });
}

init();