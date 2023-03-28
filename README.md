# fact-emporium README.md

1. Scrape content from /r/askredit via api
   - https://www.reddit.com/r/AskReddit/comments/11vmkfc/americans_what_do_eurpoeans_have_everyday_that/ 
   - https://www.reddit.com/r/AskReddit/comments/11bsi96/what_is_something_that_is_generally_accepted/ 
   - Split into 5-8 word segments for audio and transcription over-writing
   - Need to understand depth of comment structure to follow (2-3 nodes deep?)
      - Need to be top level of 3 words or more but less than 20?sih (no rants!), with a depth of at least 1 node of sub comments (how to check if they are good?)
      - Pull 60 "stories"
      - Screenshot thread title for video artifacts
   - How to automate finding the stories to pull? 
        - Look for a fixed comment threshold?
        - Ask chatgpt to pick between the day's top threads?
2. ChatGPT API editing of script
   - Can AI inject options that sound human?
      - inital results say yes! (3-5 per video?)
3. Find game footage ?
   - https://twiclips.com/
   - https://www.twitch.tv/mixelplx/videos 
   - Automate the fetch and pull via a scheduled job - SOME DAY, NOT NOW!!!
       - Strip Audio from footage 
          - ffmpeg -i x.mp4 -c copy -an x1.mp4
       - Chunk with quicktime 3-7 minutes segments
4. Find decent AI audio generation
   - Google TTS service @ https://cloud.google.com/text-to-speech#section-2
    voice type: studio - M
    ```
       {
     "audioConfig": {
       "audioEncoding": "LINEAR16",
       "effectsProfileId": [
         "large-home-entertainment-class-device"
       ],
       "pitch": -1.2,
       "speakingRate": 1
     },
     "input": {
       "text": "Future generations will be binge-watching documentaries about our wastefulness like we used to binge-watch reality TV. Talk about a real \"Keeping Up with the Trashdashians\" situation."
     },
     "voice": {
       "languageCode": "en-US",
       "name": "en-US-Neural2-J"
     }
   }
    ```
5. moviePy to automate the addition of the story text
   - Copy mainly facts and others like it
   - Should be able to calc overlay time based on audio segment - can I auto add the audio and text over the video to make a new?

