// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const port = new SerialPort('/dev/cu.usbmodem14101', {
  baudRate: 1000000
});
let recording = false;
let recordingCountdownSeconds = 4;
let secondsLeft = recordingCountdownSeconds;
let refreshIntervalId = null;
let recordedSounds = [];
let canvasUi = document.querySelector(`.canvas__ui`);
const parser = port.pipe(new Readline({ delimiter: '\r\n' }));
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.

parser.on('data', function (data) {
  let dataconvert = JSON.parse(data.toString());
  if (recording === false) {
    startRecordHandler(Object.keys(dataconvert)[0]);
  } else {
    console.log(`already recording something`);
  }
});

const startRecordHandler = (key) => {
  recording = true;
  buttonId = parseInt(key.replace('button-', ''));
  canvasUi.innerHTML = "<div class='countdown__timer'><h2>Recording audio:</h2><p class='ui__countdown'></p></div>";
  canvasUi.style.visibility = "visible";
  canvasUi.style.opacity = "1";
  refreshIntervalId = setInterval(() => {
    countDownTimer(buttonId)
  }, 1000);
}

const countDownTimer = (buttonId) => {
  secondsLeft -= 1;
  console.log(secondsLeft);
  document.querySelector(`.ui__countdown`).innerHTML = secondsLeft;
  if (secondsLeft === 0) {
    clearInterval(refreshIntervalId);
    refreshIntervalId = null;
    secondsLeft = recordingCountdownSeconds;
    startRecording(buttonId);
  }
}

const startRecording = (buttonId) => {
  navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {

    createWaveSurfer(stream);
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();

    const audioChunks = [];
    mediaRecorder.addEventListener("dataavailable", event => {
      audioChunks.push(event.data);
    });

    mediaRecorder.addEventListener("stop", () => {
      const audioBlob = new Blob(audioChunks);
      const audioUrl = URL.createObjectURL(audioBlob);
      recordedSounds[buttonId] = new Audio(audioUrl);
      recording = false;
      canvasUi.style.visibility = "hidden";
      canvasUi.style.opacity = "0";
    });

    setTimeout(() => {
      mediaRecorder.stop();
      destroyWaveSurfer();
    }, 3000);
  });
}

let wave;
let micContext;
let mediaStreamSource;
let levelChecker;

const createWaveSurfer = (stream) => {

    if (wave)
        wave.destroy();

    var wave = WaveSurfer.create({
        container: '#waveform',
        waveColor: '#FFF',
        barHeight: 10,
        hideScrollbar: true,
        audioRate: 1,
        barWidth: 1,
        interact: false,
    });

    micContext = wave.backend.getAudioContext();
    mediaStreamSource = micContext.createMediaStreamSource(stream);
    levelChecker = micContext.createScriptProcessor(4096, 1, 1);

    mediaStreamSource.connect(levelChecker);
    levelChecker.connect(micContext.destination);

    levelChecker.onaudioprocess = function (event) {
        wave.empty();
        wave.loadDecodedBuffer(event.inputBuffer);
    };
};

const destroyWaveSurfer = () => {

    if (wave) {
        wave.destroy();
        wave = undefined;
    }

    if (mediaStreamSource) {
        mediaStreamSource.disconnect();
        mediaStreamSource = undefined;
    }

    if (levelChecker) {
        levelChecker.disconnect();
        levelChecker.onaudioprocess = undefined;
        levelChecker = undefined;
    }
};

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
  document.querySelector(`.canvas__wrapper`).appendChild(renderer.domElement);
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