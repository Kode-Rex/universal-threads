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

function processThreadSegmentsForTTS(thread){
    console.log('\x1b[33m%s\x1b[0m', `${thread.title}`, '\x1b[0m', ' has been selected.');

    const leadingZeros = 4;
    const dirPath = `${inboxDir}/${thread.id}/audio/`;

    let filePath = `${dirPath}/000-000-000-title.wav`;
    fs.mkdir(dirPath, {recursive:true}, async err=>{
        if(err) throw err;
        await synthesizeText(thread.title, filePath);

        thread = processDuration(filePath, thread, false, false);

        for(var storyIdx = 0; storyIdx < thread.stories.length; storyIdx++){
            let story = thread.stories[storyIdx];
            let filePath = `${dirPath}/000-${story.seq}-000-story.wav`;
            await synthesizeText(`Story ${story.seq+1}`, filePath);

            console.log(`Processing Story #${story.seq+1} ...`);

            story = processDuration(filePath, story, false, false);
            let storyFilePath = `${dirPath}/${padLeadingZeros(story.seq, leadingZeros)}-fullText.wav`
            await synthesizeText(story.fullText, storyFilePath);
            story.fullTextPath = storyFilePath;

            for(var ttsIdx = 0; ttsIdx < story.ttsSegments.length; ttsIdx++){
                let ttsSnippet = story.ttsSegments[ttsIdx];
                let filePath = `${dirPath}/${padLeadingZeros(story.seq, leadingZeros)}-${padLeadingZeros(ttsSnippet.seq,leadingZeros)}.wav`
                
                if(ttsSnippet.text){
                    await synthesizeText(ttsSnippet.text, filePath);

                    let trimEnd = false;
                    let trimStart = false;

                    if(ttsIdx < (story.ttsSegments.length - 1) ){
                        trimEnd = true;
                    }

                    if(ttsIdx > 0){
                        trimStart = true;
                    }

                    ttsSnippet = processDuration(filePath, ttsSnippet, trimEnd, trimStart);
                } 
                story.ttsSegments[ttsIdx] = ttsSnippet;  
            }
            thread.stories[storyIdx] = story;
        }

        // set totalDuration
        const threadTotalDuration = thread.duration 
                                    + thread.stories.map((story)=>{
                                                                    return story.duration 
                                                                           + story.ttsSegments.map((segment)=>{return segment.duration}).reduce((partialSum, a)=> partialSum+a, 0) 
                                                                  })
                                                    .reduce((partialSum, a) => partialSum+a, 0);
        thread.totalDuration = threadTotalDuration;

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

const duration = require("wav-audio-length").default;
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
        processThreadSegmentsForTTS(post);
    }else{
        console.log('\x1b[31m','Please make a selection from the topic numbers listed above or q to quit', '\x1b[0m');
    }
});

function processDuration(filePath, obj, trimEnd, trimStart) {
    const buffer = fs.readFileSync(filePath);
    const dur = parseInt(duration(buffer)*1000); // ms
    const cutAmtStart = 325; // ms
    const cutAmtEnd = 425; // ms 
    const tmpExt = 'new.wav';
    obj.filePath = filePath;

    if(trimEnd){
        const command = ffmpeg(filePath);

        if(!trimStart){
            obj.duration = (dur - cutAmtEnd);
            command.setDuration(`${obj.duration}ms`)
            .saveToFile(`${filePath}.${tmpExt}`)
            .on('end', function(){
                fs.renameSync(`${filePath}.${tmpExt}`, filePath);  
            });
        }else{
            obj.duration = (dur - (cutAmtStart+cutAmtEnd));
            command.setStartTime(`${cutAmtStart}ms`)
            .setDuration(`${obj.duration}ms`)
            .saveToFile(`${filePath}.${tmpExt}`)
            .on('end', function(){
                fs.renameSync(`${filePath}.${tmpExt}`, filePath);  
            });
        }
    }else{
        obj.duration = dur;
    }

    return obj;
}
