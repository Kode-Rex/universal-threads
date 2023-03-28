const inboxDir = "../../inbox";
const fs = require('fs');

const readline = require('readline');
let r1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function produceVideoFor(threadObject){

    const thread = threadObject.context;
    const rootPath = threadObject.projectPath;

    console.log(`Working on \x1b[35m${thread.title}\x1b[0m with a root of \x1b[31m${rootPath}\x1b[0m`);

    /// todo: compose things onto the game video track : audio, text
}

const allThreadsInprogress = [];
const allInboxItems = fs.readdirSync(inboxDir);
allInboxItems.forEach(function(file){
    let inboxPath = `${inboxDir}/${file}`;
    if(fs.statSync(inboxPath).isDirectory()){
        let context = `${inboxPath}/context.json`;
        if(fs.existsSync(context)){
            let audioDir = `${inboxPath}/audio`;
            if(fs.existsSync(audioDir)){
                let contextObject = JSON.parse(fs.readFileSync(context));
                allThreadsInprogress.push({
                    projectPath : inboxPath, 
                    context: contextObject
                });
            }
        }
    }
});

let threadCounter = 1;
allThreadsInprogress.forEach(function(thread){
    console.log('\x1b[33m%s\x1b[0m', `${threadCounter}) ${thread.context.title}`, '\x1b[0m');
    threadCounter++;
});

console.log('\x1b[33m%s\x1b[0m', `q) quit the program`, '\x1b[0m');

r1.question('Which story do you wish produce a video for: ', function(key){
    if(key === 'q'){
        console.log("goodbye");
        process.exit();
    }

    r1.close();
    let num = parseInt(key);

    if(num > 0 && num <= allThreadsInprogress.length){
        produceVideoFor(allThreadsInprogress[num-1]);
    }else{
        console.log('\x1b[31m','Please make a selection from the topic numbers listed above or q to quit', '\x1b[0m');
    }
});