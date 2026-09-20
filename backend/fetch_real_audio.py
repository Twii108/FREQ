import os
import django
import urllib.request
import json
import time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freq_backend.settings')
django.setup()

from music.models import Track

tracks = Track.objects.all()

print("Fetching real iTunes 30-second clips...")

for track in tracks:
    try:
        # Search iTunes API
        artist_name = track.artist.name if hasattr(track, 'artist') and track.artist else ""
        query = urllib.parse.quote(f"{track.title} {artist_name}")
        url = f"https://itunes.apple.com/search?term={query}&entity=song&limit=1"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            if data['resultCount'] > 0:
                preview_url = data['results'][0].get('previewUrl')
                if preview_url:
                    track.preview_url = preview_url
                    track.save()
                    print(f"✅ Updated: {track.title} -> {preview_url}")
                else:
                    print(f"❌ No preview for: {track.title}")
            else:
                print(f"❌ Not found on iTunes: {track.title}")
    except Exception as e:
        print(f"Error fetching {track.title}: {e}")
    
    time.sleep(0.5) # rate limit

print("Finished updating database with REAL iTunes songs!")
