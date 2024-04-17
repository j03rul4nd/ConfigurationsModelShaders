import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Shaders de fragmentos como ejemplos simples
var shaders = {};

let nameFluid = 'fluid';

shaders[nameFluid] = {
  fragmentShader: `
  #ifdef GL_ES
  precision mediump float;
  #endif
  
  uniform float time;
  varying vec2 vUv;
  
  void main() {
    float color = 0.0;
    color += sin(vUv.x * 50.0 + cos(time + vUv.y * 10.0 + sin(vUv.x * 50.0 + time * 2.0))) * 2.0;
    color += cos(vUv.x * 20.0 + sin(time + vUv.y * 10.0 + cos(vUv.x * 50.0 + time * 2.0))) * 2.0;
    color += sin(vUv.x * 30.0 + cos(time + vUv.y * 10.0 + sin(vUv.x * 50.0 + time * 2.0))) * 2.0;
    color += cos(vUv.x * 10.0 + sin(time + vUv.y * 10.0 + cos(vUv.x * 50.0 + time * 2.0))) * 2.0;
    
    gl_FragColor = vec4(vec3(color + vUv.y, color + vUv.x, color + vUv.x + vUv.y), 1.0);
  }
  `,
  uniforms: {
      time: { value: 0.0 },
  },
  vertexShader:`
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `
};

shaders['tiguer'] = {
  fragmentShader: `
  #ifdef GL_ES
  precision mediump float;
  #endif

  uniform float time;
  varying vec2 vUv;

  void main() {
    // Modifica las frecuencias y las fases de las ondas para obtener una mezcla más suave
    float xComponent = vUv.x * 40.0; // Ajusta la escala de x para cambiar la frecuencia de los colores
    float yComponent = vUv.y * 20.0; // Ajusta la escala de y para una variación más suave
    float timeEffect = time * 1.5; // Acelera ligeramente el cambio de color con el tiempo

    // Combinación suave de colores basada en sin y cos con ajustes de fase y amplitud
    float color = 0.5 + 0.5 * sin(xComponent + 10.0 * cos(timeEffect + yComponent)) +
                  0.5 * cos(yComponent + 10.0 * sin(timeEffect + xComponent));

    // Ajuste en la asignación de colores para una transición más suave y visualmente atractiva
    gl_FragColor = vec4(vec3(color, color * 0.8, color * 0.6), 1.0);
  }
  `,
  uniforms: {
      time: { value: 0.0 },
  },
  vertexShader:`
    varying vec2 vUv;

    void main() {
        vUv = uv; // Pasamos las coordenadas UV al fragment shader
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `
};

// aplicar el shader a mallas personalizadas 
const meshShaderMap = {
  'euansenna_flank_L_sennapaintmain_0': nameFluid,
  'euansenna_flank_R_sennapaintmain_0': nameFluid,
  'euansenna_fender_R_sennapaintmain_0': nameFluid,
  'euansenna_fender_L_sennapaintmain_0': nameFluid,
  'euansenna_sideskirt_R_GTR_sennapaintmain_0': nameFluid,
  'euansenna_sideskirt_L_GTR_sennapaintmain_0': nameFluid,
  'euansenna_door_R_senna_chrome_0': nameFluid,     
  'euansenna_hood_a_carbon_0': nameFluid,
  'euansenna_bumper_R_a_carbon_0': nameFluid,
  'euansenna_hood_sennapaintmain_0': nameFluid,
  'euansenna_body_senna_chrome_0': nameFluid,
  'euansenna_body_mainint_0': nameFluid,
  'euansenna_door_L_sennapaintmain_0': nameFluid,
  'euansenna_door_R_sennapaintmain_0': nameFluid,
  'euansenna_flank_hardtop_sennapaintmain_0': nameFluid,
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
    
    // Add coche
    loader = new GLTFLoader();
    loader.load('./car.glb', function(gltf) {
        model = gltf.scene;

        model.traverse((o) => {
            if (o.isMesh) {
                console.log(o.name);
                // Guardar referencia del mesh en el árbol
                meshTree[o.name] = {
                    mesh: o,
                    name: o.name,
                    children: []
                };
                
                // Asegurándonos de que el material refleje el entorno
                o.material.envMap = scene.environment;
                o.material.metalness = 0.5; // Ajusta según sea necesario
                o.material.roughness = 0.1; // Ajusta según sea necesario
                o.castShadow = true;
                o.receiveShadow = true;
            }
        });

        scene.add(model);
        // Llama a esta función después de haber cargado tus modelos y construido meshTree
        applyShaders(meshShaderMap);

    });

    // Add terreno
    loader.load('./road.glb', function(gltf) {
      // realtime_grass.glb
      //house.glb
      // free_city_road_layout_mockup.glb
      const terrain = gltf.scene;
      
      // Aquí puedes ajustar la posición, la escala y la rotación según sea necesario
      terrain.position.set(0.85, 0, 10.5); // Ejemplo: Coloca el terreno un poco más abajo
      terrain.scale.set(0.0215, 0.0215, 0.0215); 
      // terrain.scale.set(5, 5, 5); // Ejemplo: Ajusta la escala si es necesario
      terrain.rotateY(90);
      scene.add(terrain); // Añade el terreno a la escena

    }, undefined, function(error) {
      console.error(error); // En caso de que haya un error al cargar el modelo
    });

    // Establece la posición inicial de la cámara usando los valores proporcionados
    camera.position.set(4.3565530769342296, 2.9791928816987263, 5.632672796304019);
    camera.lookAt(new THREE.Vector3(-1.086, -1.202, -1.606)); // Apunta la cámara hacia el origen (centro del coche)

    animate();
}

function createMeshColorControls() {
  // Crea la instancia de GUI
  const gui = new dat.GUI();
  const shaderOptions = {
      shader: nameFluid, // Valor inicial
  };

  // Agrega un control desplegable para seleccionar el shader
  gui.add(shaderOptions, 'shader', Object.keys(shaders)).name('Shader').onChange((shaderName) => {
      // Aquí puedes llamar a una función que aplique el shader seleccionado a tu modelo o mallas específicas
      // Por ejemplo, podrías tener una función que actualiza todos los shaders de acuerdo al seleccionado:
      updateModelShader(shaderName);
  });
}

// Función para actualizar el shader del modelo completo o mallas específicas
function updateModelShader(shaderName) {
    // Itera sobre meshShaderMap para encontrar y aplicar el shader solo a las mallas especificadas
    Object.keys(meshShaderMap).forEach(meshId => {
      
    // Si coincide, aplica el shader solo a esta malla
    applyShaderToMultipleMeshes([meshId], shaderName);
      

  });}

createMeshColorControls();

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
              vertexShader: shader.vertexShader,
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