const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const port = new SerialPort('/dev/cu.usbmodem14201', {
  baudRate: 1000000
});
const portBlokken = new SerialPort('/dev/cu.usbmodem14101', {
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
let playSounds = null;
const rows = 4;
let currentStep = 0;
let canvasUi = document.querySelector(`.canvas__ui`);
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
const barColor = '#000';

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
    console.log(`${keys[0]} : ${keys[1]} - ${value}`);
  }
}

const startRecordHandler = (key) => {
  recording = true;
  let buttonId = parseInt(key.replace('button-', ''));
  canvasUi.innerHTML = '<div class="countdown__timer"><h2>Recording audio:</h2><p class="ui__countdown"></p></div>';
  canvasUi.style.visibility = 'visible';
  canvasUi.style.opacity = '1';
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
      mediaRecorder.addEventListener('dataavailable', event => {
        audioChunks.push(event.data);
      });

      mediaRecorder.addEventListener('stop', () => {
        const audioBlob = new Blob(audioChunks);
        const audioUrl = URL.createObjectURL(audioBlob);
        recordedSounds[buttonId] = new Audio(audioUrl);
        recording = false;
        canvasUi.style.visibility = 'hidden';
        canvasUi.style.opacity = '0';
        console.log(recordedSounds);
        console.log(buttonId);
        console.log(recordedSounds[parseInt(buttonId)].play())
      });

      setTimeout(() => {
        mediaRecorder.stop();
        drawing = false;
        console.log('stopped');
        bars = [];
        scriptProcessor.onaudioprocess = null;
        renderBars(bars);
      }, 1000);
    });
}

const playCurrentColumn = (step) => {
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
  playSounds = setInterval(() => {
    playCurrentColumn(currentStep);
    console.log(currentStep);
    if (currentStep < steps) {
      currentStep++;
    } else {
      currentStep = 0;
    }
  }, 1000);
}

const stopPlaying = () => {
  clearInterval(playSounds);
  playSounds = null;
}

const processInput = () => {  
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

startPlaying();