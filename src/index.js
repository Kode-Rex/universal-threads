require('child_process');

// child process names
const topicProcess = 'reddit_topic_fetcher/index.js';
const ttsProcess = 'script_tts';

const childProcess = require('child_process');

console.log('\x1b[32m',`fetching top ${topPostCount} posts`, '\x1b[0m');
const topicsProcess = childProcess.fork(topicProcess, {
    execArgv: ['--count=10 --hot --period=week']
  }, {silent:true} );

let topics = {};
topicsProcess.stdout.on('data', (data)=>{
    topics = JSON.parse(data);
});

let postCounter = 1;
posts.forEach(post=>{
    console.log('\x1b[33m%s\x1b[0m', `${postCounter}) ${post.text}`, '\x1b[0m');
    for(var counter=1; counter<6; counter++){
        let comment = post.comments[counter];

        console.log('\x1b[34m', ` > ${comment.body}`, '\x1b[0m');
    }

    postCounter++;
})

// todo : need a cmd line tool to drive as orchestrator?
// todo : that tools calls this to kick off the entire process 
// todo : based on what is picked, the context file is written and the job queue is created
console.log('\x1b[32m', 'done fetching top post', '\x1b[0m');

// todo : now print the topics for me to choose from

// todo : wait for selection, then kick off the video creation process!

// - v1 of process 
// ---------------
// - Dump into context object and save to inbox/story_id/context.json
// - Save the thread title, id, etc along with an array of stories (comments to thread)
// - Save the name of the story too in a file called inbox/story_id/name.txt
    // - Label each 'story' by setting the story object properties { seq:s0, fullText: y, ttsSegments : {seq:s1, text:a-b-c}}
    // - ttsSegments will remain empty until after it is injected with a bit of hummor 
// - inject hummor via ChatGPT - manual for now! / node automation?
// - Parition the spoken words into tts payloads of 6-9 words per (this is purely the fullText segment [including the dad jokes])
    // - all this is written out to the context object in the inbox for this. There should be process logging along the way as well.
// - Spin the TTS chunks through the TTS service saving them to the inbox/story_id/data/tts/s0/s1.mp3


// - Then launch the video scrapper tool??????
// - Then launch the video composer tool??????
    // - Stitch together the video, text overlay and audio to produce the final product 