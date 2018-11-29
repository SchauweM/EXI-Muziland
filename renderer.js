// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const port = new SerialPort('/dev/cu.usbmodem14201', {
  baudRate: 1000000
});
const parser = port.pipe(new Readline({ delimiter: '\r\n' }));
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.

parser.on('data', function (data) {
  let dataconvert = JSON.parse(data.toString());
  if (dataconvert["button-0"] == 1) {
    document.querySelector('.title').innerHTML = 'First button pressed';
  } else if (dataconvert["button-1"] == 1) {
    document.querySelector('.title').innerHTML = 'Second button pressed';
  } else if (dataconvert["button-2"] == 1) {
    document.querySelector('.title').innerHTML = 'Third button pressed';
  } else if (dataconvert["button-3"] == 1) {
    document.querySelector('.title').innerHTML = 'Fourth button pressed';
  }
});

// Set up the scene, camera, and renderer as global variables.
var scene, camera, renderer;

init();
animate();

// Sets up the scene.
function init() {
  // Create the scene and set the scene size.

  scene = new THREE.Scene();
  var WIDTH = window.innerWidth,
      HEIGHT = window.innerHeight;

  // Create a renderer and add it to the DOM.
  renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(WIDTH, HEIGHT);
  document.body.appendChild(renderer.domElement);
  renderer.domElement.id = "context"

  // Create a camera, zoom it out from the model a bit, and add it to the scene.
  camera = new THREE.PerspectiveCamera(45, WIDTH / HEIGHT, 0.1, 20000);
  camera.position.set(0,6,0);
  scene.add(camera);

  // Create a light, set its position, and add it to the scene.
  var light = new THREE.PointLight(0xffffff);
  light.position.set(-100,200,100);
  scene.add(light);

  // Add a white PointLight to the scene.
  var loader = new THREE.JSONLoader();
  loader.load( 'https://codepen.io/nickpettit/pen/nqyaK.js', function(geometry){
    var material = new THREE.MeshLambertMaterial({color: 0x55B663});
    mesh = new THREE.Mesh( geometry, material);
    scene.add(mesh);
  });

  // Add OrbitControls so that we can pan around with the mouse.
  controls = new THREE.OrbitControls(camera, renderer.domElement);
}

// Renders the scene and updates the render as needed.
function animate() {
  requestAnimationFrame( animate );
  renderer.render( scene, camera );
  controls.update();
}