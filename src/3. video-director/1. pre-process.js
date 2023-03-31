
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

const inboxDir = "../../inbox";
// todo : compose video clips into a single video for processing?

// ------- MERGE AUDIO ------------
const context = JSON.parse(fs.readFileSync(`${inboxDir}/test/context.json`));

const textFilters = [];
let filterStart = (context.duration / 1000); // allow for image to show in intro
// title, then each story's full text
const audioCommand = ffmpeg();
const fullAudioFile = `${inboxDir}/test/audio/full-audio.wav`;
let fileCounter = 0;

audioCommand.mergeAdd(context.filePath);
context.stories.forEach((val, idx)=>{
    audioCommand.mergeAdd(val.filePath); // story #

    // todo: use -codec:a copy - for preview mode instead of -codec:v libx264 -crf 0 -preset veryslow
    const codec = `-codec:a copy`; // -codec:v libx264 -crf 18 -preset slow -vf
    // pushing story # text
    let betweenText = `between(t,${filterStart+0.25},${filterStart+(val.duration/1000)})`
    textFilters.push(`ffmpeg -i video/composed-test-${fileCounter}.mp4 -vf "drawtext=fontfile=BebasNeue-Regular.ttf:text='Story ${val.seq+1}':fontcolor=white:fontsize=72:box=1:boxcolor=blue@0.75:boxborderw=10:x=(main_w/2-text_w/2):y=50:enable='${betweenText}'" ${codec} video/composed-test-${fileCounter+1}.mp4`);
    fileCounter++;
    // textFilters.push({
    //     filter: 'drawtext',
    //     options: {
    //             fontfile: fontPath,
    //             text: `Story ${val.seq+1}`,
    //             fontsize: 72,
    //             fontcolor: 'white',
    //             x: '(main_w/2-text_w/2)',
    //             y: 50,
    //             shadowcolor: 'black',
    //             shadowx: 2,
    //             shadowy: 2,
    //             box:1,
    //             boxcolor:'blue@0.75',
    //             boxborderw:10,
    //             enable:betweenText
    //         }
    //     });
    
    filterStart += ((val.duration/1000));
    audioCommand.mergeAdd(val.fullTextPath); // story text


    // centering text with multiple draw text instances - I should be able to chain all the tts segments with this to bring down processing times
    // ffmpeg -f lavfi -i color=c=green:s=320x240:d=10 -vf "drawtext=fontfile=/path/to/font.ttf:fontsize=30:fontcolor=white:x=(w-text_w)/2:y=(h-text_h-text_h)/2:text='Stack',drawtext=fontfile=/path/to/font.ttf:fontsize=30:fontcolor=white:x=(w-text_w)/2:y=(h+text_h)/2:text='Overflow'" output.mp4
    
    // there is a like 25 ms drift per fragement
    val.ttsSegments.forEach((tts, idx)=>{
        betweenText = `between(t,${filterStart},${filterStart+(tts.duration/1000)})`
        textFilters.push(`ffmpeg -i video/composed-test-${fileCounter}.mp4 -vf "drawtext=fontfile=BebasNeue-Regular.ttf:text='${tts.displayText.replace(/:/g, '').replace(/'/g,' ')}':shadowcolor='black':shadowx=2:shadowy=2:fontcolor=white:fontsize=72:x=(main_w/2-text_w/2):y=((main_h-text_h)/2):enable='${betweenText}'" ${codec} video/composed-test-${fileCounter+1}.mp4`);
        // textFilters.push({
        //     filter: 'drawtext',
        //     options: {
        //             fontfile: fontPath,
        //             text: tts.displayTest,
        //             fontsize: 72,
        //             fontcolor: 'white',
        //             x: '(main_w/2-text_w/2)',
        //             y: '((main_h-text_h)/2)',
        //             shadowcolor: 'black',
        //             shadowx: 2,
        //             shadowy: 2,
        //             enable:betweenText
        //         }
        // });
        
        filterStart += tts.duration/1000;
        fileCounter++;
    });
});


// raw drawText input to ffmpeg
// ffmpeg -i inputClip.mp4 -vf "drawtext=text='My text starting at 640x360':x=640:y=360:fontsize=24:fontcolor=white" -c:a copy output.mp4

