
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

const inboxDir = "../../inbox";

// todo : seed all the fun stuff here to get a working sample 

const command = ffmpeg(`${inboxDir}/test/02-snowboard.mp4`);

// story title - 
//     enable:between(t,1,5)
command.videoFilters({
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
    enable:'between(t,0,5)'
  }
}).videoFilters({
    filter: 'drawtext',
    options: {
      fontfile:'/vagrant/fonts/LucidaGrande.ttc',
      text: 'THIS IS TEXT THAT I AM TESTING WITH',
      fontsize: 72,
      fontcolor: 'blue',
      x: '(main_w/2-text_w/2)',
      y: '((main_h-text_h)/2)',
      shadowcolor: 'black',
      shadowx: 2,
      shadowy: 2,
      enable:'between(t,5,20)'
    }
  })
.saveToFile(`${inboxDir}/test/composed-test.mp4`);


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