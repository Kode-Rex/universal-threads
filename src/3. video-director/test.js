
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

const inboxDir = "../../inbox";
const videosDir = "../../../videos";

// todo : seed all the fun stuff here to get a working sample 

const command = ffmpeg(filePath);

// ffmpeg -i input.mp4 -vf "drawtext=fontfile=/path/to/font.ttf:text='Stack Overflow':fontcolor=white:fontsize=24:box=1:boxcolor=black@0.5:boxborderw=5:x=(w-text_w)/2:y=(h-text_h)/2" -codec:a copy output.mp4

// preview
//ffplay -vf "drawtext=fontfile=/path/to/font.ttf:text='Stack Overflow':fontcolor=white:fontsize=24:box=1:boxcolor=black@0.5:boxborderw=5:x=(w-text_w)/2:y=(h-text_h)/2" input.mp4