class FfmpegTextBuffer{
    
    constructor(size, fileName, clipName){
        this.maxSize = size;
        this.fileName = fileName;
        this.clipName = clipName;
        this.buffer = "";
        this.currentSize = 0;

        fs.writeFileSync(fileName, '#!/bin/sh\n'); // init the file
    }

    append(ffmpegCommandFragment){
        this.buffer += ffmpegCommandFragment;
        this.currentSize++;
        if(this.currentSize < this.maxSize){
            this.buffer += ", "
        }else{
            // time to flush to the file
            this.flushToFile();
            this.buffer = "";
            this.currentSize = 0; 
        }
    }

    flushToFile() {
        fs.appendFileSync(this.fileName, `ffmpeg -i ${this.clipName} -vf ${this.buffer}\n`);
    }

    flush(){
        if(this.currentSize > 0){
            this.flushToFile();
        }
    }
}