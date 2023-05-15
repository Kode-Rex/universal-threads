const fs = require('fs');

const inboxDir = "../../inbox";
const contextPath = `${inboxDir}/test/context.json`;
const transcriptionPath = `${inboxDir}/test/audio/transcript.json`;

const context = JSON.parse(fs.readFileSync(contextPath));
const transcript = JSON.parse(fs.readFileSync(transcriptionPath));

// flatten the transcript to process words from context against it
let transcriptFragments = [];
transcript.forEach(element => {
    element.alternatives.forEach(alt=>{
        transcriptFragments = transcriptFragments.concat(alt.words);
    });
}); 

// ----- Process Title ------
const titleFirstLast = extractStartAndEndWords(context.title);
const titleFMatch = findTranscriptMatch(titleFirstLast.first, 0);
const titleLMatch = findTranscriptMatch(titleFirstLast.last, titleFMatch.foundAt);
let searchIdx = titleLMatch.foundAt;

// ----- Process story's --------
context.stories.forEach((story, idx)=>{
    // todo : now get wav duration for story XXX because it is deterministic 
    let storyLength = processDuration(story.storyFilePath);

    // todo : then write the story xxx ffmpeg to the sh file - q off the prev end time for start
    story.ttsSegments.forEach((tts, idx)=>{
        let firstLast = extractStartAndEndWords(tts.text);
        let fMatch = findTranscriptMatch(firstLast.first, searchIdx);
        searchIdx = fMatch.foundAt;
        let lMatch = findTranscriptMatch(firstLast.last, searchIdx);
        searchIdx = lMatch.foundAt;
        // todo : write ffmpeg command to the sh file, I would like to batch these to avoid long processing times. 



    });
});


function findTranscriptMatch(term, startFrom) {

    for(let idx = startFrom; idx < transcriptFragments.length; idx++){
        let elm = transcriptFragments[idx];

        if (elm.word === term) {
            return {
                start: elm.startTime,
                end: elm.endTime,
                foundAt : idx
            };
        }
    }
}


function extractStartAndEndWords(fragment){
    const result = {};

    const parts = fragment.split(' ');

    if(parts.length === 0){
        return result;
    }
    
    result.first = keepOnlyAlphaNumeric(parts[0]);

    if(parts.length === 1){
        return result;
    }

    result.last = keepOnlyAlphaNumeric(parts[parts.length - 1]);

    return result;
}

function keepOnlyAlphaNumeric(text){
    return text.replace(/[\W_]+/g,' ').trim().toLowerCase();
}

function processDuration(filePatht) {
    const buffer = fs.readFileSync(filePath);
    const dur = parseInt(duration(buffer)*1000); // ms
    
    return dur;
}

// todo : write out a apply-text-filter.sh file with all the commands to apply the text (like v1 pre-process.js file)
// todo : to achieve this we need to read the transcript.json and context.json files using the timestamps to mark start and ends for the text
// todo : along the way we want to ensure that the text is two lines per and centered. (I would like to batch these up to 4 - 6 lines per command)
//         - this will require edits to the 0's process to chunk the data better (max chars/line, where to split in the 'middle')
// todo : have a preview, good and best modes for rendering 
