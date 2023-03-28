// todo : pick up context from command line?
// todo : process context file to break up the joke regions into TTS for now (insertion is manual)

// todo : or prompt gpt as i did earlier and extact the joke text that way, then display a image while the joke is going?

/*
    Prompt 1: i want you to act as the best writer of dad jokes known to man. I will give you a story and you will suggest your best joke as the output. Nothing more then the joke
    Prompt 2: I now need you to act as a voice artist. I will give you a joke and I need you to mark it up in ssml. I need you to have it sound human with emotion and inflection and pitch changes as though a standup comedian was telling it for the biggest laugh but not too over the top, it needs to be convinsing
              Joke: [joke from 1 goes here]
        >> this output gets set in the jokeText and jokeSSML properties
    Prompt 3: Go to dall-e-2 and prompt for a image (cartoon or funny) to go with the joke. Save to the inbox folder of the topic and insert image name
        >> this content gets set in the jokeImage property
*/


function processSelection(wipThread){
   let storySeq = 0;
   // now loop through and ensure the story numbering is correct
   wipThread.stories.forEach(function(story){
    story.seq = storySeq;
    storySeq++;
   });

   // todo: remove blank nodes

   // save context object
   const dirPath = `../../inbox/${wipThread.id}`;
   const fileName = `${dirPath}/context.json`;

   fs.mkdir(dirPath, {recursive:true}, err=>{
       if(err) throw err;

       fs.writeFile(fileName, JSON.stringify(wipThread), err => {
           if(err){
               console.error(err);
           }
       });
   });

}

// console.log("for now this is manual - a human needs to do the work",
//  "go to gpt ask for dad jokes as per the prompts of this file in the comments");

const inboxDir = "../../inbox";

const fs = require('fs');

const readline = require('readline');
let r1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const allThreadsInprogress = [];
const allInboxItems = fs.readdirSync(inboxDir);
allInboxItems.forEach(function(file){
    let inboxPath = `${inboxDir}/${file}`;
    if(fs.statSync(inboxPath).isDirectory()){
        let context = `${inboxPath}/context.json`;
        if(fs.existsSync(context)){
            let contextObject = JSON.parse(fs.readFileSync(context));
            
            allThreadsInprogress.push(contextObject);
        }
    }
});

let threadCounter = 1;
allThreadsInprogress.forEach(function(thread){
    console.log('\x1b[33m%s\x1b[0m', `${threadCounter}) ${thread.title}`, '\x1b[0m');
    threadCounter++;
});

console.log('\x1b[33m%s\x1b[0m', `q) quit the program`, '\x1b[0m');

r1.question('Which story do you wish to validate: ', function(key){
    if(key === 'q'){
        console.log("goodbye");
        process.exit();
    }

    r1.close();
    let num = parseInt(key);

    if(num > 0 && num <= allThreadsInprogress.length){
        processSelection(allThreadsInprogress[num-1]);
    }else{
        console.log('\x1b[31m','Please make a selection from the topic numbers listed above or q to quit', '\x1b[0m');
    }
});