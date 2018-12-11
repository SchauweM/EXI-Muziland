let scene,
  WIDTH,
  HEIGHT,
  camera,
  fieldOfView,
  aspectRatio,
  nearPlane,
  farPlane,
  renderer,
  container;

let shadowLight, ambientLight;

const init = () => {
  createScene();
  createLights();
  createObjects();
  loop();
  console.log(`hello world`);
};

const createScene = () => {
  WIDTH = window.innerWidth;
  HEIGHT = window.innerHeight;

  scene = new THREE.Scene();
  aspectRatio = WIDTH / HEIGHT;
  fieldOfView = 60;
  nearPlane = 10;
  farPlane = 10000;

  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
  );

  camera.position.set(11,5,11);

  camera.lookAt(new THREE.Vector3(0,0,0));

  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
  });

  renderer.physicallyCorrectLights = true;
  renderer.gammaOutput = true;
  renderer.gammaFactor = 2.2;
  renderer.setClearColor( 0xcccccc );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize(WIDTH, HEIGHT);

  container = document.getElementById(`world`);
  container.appendChild(renderer.domElement);
  window.addEventListener(`resize`, handleWindowResize, false);

};

const handleWindowResize = () => {
  // update height and width of the renderer and the camera
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
};

const createLights = () => {
  // A directional light shines from a specific direction.
  // It acts like the sun, that means that all the rays produced are parallel.
  shadowLight = new THREE.DirectionalLight(0xffffff, 1.7);

  ambientLight = new THREE.AmbientLight(0xffffff, .11)
  // to activate the lights, just add them to the scene
  scene.add(shadowLight);
  scene.add(ambientLight);
};

const createObjects = () => {
  //Inits GLTFLoader
  let loader = new THREE.GLTFLoader();

  loader.load('./assets/models/island/island.gltf', function ( island ) {
    console.log(`loaded: `, island);  
    scene.add( island.scene );    
  }, undefined, function ( error ) {
    console.error(`Not loaded:`, error );
  });

  loader.load('./assets/models/three-big/three-big.gltf', function ( threeBig ) {
    console.log(`loaded: `, threeBig);  
    scene.add( threeBig.scene );    
  }, undefined, function ( error ) {
    console.error(`Not loaded:`, error );
  });
};

const loop = () => {
  requestAnimationFrame(loop);
  renderer.render(scene, camera);
};

init();