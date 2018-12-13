let clock = new THREE.Clock();

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

const bpm = 500; //90BPM

let loader = new THREE.GLTFLoader();

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const port = new SerialPort('/dev/cu.usbmodem14101', {
  baudRate: 9600
});
let playing = false;
const portBlokken = new SerialPort('/dev/cu.usbmodem14201', {
  baudRate: 9600
});
let recording = false;
let recordingCountdownSeconds = 4;
let secondsLeft = recordingCountdownSeconds;
let refreshIntervalId = null;
let playSounds = null;
let recordedSounds = [new Audio('./assets/sounds/hi-hat.wav'), new Audio('./assets/sounds/low-hat.wav'), new Audio('./assets/sounds/clap.wav'), new Audio('./assets/sounds/kick.wav')];
let placedBlocks = [
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
]
const blocks = 8;
const rows = 4;
let currentBlock = 0;

let playingBlock, playingRow;

const canvasUi = document.querySelector(`.canvas__game__ui`);
const startScreen = document.querySelector(`.canvas__boot`);
const tableUI = document.querySelector(`.table`);
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
      startScreen.style.visibility = `hidden`;
      startScreen.style.opacity = `0`;
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

    //Fill UI with colors
    let uiRows = document.querySelectorAll(`.table__row`);
    let uiCellsinRows = uiRows[keys[0]].querySelectorAll('.table__cell');
    if (value === 0) {
      uiCellsinRows[keys[1]].classList.remove(`blockinside`);
    } else if (value === 1) {
      uiCellsinRows[keys[1]].classList.add(`blockinside`);
    }

    //Get placed blocks & add Object
    placedBlocks[keys[0]][keys[1]] = value;
    console.log(`ROW ${keys[0]}: BLOCK ${keys[1]} - ON/OFF: ${value}`);

    let objectType;
    if (keys[0] == 0) {
      objectType = `cloud`;
      if (value === 1) {
        createObjects(objectType, keys[1])
      } else {
        deleteObject(objectType, keys[1])
      }
    } else if (keys[0] == 1) {
      objectType = `flower`;
      if (value === 1) {
        createObjects(objectType, keys[1])
      } else {
        deleteObject(objectType, keys[1])
      }
    } else if (keys[0] == 2) {
      objectType = `tree`
      if (value === 1) {
        createObjects(objectType, keys[1])
      } else {
        deleteObject(objectType, keys[1])
      }
    } else if (keys[0] == 3) {
      objectType = `mountain`
      if (value === 1) {
        createObjects(objectType, keys[1])
      } else {
        deleteObject(objectType, keys[1])
      }
    }
  }

  console.log(`Placed Blocks: `, placedBlocks);
}

const startRecordHandler = (key) => {
  clearInterval(playSounds);
  playSounds = null;
  recording = true;
  let buttonId = parseInt(key.replace('button-', ''));
  canvasUi.innerHTML = `<div class='ui__countdown__container'><div class='countdown__timer'><h2>Maak een geluid of zeg iets in...</h2><p class='ui__countdown'>4</p></div></div>`;

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
        console.log(recordedSounds);
        console.log(buttonId);
        console.log(recordedSounds[parseInt(buttonId)].play())
      });

      setTimeout(() => {
        mediaRecorder.stop();
        console.log(`stopped`);
        startPlaying();
        scriptProcessor.onaudioprocess = null;
        // renderBars(bars);
      }, 500);
    });
}

const playCurrentColumn = (currentBlock) => {
  for (let currentRow = 0; currentRow < rows; currentRow++) {
    let uiRows = document.querySelectorAll(`.table__row`);
    let uiCellsinRows = uiRows[currentRow].querySelectorAll('.table__cell');
    for (let j = 0; j < blocks; j++) {
      uiCellsinRows[j].classList.remove('active');
    }
    uiCellsinRows[currentBlock].classList.add('active');
    if (placedBlocks[currentRow][currentBlock] === 1) {
      let uiRows = document.querySelectorAll(`.table__row`);
      let uiCellsinRows = uiRows[currentRow].querySelectorAll('.table__cell');
      uiCellsinRows[currentBlock].classList.add('active')
      if (recordedSounds[currentRow] !== null) {
        console.log(`PLAYING WITH SOUND${currentBlock} + ${currentRow}`);
        recordedSounds[currentRow].play();
      }
      console.log(`PLAYING ${currentBlock} + ${currentRow}`);
      playingRow = currentRow;
      playingBlock = currentBlock;
      //transoformObj(currentRow, currentBlock);
    } else {
      console.log(`NOT PLAYING: ${currentBlock} + ${currentRow}`);
    }
  }
}

const startPlaying = () => {
  startScreen.style.visibility = `hidden`;
  startScreen.style.opacity = `0`;
  tableUI.style.visibility = `visible`;
  tableUI.style.opacity = `1`;
  playSounds = setInterval(() => {
    playCurrentColumn(currentBlock);
    console.log(currentBlock);
    if (currentBlock < blocks-1) {
      currentBlock++;
    } else {
      currentBlock = 0;
    }
  }, bpm); //90BPM
}

const stopPlaying = () => {
  clearInterval(playSounds);
  playSounds = null;
  recordedSounds = [new Audio('./assets/sounds/hi-hat.wav'), new Audio('./assets/sounds/low-hat.wav'), new Audio('./assets/sounds/clap.wav'), new Audio('./assets/sounds/kick.wav')];
  startScreen.style.visibility = `visible`;
  startScreen.style.opacity = `1`;
  tableUI.style.visibility = `hidden`;
  tableUI.style.opacity = `0`;

}

const init = () => {
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
  loader.load('./assets/models/island/island.gltf', function ( gltf ) {
    console.log(`loaded: `, gltf.scene.children[0]); 
    scene.add(gltf.scene.children[0]);      
  }, undefined, function ( error ) {
    console.error(`Not loaded:`, error );
  });    
};

const createObjects = (objectType, block) => {
  const objType = [`small`, `med`, `large`];

  loader.load(`./assets/models/${objectType}/${objectType}-${objType[Math.floor(Math.random() * 3)]}.gltf`, function ( gltf ) {
    let item = gltf.scene.children[0];
    item.position.x = Math.floor(Math.random() * (-4)) + 4;
    item.position.z = Math.floor(Math.random() * (-4)) + 4;
    item.position.y = 2;
    item.name = `${objectType}-${block}`
    console.log(`Add: `, item);
    scene.add(item);
  })
}

const deleteObject = (objectType, block) => {
  console.log(objectType, block);
  let item = scene.getObjectByName(`${objectType}-${block}`);
  console.log(`Remove: `, item);
  scene.remove(item);
}

const loop = () => {
  requestAnimationFrame(loop);
  controls.update();

  if (playingBlock != undefined && playingRow != undefined) {
    transoformObj();
  }

  renderer.render(scene, camera);
  
};

const transoformObj = () => {
  //
  let block = playingBlock;
  let row = playingRow;

  const objType = [`mountain`, `tree`, `flower`, `cloud`];
  let object = scene.getObjectByName(`${objType[row]}-${block}`);
  
  let t = clock.getElapsedTime();
  if (t >= 2.5)
  {
    clock = new THREE.Clock();
    object.scale.set(1,1,1);
  }
  else
  {
    object.scale.z = 0+(t/.500) / 2;
  }
};

init();
