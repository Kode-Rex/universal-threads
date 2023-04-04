'use strict';

const snoowrap = require('snoowrap');
const duration = require("wav-audio-length").default;
const r = new snoowrap({
    userAgent: 'Fact-Emporium-Sourcer',
    clientId: 'fyMUAPIGP2NPU4r1rH1muA',
    clientSecret: 'XUIzsdxcvq_qKFPkVK1DRzTWTpfPcw',
    refreshToken: '21458068198443--MpMf2275KFsXgRrnTyIkzjdEk3Esg'
});

const fs = require('fs');

async function fetch(postId){
    const subreddit = await r.getSubreddit('askReddit');
    //let post = await subreddit.getSubmission(postId).fetch().title;
    let data = [];

    let comments = [];
    let submissions = await r.getSubmission(postId).expandReplies({limit:75, depth:1}); //.fetch();

    submissions.comments.forEach(x=>{
        comments.push({ 
                        id:x.id,
                        body:x.body,
                        likes:x.likes == null ? 0 : x.likes, 
                        score: x.score, 
                        edited:x.edited, 
                        permalink:x.permalink, 
                        depth: x.depth, 
                        ups: x.ups
                    });
    });

    data.push({
        id : postId,
        link: '',
        title: '',
        filePath: '',
        duration: 0,
        totalDuration: 0,
        comments: comments
    })

    return data[0];
}

function splitStringByWhitespace(str) {
    return str.split(/\s+/);
}

function processSelection(post){    
    const context = {
        id : post.id,
        link: '',
        title: '',
        thread_image: '',
        filePath: '',
        duration: 0,
        stories: []
    };

    let storySeq = 0;
    post.comments.forEach(comment => {
        const story = {
            seq: storySeq,
            fullText:comment.body,
            fullTextPath : '',
            jokeText: '',
            jokeSSML: '',
            jokeImage: '',
            filePath: '',
            duration: 0,
            ttsSegments: []
        };
        storySeq++;

        let skipAmount = 0;
        let segments = splitStringByWhitespace(comment.body);
        let segmentSize = Math.floor(Math.random() * (9 - 6 + 1)) + 6;

        // todo : check n+1 for a punctionation to not leave off
        //todo : fix this, it is broken very badly, pull out and test in isolation
        let ttsSeq = 0;
        while( (skipAmount + segmentSize) < segments.length){
            let segment = {
                seq : ttsSeq,
                text: segments.slice(skipAmount, (segmentSize+skipAmount)).join(' ')
            }
            story.ttsSegments.push(segment);

            skipAmount+= segmentSize;
            ttsSeq++;
            segmentSize = Math.floor(Math.random() * (9 - 6 + 1)) + 6;
        }

        // push any remaining chunks
        story.ttsSegments.push({
            seq:ttsSeq,
            text: segments.slice(skipAmount, (segmentSize+skipAmount)).join(' ')
        });

        context.stories.push(story);
    });

    // save context object
    const dirPath = `../../inbox/${post.id}`;
    const fileName = `${dirPath}/context.json`;

    fs.mkdir(dirPath, {recursive:true}, err=>{
        if(err) throw err;

        fs.writeFile(fileName, JSON.stringify(context), err => {
            if(err){
                console.error(err);
            }
            console.log(`written to ${fileName}`);
        });
    });
}

(async() => {
    const readline = require('readline');
    let r1 = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    r1.question('Enter the askreddit thread id (121joyd) to fetch or (q) quit: ', async function(input){
        
        if(input === 'q'){
            console.log("goodbye");
            process.exit();
        }

        r1.close();
        console.log(`\x1b[32mProcessing...\x1b[0m`);
        const post = await fetch(input);
        processSelection(post);
    });
  })();
