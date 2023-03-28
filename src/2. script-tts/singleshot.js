'use strict';

// DO this to set key location
// export GOOGLE_APPLICATION_CREDENTIALS="/Users/${USER}/key.json"

process.env.GOOGLE_APPLICATION_CREDENTIALS = "/Users/T-rav/key.json";
const fs = require('fs');
const duration = require("wav-audio-length").default;

async function synthesize(input, fileName) {
  const textToSpeech = require('@google-cloud/text-to-speech');
  const util = require('util');

  const client = new textToSpeech.TextToSpeechClient();

  const request = {
    input: input,
    voice: {"languageCode": "en-US","name": "en-US-Neural2-J"},
    audioConfig: {
        "audioEncoding": "LINEAR16",
        "effectsProfileId": [
          "large-home-entertainment-class-device"
        ],
        "pitch": -1.2,
        "speakingRate": 1
      },
  };


  const [response] = await client.synthesizeSpeech(request);
  // Write the binary audio content to a local file
  const writeFile = util.promisify(fs.writeFile);
  await writeFile(fileName, response.audioContent, 'binary');

  // todo : get duration too
  const buffer = fs.readFileSync(fileName);
  const dur = parseInt(duration(buffer)*1000);

  console.log('Audio content written to file: ' + fileName + ' with duration of ' + dur);
}

async function synthesizeSSML(text, fileName){
    await synthesize({ssml: text}, fileName);
}

async function synthesizeText(text, fileName){
    await synthesize({text: text}, fileName)
}

// todo : make this read a specific directy which contains the segmented script and writes out the mp3 files with the same name
const textSegment = fs.readFileSync('text.txt', 'utf8');
synthesizeText(textSegment, 'text.mp3');

// const ssmlSegment = fs.readFileSync('ssml.txt', 'utf8');
// synthesizeSSML(ssmlSegment, 'ssml.mp3');