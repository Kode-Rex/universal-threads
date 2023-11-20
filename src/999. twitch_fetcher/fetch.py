import requests
import cv2
import os
import time
import random

TWITCH_CLIENT_ID = '7vmqj3990p573f5phaibfp6q96jfpi'
TWITCH_CLIENT_SECRET = 'oqulqvlbieaju06eqydz9d1r4m7agg'

def get_twitch_oauth_token(client_id, client_secret):
    url = 'https://id.twitch.tv/oauth2/token'
    payload = {
        'client_id': client_id,
        'client_secret': client_secret,
        'grant_type': 'client_credentials'
    }
    response = requests.post(url, data=payload)
    return response.json().get('access_token')

# Get OAuth token and update headers
TWITCH_OAUTH_TOKEN = get_twitch_oauth_token(TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET)
HEADERS = {
    'Client-ID': TWITCH_CLIENT_ID,
    'Authorization': f'Bearer {TWITCH_OAUTH_TOKEN}'
}

def get_game_ids(game_names):
    game_ids = []
    
    for game_name in game_names:
        response = requests.get('https://api.twitch.tv/helix/games', headers=HEADERS, params={'name': game_name})
        data = response.json()
        
        if data['data']:
            game_ids.append(data['data'][0]['id'])

    return game_ids

def fetch_random_twitch_clips_for_games(game_ids, min_duration=120, max_duration=500):
    clips = []
    
    for game_id in game_ids:
        params = {
            'game_id': game_id,
            'first': 100,
        }
        response = requests.get('https://api.twitch.tv/helix/clips', headers=HEADERS, params=params)
        data = response.json()

        for clip in data['data']:
            if min_duration <= clip['duration'] <= max_duration:
                clips.append(clip)

    return clips


def contains_face(video_path):
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    cap = cv2.VideoCapture(video_path)

    while True:
        ret, frame = cap.read()
        
        if not ret:
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)

        if len(faces) > 0:
            cap.release()
            return True

    cap.release()
    return False

def download_clip(clip):
    clip_url = clip['thumbnail_url'].split("-preview", 1)[0] + ".mp4"
    response = requests.get(clip_url, stream=True)
    video_path = f"{clip['id']}.mp4"
    
    with open(video_path, 'wb') as out_file:
        for chunk in response.iter_content(chunk_size=8192):
            out_file.write(chunk)
    
    return video_path

if __name__ == "__main__":
    game_names = ["Minecraft", "Animal Crossing", "Terraria", "Celeste", "Slime Rancher",
                  "Stardew Valley", "Undertale", "Spiritfarer", 
                  "Rocket League", "Abzu", "Firewatch", "Planet Coaster", 
                  "Two Point Hospital", "Portal", "Portal 2", "Super Mario Odyssey"]

    game_ids = get_game_ids(game_names)
    clips = fetch_random_twitch_clips_for_games(game_ids)

    videos_without_faces = 0
    total_processed_videos = 0 
    for clip in clips:
        if videos_without_faces >= 20:
            break

        video_path = download_clip(clip)
        
        if not contains_face(video_path):
            print(f"No faces detected in clip: {clip['id']}")
            videos_without_faces += 1
        else:
            print(f"Faces detected in clip: {clip['id']}")
            os.remove(video_path)  # Remove the video if it contains a face

        total_processed_videos += 1

        # Pause every 5 videos
        if total_processed_videos % 5 == 0:
            pause_duration = random.randint(10, 30)
            print(f"Pausing for {pause_duration} seconds...")
            time.sleep(pause_duration)

    print(f"Downloaded {videos_without_faces} videos without faces.")