audioCommand.mergeToFile(fullAudioFile).on('end',()=>{
    // process the text
    
    //  write out the commands to a run.sh to apply fitlers
    
    //fs.unlinkSync(`${inboxDir}/test/text-filters.sh`);
    fs.writeFileSync(`${inboxDir}/test/video/apply-text-filters.sh`, '#!/bin/sh\n');
    textFilters.forEach((filter)=>{
        fs.appendFileSync(`${inboxDir}/test/video/apply-text-filters.sh`, `${filter}\n`);
    });
     // -------- SET TEXT AND ADD AUDIO TRACK ---------
    const command = ffmpeg();
    command.input(`${inboxDir}/test/06-pro-shredder.mp4`); //.input(`${inboxDir}/test/thread.png`);

    // seems to be a max size on items (like about 12ish). Might need to encode in batches to keep things happy.
    // that is the case - write out filters to file (resume?), then loop through the merged file applying filters

    // todo : I just might need to process wrap ffmpeg and do this that way?
    // todo : loop this until the array is empty - 

    // todo : create a memory stream with base video, process filters on it 
    // then save once all fitlers have been applied
    fs.mkdirSync(`${inboxDir}/test/video/`);

    command
    .addInput(`${inboxDir}/test/audio/full-audio.wav`)
    .saveToFile(`${inboxDir}/test/video/composed-test-0.mp4`)
    .on('end', ()=> {
        console.log('done with phase 1');
    });

    
    
    // tell it to overlay the image 
    //command.complexFilter(["[0:v]scale=640:-1[bg];[bg][1:v]overlay=W-w-10:H-h-10"]);

                // command.videoFilters([{
                // filter: 'drawtext',
                // options: {
                //     fontfile: fontPath,
                //     text: 'Story 1',
                //     fontsize: 72,
                //     fontcolor: 'white',
                //     x: '(main_w/2-text_w/2)',
                //     y: 50,
                //     shadowcolor: 'black',
                //     shadowx: 2,
                //     shadowy: 2,
                //     box:1,
                //     boxcolor:'blue@0.75',
                //     boxborderw:10,
                //     enable:'between(t,0,1.4)'
                // }
                // },{
                //     filter: 'drawtext',
                //     options: {
                //     fontfile:fontPath,
                //     text: 'I’m a casino dealer.\nPeople losing money brings out',
                //     fontsize: 90,
                //     fontcolor: 'white',
                //     x: '(main_w/2-text_w/2)',
                //     y: '((main_h-text_h)/2)',
                //     shadowcolor: 'black',
                //     shadowx: 2,
                //     shadowy: 2,
                //     enable:'between(t,1.5,5.1)'
                //     }
                // },{
                //     filter: 'drawtext',
                //     options: {
                //     fontfile:fontPath,
                //     text: 'the worst qualities in them.\nEspecially when I',
                //     fontsize: 90,
                //     fontcolor: 'white',
                //     x: '(main_w/2-text_w/2)',
                //     y: '((main_h-text_h)/2)',
                //     shadowcolor: 'black',
                //     shadowx: 2,
                //     shadowy: 2,
                //     enable:'between(t,5.2,8.3)'
                //     }
                // },
                // {
                //     filter: 'drawtext',
                //     options: {
                //     fontfile:fontPath,
                //     text: 'deal high limit games. Plus the pit',
                //     fontsize: 90,
                //     fontcolor: 'white',
                //     x: '(main_w/2-text_w/2)',
                //     y: '((main_h-text_h)/2)',
                //     shadowcolor: 'black',
                //     shadowx: 2,
                //     shadowy: 2,
                //     enable:'between(t,8.4,11.2)'
                //     }
                // }])
                
});

// todo : cobine audio into a single file, the add as source and set text filters to draw on
// can pass a list of filters to videoFilters




// story text
// command.videoFilters({
//     filter: 'drawtext',
//     options: {
//       fontfile:'/vagrant/fonts/LucidaGrande.ttc',
//       text: 'THIS IS TEXT THAT I AM TESTING WITH',
//       fontsize: 72,
//       fontcolor: 'blue',
//       x: '(main_w/2-text_w/2)',
//       y: '((main_h-text_h)/2)',
//       shadowcolor: 'black',
//       shadowx: 2,
//       shadowy: 2,
//       enable:between(t,5,10)
//     }
//   }).saveToFile(`${inboxDir}/test/composed-test.mp4`);

// ffmpeg -i input.mp4 -vf "drawtext=fontfile=/path/to/font.ttf:text='Stack Overflow':fontcolor=white:fontsize=24:box=1:boxcolor=black@0.5:boxborderw=5:x=(w-text_w)/2:y=(h-text_h)/2" -codec:a copy output.mp4
