const C = require("construct-js");
const fs = require("fs");
const path = require('path');
const {PythonShell} = require('python-shell');

const sampleRate = 44100; //44100 standard
const numChannels = 1;
const bitsPerSample = 16; // TODO make this not hardcoded in. also would have to change U16 - probs diff library or code it yourself
const totalSeconds = 6;
const absoluteMax = 2 ** (bitsPerSample - 1) - 1;

const riffChunkStruct = C.Struct("riffChunk")
  .field("magic", C.RawString("RIFF"))
  .field("size", C.U32(0, C.Endian.Little)) // size of our file (unknown at first)
  .field("fmtName", C.RawString("WAVE"));

const fmtSubChunkStruct = C.Struct("fmtSubChunk")
  .field("id", C.RawString("fmt "))
  .field("subChunk1Size", C.U32(0, C.Endian.Little)) // subchunk size is unknown now
  .field("audioFormat", C.U16(1, C.Endian.Little)) // audio format - 1 is pulse code modulation
  .field("numChannels", C.U16(numChannels, C.Endian.Little)) // for stereo make it 2
  .field("sampleRate", C.U32(sampleRate, C.Endian.Little)) // sample rate
  .field(
    "byteRate",
    C.U32((sampleRate * numChannels * bitsPerSample) / 8, C.Endian.Little)
  ) // with 16 bit samples, samplerate * 2 for some reason
  .field(
    "blockAlign",
    C.U16((numChannels * bitsPerSample) / 8, C.Endian.Little)
  )
  .field("bitsPerSample", C.U16(bitsPerSample, C.Endian.Little));
const totalSubChunkSize = fmtSubChunkStruct.computeBufferSize();
fmtSubChunkStruct.get("subChunk1Size").set(totalSubChunkSize - 8);

const dataSubChunkStruct = C.Struct("dataSubChunk")
  .field("id", C.RawString("data"))
  .field("size", C.U32(0, C.Endian.Little)) // we dont know yet
  .field("data", C.I16s([0], C.Endian.Little));

function getMaxVol(volume) {
    return Math.trunc((2 ** (bitsPerSample - 1) - 1) * volume); // should i minus 1 here?
}
function getMinVol(volume) {
    return -Math.trunc((2 ** (bitsPerSample - 1)) * volume);
}

function generateWave(waveType, pitch, volume, offset = 0) {
  /**
   * @param {Number} volume 0 to 1
   */
  const soundDat = [];
  // start with it low
  let maxVol = getMaxVol(volume);
  let minVol = getMinVol(volume);
  console.log(maxVol)
  let waveChunkLength = sampleRate / pitch;
  let yStep = 2 * maxVol / waveChunkLength;
  let sinePer = waveChunkLength / (2*Math.PI);
  function sawFunction(xStep) {
    let y = Math.round(xStep * yStep + minVol);
    if (y > absoluteMax) y = absoluteMax;
    else if (y < -absoluteMax - 1) y = -absoluteMax - 1;
    return y;
  }
  function sineFunction(xStep) {
    return Math.round(Math.sin(xStep / sinePer) * maxVol);
  }
  function noiseFunction(xStep) {
    let v = Math.floor((Math.random() * (maxVol + 1 - minVol) + minVol) * volume);
    return v;
  }
  for (let i = 0; i < Math.floor(totalSeconds * sampleRate); i++) {
    let x = Math.round(waveChunkLength * i) / Math.round(waveChunkLength) % Math.round(waveChunkLength) + offset;
    let y = 0;

    // other loop  here if u gonna do that
    if (waveType === "saw") y += sawFunction(x);
    else if (waveType === "sine") y += sineFunction(x);
    else if (waveType === "noise") y += noiseFunction(x);

    soundDat[i] = y;
  }
  return soundDat;
}

function addWavesToFirst(dat1, dat2) {
  dat2.map((v, i) => {
    dat1[i] += v;
    if (dat1[i] > absoluteMax) dat1[i] = absoluteMax;
    else if (dat1[i] < - absoluteMax - 1) dat1[i] = -absoluteMax - 1;
  });
}
// const soundData = generateWave("saw", 440, .5);
// const soundData = generateWave("noise", 440, .5);
// addWavesToFirst(soundData, generateWave("sine", 220, .5, 50))
let pyshell = new PythonShell("sniffer-test.py");
let soundDat = [];
pyshell.on("message", function(message) {
    if (soundDat.length > 500000) return;
    for (let i = 0; i < 100; i++)
    soundDat = soundDat.concat(basicBinaryConversion(message, .5));
    console.log(soundDat);
});
pyshell.end(function(err) {
    if (err) {
        throw err;
    }
    finalizeWav(soundDat);
})

function finalizeWav(soundDat) {
    dataSubChunkStruct.get("data").set(soundDat);
    dataSubChunkStruct
    .get("size")
    .set((soundDat.length * numChannels * bitsPerSample) / 8);

    const fileStruct = C.Struct("waveFile")
    .field("riffChunk", riffChunkStruct)
    .field("fmtSubChunk", fmtSubChunkStruct)
    .field("dataSubChunk", dataSubChunkStruct);



    fs.writeFileSync(path.join(__dirname, './new.wav'), fileStruct.toUint8Array());
}

function basicBinaryConversion(dat, volume) {
    let soundDat = [];
    let maxVol = getMaxVol(volume);
    let minVol = getMinVol(volume);
    for (const bit of dat) {
        if (bit === "0") {
            soundDat.push(minVol);
        }
        else {
            soundDat.push(maxVol);
        }
    }
    return soundDat;
}