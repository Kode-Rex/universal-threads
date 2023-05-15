'use strict';

// DO this to set key location
// export GOOGLE_APPLICATION_CREDENTIALS="/Users/${USER}/key.json"

const inboxDir = "../../inbox";
process.env.GOOGLE_APPLICATION_CREDENTIALS = "/Users/T-rav/key.json";
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

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
}

async function synthesizeText(text, fileName){
    await synthesize({text: text}, fileName)
}

// async function synthesizeSSML(text, fileName){
//     await synthesize({ssml: text}, fileName);
// }

function padLeadingZeros(num, size) {
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
}

function processThreadStories(thread){
    console.log('\x1b[33m%s\x1b[0m', `${thread.title}`, '\x1b[0m', ' has been selected.');

    const leadingZeros = 4;
    const dirPath = `${inboxDir}/${thread.id}/audio/`;

    let filePath = `${dirPath}/000-000-000-title.wav`;
    fs.mkdir(dirPath, {recursive:true}, async err=>{
        if(err) throw err;

        await synthesizeText(thread.title, filePath);
        thread.filePath = filePath;

        for(var storyIdx = 0; storyIdx < thread.stories.length; storyIdx++){
            let story = thread.stories[storyIdx];
            let filePath = `${dirPath}/000-${story.seq}-000-story.wav`;

            console.log(`Processing Story #${story.seq+1} ... `);
            await synthesizeText(`Story ${story.seq+1}`, filePath);
            story.storyFilePath = filePath;

            let storyFilePath = `${dirPath}/${padLeadingZeros(story.seq, leadingZeros)}-fullText.wav`
            await synthesizeText(`${story.fullText}`, storyFilePath);
            story.filePath = storyFilePath;

            thread.stories[storyIdx] = story;
        }

        // write the fileout
        const contextDirPath = `../../inbox/${thread.id}`;
        const fileName = `${contextDirPath}/context.json`;

        fs.writeFile(fileName, JSON.stringify(thread), err => {
            if(err){
                console.error(err);
            }

            console.log(`updated context to ${fileName}`);
        });
    });
}

const readline = require('readline');

let r1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const allThreadsInprogress = [];
const allInboxItems = fs.readdirSync(inboxDir);
allInboxItems.forEach(function(file){
    let inboxPath = `${inboxDir}/${file}`;
    if(fs.statSync(inboxPath).isDirectory()){
        let context = `${inboxPath}/context.json`;
        if(fs.existsSync(context)){
            let contextObject = JSON.parse(fs.readFileSync(context));
            allThreadsInprogress.push(contextObject);
        }
    }
});

let threadCounter = 1;
allThreadsInprogress.forEach(function(thread){
    console.log('\x1b[33m%s\x1b[0m', `${threadCounter}) ${thread.title}`, '\x1b[0m');
    threadCounter++;
});

console.log('\x1b[33m%s\x1b[0m', `q) quit the program`, '\x1b[0m');

r1.question('Which story do you wish to record the speach for: ', function(key){
    if(key === 'q'){
        console.log("goodbye");
        process.exit();
    }

    r1.close();
    let num = parseInt(key);

    if(num > 0 && num <= allThreadsInprogress.length){
        const post = allThreadsInprogress[num-1];
        processThreadStories(post);
    }else{
        console.log('\x1b[31m','Please make a selection from the topic numbers listed above or q to quit', '\x1b[0m');
    }
});
