
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

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const port = new SerialPort('/dev/cu.usbmodem143220', {
  baudRate: 9600
});
const portBlokken = new SerialPort('/dev/cu.usbmodem143230', {
  baudRate: 9600
});
let recording = false;
let recordingCountdownSeconds = 4;
let secondsLeft = recordingCountdownSeconds;
let refreshIntervalId = null;
let recordedSounds = [null, null, null, null];
let placedBlocks = [
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
]
const steps = 8;
const rows = 4;
let currentStep = 0;
const canvasUi = document.querySelector(`.canvas__game__ui`);
const waveform = document.querySelector(`.waveform`);
const parser = port.pipe(new Readline({ delimiter: '\r\n' }));
const parserBlokken = portBlokken.pipe(new Readline( { delimiter: '\r\n' }));

// setting vars bars
// We'll store the value of te bars we want to draw in here
let bars = []

// An instance of AudioContext
const audioContext = new AudioContext();

// This will become our input MediaStreamSourceNode
let input = null;

// This will become our AnalyserNode
let analyser = null;

// This will become our ScriptProcessorNode
let scriptProcessor = null;

// Canvas related variables
const barWidth = 2;
const barGutter = 2;
const barColor = `#fff`;

let canvas = null;
let canvasContext = null;
let width = 0;
let height = 0;
let halfHeight = 0;
let drawing = false;

canvas = document.querySelector('canvas');
canvasContext = canvas.getContext('2d');

// Set the dimensions
width = canvas.offsetWidth;
height = canvas.offsetHeight;
halfHeight = height / 2;

// Set the size of the canvas context to the size of the canvas element
canvasContext.canvas.width = width;
canvasContext.canvas.height = height;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.


parser.on('data', (data) => {
  let dataconvert = JSON.parse(data.toString());
  console.log(dataconvert);
  if (recording === false) {
    startRecordHandler(Object.keys(dataconvert)[0]);
  } else {
    console.log(`already recording something`);
  }
});

parserBlokken.on('data', (data) => {
  let dataconvert = JSON.parse(data.toString());
  changeBlock(dataconvert);
})

const changeBlock = (data) => {
  for (let i = 0; i < Object.keys(data).length; i++) {
    const keys = Object.keys(data)[i].split(':');
    const value = data[Object.keys(data)[i]];
    placedBlocks[keys[0]][keys[1]] = value;
    // console.log(`ROW ${keys[0]}: BLOCK ${keys[1]} - ON/OFF: ${value}`);
    let type;
    if (keys[0] == 0) {
      console.log(`Mountains`);
      type = `mountain`;
      if (value === 1) {
        console.log(`Create Mountain nr:`, keys[1]);
        createObjects(type, keys[1])
      } else {
        console.log(`Remove Mountain nr:`, keys[1]);
        deleteObject((type, keys[1]))
      }
    } else if (keys[0] == 1) {
      console.log(`Threes`)
      type = `tree`;
      if (value === 1) {
        console.log(`Create Three nr:`, keys[1]);
        createObjects(type, keys[1])
      } else {
        console.log(`Remove Three nr:`, keys[1]);
        deleteObject((type, keys[1]))
      }
    } else if (keys[0] == 2) {
      console.log(`Flowers`)
      type = `flower`
      if (value === 1) {
        console.log(`Create Flower`);
        createObjects(type, keys[1])
      } else {
        console.log(`Remove Flower`);
        deleteObject((type, keys[1]))
      }
    } else if (keys[0] == 3) {
      console.log(`Clouds`)
      type = `flower`
      if (value === 1) {
        console.log(`Create Cloud`);
        createObjects(type, keys[1])
      } else {
        console.log(`Remove Cloud`);
        deleteObject((type, keys[1]))
      }
    }
    //createTree();
  }
  console.log(`Placed Blocks: `, placedBlocks);
  // console.log(data);
}

const startRecordHandler = (key) => {
  recording = true;
  let buttonId = parseInt(key.replace('button-', ''));
  canvasUi.innerHTML = `<div class='ui__countdown__container'><div class='countdown__timer'><h2>Maak een geluid in...</h2><p class='ui__countdown'>4</p></div></div>`;

  waveform.style.visibility = `hidden`;
  waveform.style.opacity = `1`;

  canvasUi.style.visibility = `visible`;
  canvasUi.style.opacity = `1`;

  refreshIntervalId = setInterval(() => {
    countDownTimer(buttonId)
  }, 1000);
}

const countDownTimer = (buttonId) => {
  secondsLeft -= 1;
  console.log(secondsLeft);
  document.querySelector(`.ui__countdown`).innerHTML = secondsLeft;
  if (secondsLeft === 0) {
    document.querySelector(`.ui__countdown`).innerHTML = `Nu!`;
    clearInterval(refreshIntervalId);
    refreshIntervalId = null;
    secondsLeft = recordingCountdownSeconds;
    startRecording(buttonId);
  }
}

