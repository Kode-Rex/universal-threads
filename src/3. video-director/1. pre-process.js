
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const speech = require('@google-cloud/speech');
const {Storage} = require('@google-cloud/storage');
const { threadId } = require('worker_threads');
const { request } = require('https');

process.env.GOOGLE_APPLICATION_CREDENTIALS = "/Users/T-rav/key.json";
const INBOX_DIR = "../../inbox";
const BUCKET_NAME = "universal-threads";

// ------- MERGE AUDIO ------------
const context = JSON.parse(fs.readFileSync(`${INBOX_DIR}/test/context.json`));

const textFilters = [];
let filterStart = (context.duration / 1000); // allow for image to show in intro
// title, then each story's full text
const audioCommand = ffmpeg();
const fullAudioFile = `${INBOX_DIR}/test/audio/full-audio.wav`;
let fileCounter = 0;

console.log("START >> ");

audioCommand.mergeAdd(context.filePath);

context.stories.forEach((val, idx)=>{
    console.log(`Story [${idx}]`);


    audioCommand.mergeAdd(val.storyFilePath); // story #

    // todo: use -codec:a copy - for preview mode instead of -codec:v libx264 -crf 0 -preset veryslow
    const codec = `-codec:a copy`; // -codec:v libx264 -crf 18 -preset slow -vf
    // pushing story # text
    let betweenText = `between(t,${filterStart+0.25},${filterStart+(val.duration/1000)})`
    textFilters.push(`ffmpeg -i video/composed-test-${fileCounter}.mp4 -vf "drawtext=fontfile=BebasNeue-Regular.ttf:text='Story ${val.seq+1}':fontcolor=white:fontsize=72:box=1:boxcolor=blue@0.75:boxborderw=10:x=(main_w/2-text_w/2):y=50:enable='${betweenText}'" ${codec} video/composed-test-${fileCounter+1}.mp4`);
    fileCounter++;
    filterStart += ((val.duration/1000));
    audioCommand.mergeAdd(val.filePath); // story text


    // centering text with multiple draw text instances - I should be able to chain all the tts segments with this to bring down processing times
    // ffmpeg -f lavfi -i color=c=green:s=320x240:d=10 -vf "drawtext=fontfile=/path/to/font.ttf:fontsize=30:fontcolor=white:x=(w-text_w)/2:y=(h-text_h-text_h)/2:text='Stack',drawtext=fontfile=/path/to/font.ttf:fontsize=30:fontcolor=white:x=(w-text_w)/2:y=(h+text_h)/2:text='Overflow'" output.mp4
    
    // there is a like 25 ms drift per fragement
    val.ttsSegments.forEach((tts, idx)=>{
        console.log(`tts segment [${idx}]`);
        betweenText = `between(t,${filterStart},${filterStart+(tts.duration/1000)})`
        textFilters.push(`ffmpeg -i video/composed-test-${fileCounter}.mp4 -vf "drawtext=fontfile=BebasNeue-Regular.ttf:text='${tts.displayText.replace(/:/g, '').replace(/'/g,' ')}':shadowcolor='black':shadowx=2:shadowy=2:fontcolor=white:fontsize=72:x=(main_w/2-text_w/2):y=((main_h-text_h)/2):enable='${betweenText}'" ${codec} video/composed-test-${fileCounter+1}.mp4`);

        filterStart += tts.duration/1000;
        fileCounter++;
    });
});


// raw drawText input to ffmpeg
// ffmpeg -i inputClip.mp4 -vf "drawtext=text='My text starting at 640x360':x=640:y=360:fontsize=24:fontcolor=white" -c:a copy output.mp4

console.log('merging to file...');

audioCommand.mergeToFile(fullAudioFile).on('end',()=>{
    // process the text
    
    //  write out the commands to a run.sh to apply fitlers
    
    //fs.unlinkSync(`${inboxDir}/test/text-filters.sh`);
    fs.writeFileSync(`${INBOX_DIR}/test/video/apply-text-filters.sh`, '#!/bin/sh\n');
    textFilters.forEach((filter)=>{
        fs.appendFileSync(`${INBOX_DIR}/test/video/apply-text-filters.sh`, `${filter}\n`);
    });
     // -------- SET TEXT AND ADD AUDIO TRACK ---------
    const command = ffmpeg();
    command.input(`${INBOX_DIR}/test/06-pro-shredder.mp4`); //.input(`${inboxDir}/test/thread.png`);

    try{
        fs.mkdirSync(`${INBOX_DIR}/test/video/`);
    }catch(e){}

    command
    .addInput(`${INBOX_DIR}/test/audio/full-audio.wav`)
    .saveToFile(`${INBOX_DIR}/test/video/composed-test-0.mp4`)
    .on('end', async ()=> {
        // todo : now I need to send this to stt service to get word timeings
        // todo : then take those word timings and insert into the duration portion of the context to rebuild the video
        const gcsWaveFileName = `${context.id}-full-audio.wav`;

        console.log(`uploading full audio`);

        const storage = new Storage();
        await storage.bucket(BUCKET_NAME).upload(`${INBOX_DIR}/test/audio/full-audio.wav`, {destination: `${gcsWaveFileName}`});


        console.log(`working on getting speach: gs://universal-threads/${gcsWaveFileName}`);

        const client = new speech.SpeechClient({
            longRunningRecognize: true
        });
        const gcsUri = `gs://universal-threads/${gcsWaveFileName}`;
        const audio = {
            uri: gcsUri,
          };
          const config = {
            enableWordTimeOffsets: true,
            encoding: 'LINEAR16',
            sampleRateHertz: 24000,
            languageCode: 'en-US',
          };
          const request = {
            audio: audio,
            config: config,
          };

        // Detects speech in the audio file. This creates a recognition job that you
        // can wait for now, or get its result later.
        const [operation] = await client.longRunningRecognize(request);
        // Get a Promise representation of the final result of the job
        const [response] = await operation.promise();
        fs.writeFileSync(`${INBOX_DIR}/test/audio/transcript.json`,JSON.stringify(response.results));

        const deleteOptions = {
            ifGenerationMatch: generationMatchPrecondition,
        };
        await storage.bucket(bucketName).file(fileName).delete(deleteOptions);
        
        console.log("done!");
    });           
});

// todo : cobine audio into a single file, the add as source and set text filters to draw on
// can pass a list of filters to videoFilters


// ffmpeg -i input.mp4 -vf "drawtext=fontfile=/path/to/font.ttf:text='Stack Overflow':fontcolor=white:fontsize=24:box=1:boxcolor=black@0.5:boxborderw=5:x=(w-text_w)/2:y=(h-text_h)/2" -codec:a copy output.mp4
