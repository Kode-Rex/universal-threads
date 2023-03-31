const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

const inboxDir = "../../inbox";

const jsonObj = fs.readFileSync(`${inboxDir}/test/text-filters.json`);
const textFilters = JSON.parse(jsonObj);

const amt = 10;
const command = ffmpeg(`${inboxDir}/test/composed-test-2a.mp4`);
command.videoFilters(textFilters.splice(0,amt)) 
.saveToFile(`${inboxDir}/test/composed-test-2b.mp4`)
.on('end', ()=> {
    fs.writeFileSync(`${inboxDir}/test/text-filters.json`, JSON.stringify(textFilters));
    console.log('done with pass of text fitlers');
});