const startRecording = (buttonId) => {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {

      input = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      scriptProcessor = audioContext.createScriptProcessor();

      analyser.smoothingTimeConstant = 0.3;
      analyser.fftSize = 1024;

      // Connect the audio nodes
      input.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(audioContext.destination);

      // Add an event handler
      scriptProcessor.onaudioprocess = processInput;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.start();

      const audioChunks = [];
      mediaRecorder.addEventListener(`dataavailable`, event => {
        audioChunks.push(event.data);
      });

      mediaRecorder.addEventListener(`stop`, () => {
        const audioBlob = new Blob(audioChunks);
        const audioUrl = URL.createObjectURL(audioBlob);
        recordedSounds[buttonId] = new Audio(audioUrl);
        recording = false;
        canvasUi.style.visibility = `visible`;
        canvasUi.style.opacity = `0`;
        waveform.style.visibility = `hidden`;
        waveform.style.opacity = `0`;
        console.log(recordedSounds);
        console.log(buttonId);
        console.log(recordedSounds[parseInt(buttonId)].play())
      });

      setTimeout(() => {
        mediaRecorder.stop();
        isRecording = false;
        drawing = false;
        console.log(`stopped`);
        bars = [];
        scriptProcessor.onaudioprocess = null;
        renderBars(bars);
      }, 1000);
    });
}

const playCurrentColumn = (step) => {
  //console.log(scene.getObjectByName('mountain- '));
  for (let i = 0; i < rows; i++) {
    if (placedBlocks[i][step] === 1) {
      if (recordedSounds[i] !== null) {
        console.log(`playing ${step} + ${i}`);
        recordedSounds[i].play();
      }
    } else {
      console.log(`no sound: ${step} + ${i}`);
    }
  }
}

const startPlaying = () => {
  const playSounds = setInterval(() => {
    playCurrentColumn(currentStep);
    console.log(currentStep);
    if (currentStep < steps) {
      currentStep++;
    } else {
      currentStep = 0;
    }
  }, 1000);
}

// const init = () => {
//   startPlaying();
//   // Create the scene and set the scene size.
// }

const processInput = audioProcessingEvent => {  
  // Create a new Uint8Array to store the analyser's frequencyBinCount 
  const tempArray = new Uint8Array(analyser.frequencyBinCount);

  // Get the byte frequency data from our array
  analyser.getByteFrequencyData(tempArray);
    
  // Calculate the average volume and store that value in our bars Array
  bars.push(getAverageVolume(tempArray));

  // Render the bars
  renderBars(bars);
}

const getAverageVolume = array => {    
  const length = array.length;
  let values = 0;
  let i = 0;

  // Loop over the values of the array, and count them
  for (; i < length; i++) {
    values += array[i];
  }

  // Return the avarag
  return values / length;
}

const renderBars = () => {  
  if (!drawing) {
    drawing = true;

    window.requestAnimationFrame(() => {
      canvasContext.clearRect(0, 0, width, height);

      bars.forEach((bar, index) => {
        canvasContext.fillStyle = barColor;
                
        // Top part of the bar
        canvasContext.fillRect((index * (barWidth + barGutter)), (halfHeight - (halfHeight * (bar / 100))), barWidth, (halfHeight * (bar / 100)));

        // Bottom part of the bars
        canvasContext.fillRect((index * (barWidth + barGutter)), halfHeight, barWidth, (halfHeight * (bar / 100)));
      });

      drawing = false;
    });
  }
}

const init = () => {
  // startPlaying();
  createScene();
  createLights();
  createWorld();
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
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize(WIDTH, HEIGHT);

  container = document.getElementById(`game`);
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

  ambientLight = new THREE.AmbientLight(0xdc8874, .5)
  // to activate the lights, just add them to the scene
  scene.add(shadowLight);
  scene.add(ambientLight);
};

const createWorld = () => {
  //Inits GLTFLoader
  let loader = new THREE.GLTFLoader();

  loader.load('./assets/models/island/island.gltf', function ( gltf ) {
    console.log(`loaded: `, gltf.scene.children[0]); 
    scene.add(gltf.scene.children[0]);    
  }, undefined, function ( error ) {
    console.error(`Not loaded:`, error );
  });    
};

const createObjects = (type, block) => {
  const objType = [`small`, `med`, `large`];

  let loader = new THREE.GLTFLoader();
  
  loader.load(`./assets/models/${type}/${type}-${objType[Math.floor(Math.random() * 3)]}.gltf`, function ( gltf ) {
    let item = gltf.scene.children[0];
    item.position.x = Math.floor(Math.random() * (-5 - 8)) + 8;
    item.position.z = Math.floor(Math.random() * (-5 - 8)) + 8;
    item.name = `${type}-${block}`
    console.log(item.name);
    scene.add(item);
  })
}

const deleteObject = (type, block) => {
  let item = scene.getObjectByName(`${type}-${block}`);
  scene.remove(item);
}

const loop = () => {
  requestAnimationFrame(loop);
  renderer.render(scene, camera);
};

init();
