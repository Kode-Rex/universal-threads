
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

const inboxDir = "../../inbox";

// todo : seed all the fun stuff here to get a working sample 



// audio addition ?
// https://stackoverflow.com/questions/66183650/how-to-add-multiple-audio-to-a-video-at-specific-time-for-specific-duration
// ------- MERGE AUDIO ------------

const fullAudioFile = `${inboxDir}/test/full-audio.wav`;
fs.unlinkSync(fullAudioFile);

const audioCommand = ffmpeg();
audioCommand.mergeAdd(`${inboxDir}/test/audio/000-0-000-story.wav`)
            .mergeAdd(`${inboxDir}/test/audio/0000-fullText.wav`)
            .mergeToFile(fullAudioFile).on('end', ()=>{
                // -------- SET TEXT AND ADD AUDIO TRACK ---------
                const command = ffmpeg(`${inboxDir}/test/02-snowboard.mp4`);
                command.videoFilters([{
                filter: 'drawtext',
                options: {
                    fontfile:'/vagrant/fonts/LucidaGrande.ttc',
                    text: 'Story 1',
                    fontsize: 72,
                    fontcolor: 'white',
                    x: '(main_w/2-text_w/2)',
                    y: 50,
                    shadowcolor: 'black',
                    shadowx: 2,
                    shadowy: 2,
                    box:1,
                    boxcolor:'blue@0.75',
                    boxborderw:15,
                    enable:'between(t,0,1.4)'
                }
                },{
                    filter: 'drawtext',
                    options: {
                    fontfile:'/vagrant/fonts/LucidaGrande.ttc',
                    text: 'I’m a casino dealer.\nPeople losing money brings out',
                    fontsize: 90,
                    fontcolor: 'white',
                    x: '(main_w/2-text_w/2)',
                    y: '((main_h-text_h)/2)',
                    shadowcolor: 'black',
                    shadowx: 2,
                    shadowy: 2,
                    enable:'between(t,1.5,5.1)'
                    }
                },{
                    filter: 'drawtext',
                    options: {
                    fontfile:'/vagrant/fonts/LucidaGrande.ttc',
                    text: 'the worst qualities in them.\nEspecially when I',
                    fontsize: 90,
                    fontcolor: 'white',
                    x: '(main_w/2-text_w/2)',
                    y: '((main_h-text_h)/2)',
                    shadowcolor: 'black',
                    shadowx: 2,
                    shadowy: 2,
                    enable:'between(t,5.2,8.3)'
                    }
                },
                {
                    filter: 'drawtext',
                    options: {
                    fontfile:'/vagrant/fonts/LucidaGrande.ttc',
                    text: 'deal high limit games. Plus the pit',
                    fontsize: 90,
                    fontcolor: 'white',
                    x: '(main_w/2-text_w/2)',
                    y: '((main_h-text_h)/2)',
                    shadowcolor: 'black',
                    shadowx: 2,
                    shadowy: 2,
                    enable:'between(t,8.4,11.2)'
                    }
                }])
                .addInput(`${inboxDir}/test/full-audio.wav`)
                .saveToFile(`${inboxDir}/test/composed-test.mp4`);
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