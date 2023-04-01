const fs = require('fs');

const inboxDir = "../../inbox";
const contextPath = `${inboxDir}/test/context.json`;
const transcriptionPath = `${inboxDir}/test/audio/transcript.json`;

const context = JSON.parse(fs.readFileSync(contextPath));
const transcript = JSON.parse(fs.readFileSync(transcriptionPath));

// todo : write out a apply-text-filter.sh file with all the commands to apply the text (like v1 pre-process.js file)
// todo : to achieve this we need to read the transcript.json and context.json files using the timestamps to mark start and ends for the text
// todo : along the way we want to ensure that the text is two lines per and centered. (I would like to batch these up to 4 - 6 lines per command)
//         - this will require edits to the 0's process to chunk the data better (max chars/line, where to split in the 'middle')
// todo : have a preview, good and best modes for rendering 