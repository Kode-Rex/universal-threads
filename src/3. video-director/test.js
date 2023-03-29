
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

const inboxDir = "../../inbox";
const fontPath = `${inboxDir}/test/BebasNeue-Regular.ttf`
// todo : compose video clips into a single video for processing?

// ------- MERGE AUDIO ------------
const context = JSON.parse(fs.readFileSync(`${inboxDir}/test/context.json`));

const textFilters = [];
let filterStart = (context.duration / 1000); // allow for image to show in intro
// title, then each story's full text
const audioCommand = ffmpeg();
const fullAudioFile = `${inboxDir}/test/full-audio.wav`;
audioCommand.mergeAdd(context.filePath);
context.stories.forEach((val, idx)=>{
    audioCommand.mergeAdd(val.filePath); // story #

    // pushing story # text
    // not sure if 0.25 is needed per every story text?
    let betweenText = `between(t,${filterStart+0.25},${filterStart+0.25+(val.duration/1000)})`
    textFilters.push({
        filter: 'drawtext',
        options: {
                fontfile: fontPath,
                text: `Story ${val.seq+1}`,
                fontsize: 72,
                fontcolor: 'white',
                x: '(main_w/2-text_w/2)',
                y: 50,
                shadowcolor: 'black',
                shadowx: 2,
                shadowy: 2,
                box:1,
                boxcolor:'blue@0.75',
                boxborderw:10,
                enable:betweenText
            }
        });
    
    filterStart += ((val.duration/1000));
    audioCommand.mergeAdd(val.fullTextPath); // story text

    // this tends to slip by about .1 per clip?
    val.ttsSegments.forEach((tts)=>{
        betweenText = `between(t,${filterStart},${filterStart+(tts.duration/1000)})`
        textFilters.push({
            filter: 'drawtext',
            options: {
                    fontfile: fontPath,
                    text: tts.displayTest,
                    fontsize: 72,
                    fontcolor: 'white',
                    x: '(main_w/2-text_w/2)',
                    y: '((main_h-text_h)/2)',
                    shadowcolor: 'black',
                    shadowx: 2,
                    shadowy: 2,
                    enable:betweenText
                }
        });
        filterStart += tts.duration/1000;
    });
});

audioCommand.mergeToFile(fullAudioFile).on('end',()=>{
    // process the text
     // -------- SET TEXT AND ADD AUDIO TRACK ---------
                // todo : write options to file so they can be tweaked ?
                const command = ffmpeg();
                command.input(`${inboxDir}/test/06-pro-shredder.mp4`); //.input(`${inboxDir}/test/thread.png`);

                // seems to be a max size on items (like about 12ish). Might need to encode in batches to keep things happy.
                // that is the case - write out filters to file (resume?), then loop through the merged file applying filters
                command.videoFilters(textFilters.slice(0,11)) 
                .addInput(`${inboxDir}/test/full-audio.wav`)
                .saveToFile(`${inboxDir}/test/composed-test.mp4`);
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

// preview
//ffplay -vf "drawtext=fontfile=/path/to/font.ttf:text='Stack Overflow':fontcolor=white:fontsize=24:box=1:boxcolor=black@0.5:boxborderw=5:x=(w-text_w)/2:y=(h-text_h)/2" input.mp4