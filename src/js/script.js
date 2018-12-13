
let scene,
  WIDTH,
  HEIGHT,
  camera,
  controls,
  fieldOfView,
  aspectRatio,
  nearPlane,
  farPlane,
  renderer,
  container;

let shadowLight, ambientLight;

const bpm = 667; //90BPM

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const port = new SerialPort('/dev/cu.usbmodem14201', {
  baudRate: 9600
});
let playing = true;
const portBlokken = new SerialPort('/dev/cu.usbmodem14101', {
  baudRate: 9600
});
let recording = false;
let recordingCountdownSeconds = 4;
let secondsLeft = recordingCountdownSeconds;
let refreshIntervalId = null;
let playSounds = null;
let recordedSounds = [null, null, null, null];
let placedBlocks = [
  [1,0,1,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
]
const steps = 8;
const rows = 4;
let currentStep = 0;
const canvasUi = document.querySelector(`.canvas__game__ui`);
const parser = port.pipe(new Readline({ delimiter: '\r\n' }));
const parserBlokken = portBlokken.pipe(new Readline( { delimiter: '\r\n' }));

// An instance of AudioContext
const audioContext = new AudioContext();

// This will become our input MediaStreamSourceNode
let input = null;

// This will become our AnalyserNode
let analyser = null;

// This will become our ScriptProcessorNode
let scriptProcessor = null;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.


parser.on('data', (data) => {
  let dataconvert = JSON.parse(data.toString());
  if (Object.keys(dataconvert)[0] === 'button-4') {
    playing = !playing;
    if (playing) {
      console.log('started');
      startPlaying();
    } else {
      console.log('stopped');
      stopPlaying();
    }
  } else {
    if (recording === false) {
      startRecordHandler(Object.keys(dataconvert)[0]);
    } else {
      console.log(`already recording something`);
    }
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
    let rowsss = document.querySelectorAll(`.table__row`);
    let cellsInRow = rowsss[keys[0]].querySelectorAll('.table__cell');
    if (value === 0) {
      cellsInRow[keys[1]].classList.remove(`blockinside`);
    } else if (value === 1) {
      cellsInRow[keys[1]].classList.add(`blockinside`);
    }
    console.log(`ROW ${keys[0]}: BLOCK ${keys[1]} - ON/OFF: ${value}`);
    let type;
    if (keys[0] == 0) {
      console.log(`Mountains`);
      type = `mountain`;
      if (value === 1) {
        console.log(`Create Mountain nr:`, keys[1]);
        createObjects(type, keys[1])
      } else {
        console.log(`Remove Mountain nr:`, keys[1]);
        deleteObject(type, keys[1])
      }
    } else if (keys[0] == 1) {
      console.log(`Trees`)
      type = `tree`;
      if (value === 1) {
        console.log(`Create Tree nr:`, keys[1]);
        createObjects(type, keys[1])
      } else {
        console.log(`Remove Tree nr:`, keys[1]);
        deleteObject(type, keys[1])
      }
    } else if (keys[0] == 2) {
      console.log(`Flowers`)
      type = `flower`
      if (value === 1) {
        console.log(`Create Flower`);
        createObjects(type, keys[1])
      } else {
        console.log(`Remove Flower`);
        deleteObject(type, keys[1])
      }
    } else if (keys[0] == 3) {
      console.log(`Clouds`)
      type = `cloud`
      if (value === 1) {
        console.log(`Create Cloud`);
        createObjects(type, keys[1])
      } else {
        console.log(`Remove Cloud`);
        deleteObject(type, keys[1])
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

  // waveform.style.visibility = `visible`;
  // waveform.style.opacity = `1`;

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
      // scriptProcessor.onaudioprocess = processInput;

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
        // waveform.style.visibility = `hidden`;
        // waveform.style.opacity = `0`;
        console.log(recordedSounds);
        console.log(buttonId);
        console.log(recordedSounds[parseInt(buttonId)].play())
      });

      setTimeout(() => {
        mediaRecorder.stop();
        console.log(`stopped`);
        // bars = [];
        scriptProcessor.onaudioprocess = null;
        // renderBars(bars);
      }, 1000);
    });
}

const playCurrentColumn = (step) => {
  //console.log(scene.getObjectByName('mountain- '));
  for (let i = 0; i < rows; i++) {
    let rowsss = document.querySelectorAll(`.table__row`);
    let cellsInRow = rowsss[i].querySelectorAll('.table__cell');
    for (let j = 0; j < steps; j++) {
      cellsInRow[j].classList.remove('active');
    }
    cellsInRow[step].classList.add('active');
    if (placedBlocks[i][step] === 1) {
      let rowsss = document.querySelectorAll(`.table__row`);
      let cellsInRow = rowsss[i].querySelectorAll('.table__cell');
      cellsInRow[step].classList.add('active')
      if (recordedSounds[i] !== null) {
        console.log(`PLAYING WITH SOUND${step} + ${i}`);
        recordedSounds[i].play();
      }
      console.log(`PLAYING ${step} + ${i}`);
      transoformObj(i, step);
    } else {
      console.log(`NOT PLAYING: ${step} + ${i}`);
    }
  }
}

const startPlaying = () => {
  playSounds = setInterval(() => {
    playCurrentColumn(currentStep);
    console.log(currentStep);
    if (currentStep < steps-1) {
      currentStep++;
    } else {
      currentStep = 0;
    }
<<<<<<< Updated upstream
  }, bpm); //90BPM
=======
  }, 500);
>>>>>>> Stashed changes
}

const stopPlaying = () => {
  clearInterval(playSounds);
  playSounds = null;
}

const init = () => {
  startPlaying();
  createScene();
  createLights();
  createWorld();
  createObjects(`mountain`, 0);
  createObjects(`mountain`, 2);
  loop();
  console.log(`hello world`);
};

const createScene = () => {
  WIDTH = window.innerWidth;
  HEIGHT = window.innerHeight;

  scene = new THREE.Scene();
  aspectRatio = WIDTH / HEIGHT;
  fieldOfView = 60;
  nearPlane = 1;
  farPlane = 1000;

  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
  );

  controls = new THREE.OrbitControls(camera)

  camera.position.set(11,5,11);

  camera.lookAt(new THREE.Vector3(0,0,0));

  controls.autoRotate = true;
  controls.autoRotateSpeed = 5;
  controls.update();

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
    item.position.x = Math.floor(Math.random() * (-4)) + 4;
    item.position.z = Math.floor(Math.random() * (-4)) + 4;
    item.position.y = 2;
    item.name = `${type}-${block}`
    console.log(`Add: `, item);
    scene.add(item);
  })
}

const deleteObject = (type, block) => {
  console.log(type, block);
  let item = scene.getObjectByName(`${type}-${block}`);
  console.log(`Remove: `, item);
  scene.remove(item);
}

const loop = () => {
  requestAnimationFrame(loop);
  controls.update();
  renderer.render(scene, camera);
};

const transoformObj = (row, block) => {
  let clock = new THREE.Clock();

  const objType = [`mountain`, `tree`, `flower`, `cloud`];
  let object = scene.getObjectByName(`${objType[row]}-${block}`);
  console.log(object.scale);
  
  
  var t = clock.getElapsedTime();
  
  if (t >= .667)
  {
    clock = new THREE.Clock;
    object.scale.set(1,1,1);
  }
  else
  {
    object.scale.z = 1+(t/.667);
  }
};

init();
