'use strict';
const snoowrap = require('snoowrap');

const r = new snoowrap({
    userAgent: 'Fact-Emporium-Sourcer',
    clientId: 'fyMUAPIGP2NPU4r1rH1muA',
    clientSecret: 'XUIzsdxcvq_qKFPkVK1DRzTWTpfPcw',
    refreshToken: '21458068198443--MpMf2275KFsXgRrnTyIkzjdEk3Esg'
});
const fs = require('fs');

async function fetch(topPostCount, isHotTake, timePeriod){
    //r.getHot().map(post => post.title).then(console.log);
    // 'f=flair_name%3A"Serious%20Replies%20Only"' // .filter();
    const subreddit = await r.getSubreddit('askReddit');
    let topPosts = await subreddit.getTop({time: timePeriod, limit: topPostCount}); //.getHot also works!
    if(isHotTake){
        topPosts = await subreddit.getHot({time: timePeriod, limit: topPostCount}); //.getHot also works!
    }
    
    let data = [];

    for(var i = 0; i < topPosts.length; i++){
        let comments = [];
        let post = topPosts[i];

        let submissions = await r.getSubmission(post.id).expandReplies({limit:75, depth:1}); //.fetch();
        let counter = 1;

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
            counter++;
        });

        data.push({
            id : post.id,
            link: post.url,
            title: post.title,
            score: post.score,
            upvote_ratio : post.upvote_ratio,
            comments: comments
        })
    }

    return data;
}

function splitStringByWhitespace(str) {
    return str.split(/\s+/);
}

const badWords = ['shit', 'bullshit', 'bitch', 'whore', 'ho', 'slut', 'ass', 'douchebag', 'fuck', 'cock', 'dick', 'pussy','rape', 'fucking', 'fucked', 'shitty', 'batshit', 'dickheads', 'dickhead', 'cunt', 'bitches' ];
const replacementWordsForDisplay = ['s***', 'bulls***', 'b****', 'w****', 'h*', 's***', 'a**', 'd*****bag', 'f***', 'c***', 'd***', 'p****', 'r***', 'f***ing', 'f***ed', 's****y', 'bats***', 'd***heads', 'd***head', 'c***', 'b*****s' ];
const replacementWordsForAudio = ['s ', 'b s', 'b', 'w', 'h', 's', 'a', 'd', 'f', 'c', 'd', 'p', 'r', 'f', 'f', 's', 'bat s', 'd heads', 'd head', 'c', 'b'];

function removeEmojis(input){
    let result = input.replace(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, '');

    return result.replace(/\n/g, ' ').replace(/\"/g,' ');
}

function generateDisplayText(input){
    let result = input;

    let punctuationRegex = /[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g;

    // todo : need to factor in the . at end of sentence?
    for(var badWordIdx = 0; badWordIdx < badWords.length; badWordIdx++){
        let badWord = badWords[badWordIdx];
        let replacement = replacementWordsForDisplay[badWordIdx];

        for(var resultIdx = 0; resultIdx < result.length; resultIdx++){
            let word = result[resultIdx];
            let cleanedWord = word.replace(punctuationRegex, '');

            if(word.toLowerCase().trim() === badWord || cleanedWord.toLowerCase().trim() == badWord){
                console.log(`replacing display ${word} with ${replacement}`);
                result[resultIdx] = replacement;
            }else{
                result[resultIdx] = removeEmojis(word);
            }
        }
    }

    return result.join(' ');
}

function generateAudioText(input){
    let result = input;
    let punctuationRegex = /[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g;

    for(var badWordIdx = 0; badWordIdx < badWords.length; badWordIdx++){
        let badWord = badWords[badWordIdx];
        let replacement = replacementWordsForAudio[badWordIdx];

        for(var resultIdx = 0; resultIdx < result.length; resultIdx++){
            let word = result[resultIdx];
            let cleanedWord = word.replace(punctuationRegex, '');
            if(word.toLowerCase() === badWord || cleanedWord.toLowerCase() === badWord){
                console.log(`replacing audio ${word} with ${replacement}`);
                result[resultIdx] = replacement;
            }else{
                result[resultIdx] = removeEmojis(word);
            }
        }
    }

    return result.join(' ');
}

function processSelection(num, posts){
    const post = posts[num-1];
            console.log('\x1b[32m', `${post.title}`, '\x1b[0m', 'has been selected.');
            
            const context = {
                id : post.id,
                link: post.url,
                totalDuration : 0,
                title: post.title,
                score: post.score,
                upvote_ratio : post.upvote_ratio,
                thread_image: '',
                filePath: '',
                duration: 0,
                stories: []
            };

            let storySeq = 0;
            post.comments.forEach(comment => {

                // filter out unwanted stories 
                if(comment.body === '[deleted]' || comment.body === '[removed]'){
                    return; 
                }

                const story = {
                    seq: storySeq,
                    fullText:generateAudioText(comment.body.split(' ')),
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

                let ttsSeq = 0;
                while( (skipAmount + segmentSize) < segments.length){
                    let segment = {
                        seq : ttsSeq,
                        displayText: generateDisplayText(segments.slice(skipAmount, (segmentSize+skipAmount))),
                        text: generateAudioText(segments.slice(skipAmount, (segmentSize+skipAmount))),
                        duration: 0,
                        filePath: ''
                    }
                    story.ttsSegments.push(segment);

                    skipAmount+= segmentSize;
                    ttsSeq++;
                    segmentSize = Math.floor(Math.random() * (9 - 6 + 1)) + 6;
                }

                // push any remaining chunks
                story.ttsSegments.push({
                    seq:ttsSeq,
                    displayText: generateDisplayText(segments.slice(skipAmount, (segmentSize+skipAmount))),
                    text: generateAudioText(segments.slice(skipAmount, (segmentSize+skipAmount))),
                    filePath: '',
                    duration: 0,
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
                });
            });
}


  // https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color


// todo : take cmd line args, pass through and exit after writing to stdout

(async() => {
    let topPostCount = 10;
    let isHotTake = false;
    let timePeriod = 'month';

    console.log('\x1b[32m',`fetching top ${topPostCount} posts`, '\x1b[0m');

    const posts = await fetch(topPostCount, isHotTake, timePeriod);

    let postCounter = 1;
    posts.forEach(post=>{
        console.log('\x1b[33m%s\x1b[0m', `${postCounter}) ${post.title}`, '\x1b[0m');
        for(var counter=1; counter<6; counter++){
            let comment = post.comments[counter];

            console.log('\x1b[34m', ` > ${comment.body}`, '\x1b[0m');
        }

        postCounter++;
    });
    console.log('\x1b[33m%s\x1b[0m', `q) quit the program`, '\x1b[0m');


    const readline = require('readline');
    let r1 = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    r1.question('Which topic do you wish to use?: ', function(key){
        
        if(key === 'q'){
            console.log("goodbye");
            process.exit();
        }

        let num = parseInt(key);
        r1.close();

        if(num > 0 && num <= topPostCount){
            processSelection(num, posts);
        }else{
            console.log('\x1b[31m','Please make a selection from the topic numbers listed above or q to quit', '\x1b[0m');
        }
    });

    // todo : need a cmd line tool to drive as orchestrator?
    // todo : that tools calls this to kick off the entire process 
    // todo : based on what is picked, the context file is written and the job queue is created
    //console.log('\x1b[32m', 'done fetching top post', '\x1b[0m');
  })();
