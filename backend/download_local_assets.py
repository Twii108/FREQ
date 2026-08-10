import os
import urllib.request
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freq_backend.settings')
import django
django.setup()

from music.models import Artist, Track
from accounts.models import FavoriteArtist
from chat.models import ChatRoom

# Create media directories
media_dir = os.path.join(settings.BASE_DIR, 'media')
artists_dir = os.path.join(media_dir, 'artists')
tracks_dir = os.path.join(media_dir, 'tracks')
rooms_dir = os.path.join(media_dir, 'rooms')

os.makedirs(artists_dir, exist_ok=True)
os.makedirs(tracks_dir, exist_ok=True)
os.makedirs(rooms_dir, exist_ok=True)

# Map of filenames to Unsplash image download URLs
assets = {
    'artists/the_weeknd.jpg': 'https://images.unsplash.com/photo-1571327073757-71d13c24de36?w=400',
    'artists/taylor_swift.jpg': 'https://images.unsplash.com/photo-1549834185-bd9f078a5dfe?w=400',
    'artists/billie_eilish.jpg': 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400',
    'artists/drake.jpg': 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=400',
    'artists/bruno_mars.jpg': 'https://images.unsplash.com/photo-1522158673376-3c72b225950a?w=400',
    'artists/ed_sheeran.jpg': 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400',
    'artists/justin_bieber.jpg': 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400',
    'artists/ariana_grande.jpg': 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400',
    'artists/eminem.jpg': 'https://images.unsplash.com/photo-1550186082-670cde5a558b?w=400',
    'artists/post_malone.jpg': 'https://images.unsplash.com/photo-1487180142328-0c4e37023af5?w=400',
    'artists/dua_lipa.jpg': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400',
    'artists/olivia_rodrigo.jpg': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400',
    'artists/arijit_singh.jpg': 'https://images.unsplash.com/photo-1504196606672-aef5c9edfc87?w=400',
    'artists/ar_rahman.jpg': 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400',
    'artists/diljit_dosanjh.jpg': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
    'artists/shreya_ghoshal.jpg': 'https://images.unsplash.com/photo-1526218626217-dc65a29bb444?w=200',
    'artists/lana_del_rey.jpg': 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400',
    'artists/kanye_west.jpg': 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400',
    'artists/kendrick_lamar.jpg': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    'artists/coldplay.jpg': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
    'artists/travis_scott.jpg': 'https://images.unsplash.com/photo-1550186082-670cde5a558b?w=400',
    'artists/alan_walker.jpg': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400',
    'artists/marshmello.jpg': 'https://images.unsplash.com/photo-1525683879097-df41b2a48e1a?w=400',
    'artists/zayn_malik.jpg': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
    'artists/badshah.jpg': 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400',
    'tracks/default_track.jpg': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
    'rooms/default_room.jpg': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400'
}

print("Downloading local image assets...")
for path, url in assets.items():
    local_path = os.path.join(media_dir, path)
    if not os.path.exists(local_path):
        try:
            print(f"Downloading {path}...")
            urllib.request.urlretrieve(url, local_path)
        except Exception as e:
            print(f"Failed to download {path}: {e}")
    else:
        print(f"{path} already exists")

# Map of names to filenames in our local setup
local_artist_images = {
    'the weeknd': 'artists/the_weeknd.jpg',
    'taylor swift': 'artists/taylor_swift.jpg',
    'billie eilish': 'artists/billie_eilish.jpg',
    'drake': 'artists/drake.jpg',
    'bruno mars': 'artists/bruno_mars.jpg',
    'ed sheeran': 'artists/ed_sheeran.jpg',
    'justin bieber': 'artists/justin_bieber.jpg',
    'ariana grande': 'artists/ariana_grande.jpg',
    'eminem': 'artists/eminem.jpg',
    'post malone': 'artists/post_malone.jpg',
    'dua lipa': 'artists/dua_lipa.jpg',
    'olivia rodrigo': 'artists/olivia_rodrigo.jpg',
    'arijit singh': 'artists/arijit_singh.jpg',
    'a.r. rahman': 'artists/ar_rahman.jpg',
    'diljit dosanjh': 'artists/diljit_dosanjh.jpg',
    'shreya ghoshal': 'artists/shreya_ghoshal.jpg',
    'lana del rey': 'artists/lana_del_rey.jpg',
    'kanye west': 'artists/kanye_west.jpg',
    'kendrick lamar': 'artists/kendrick_lamar.jpg',
    'coldplay': 'artists/coldplay.jpg',
    'travis scott': 'artists/travis_scott.jpg',
    'alan walker': 'artists/alan_walker.jpg',
    'marshmello': 'artists/marshmello.jpg',
    'zayn malik': 'artists/zayn_malik.jpg',
    'badshah': 'artists/badshah.jpg'
}

# Update database references to map to local media URL
base_media_url = 'http://localhost:8000/media/'

print("Updating database artist image URLs to local servers...")
for a in Artist.objects.all():
    name_lower = a.name.lower()
    matched = False
    for k, v in local_artist_images.items():
        if k in name_lower:
            a.image_url = base_media_url + v
            a.save()
            matched = True
            break
    if not matched:
        a.image_url = base_media_url + 'artists/the_weeknd.jpg'
        a.save()

print("Updating database favorite artist URLs...")
for f in FavoriteArtist.objects.all():
    name_lower = f.artist_name.lower()
    matched = False
    for k, v in local_artist_images.items():
        if k in name_lower:
            f.artist_image_url = base_media_url + v
            f.save()
            matched = True
            break
    if not matched:
        f.artist_image_url = base_media_url + 'artists/the_weeknd.jpg'
        f.save()

print("Updating database track cover URLs...")
for t in Track.objects.all():
    name_lower = t.artist.name.lower()
    matched = False
    for k, v in local_artist_images.items():
        if k in name_lower:
            t.album_art_url = base_media_url + v
            t.save()
            matched = True
            break
    if not matched:
        t.album_art_url = base_media_url + 'tracks/default_track.jpg'
        t.save()

print("Updating chatroom cover URLs...")
for c in ChatRoom.objects.all():
    if c.artist:
        name_lower = c.artist.name.lower()
        matched = False
        for k, v in local_artist_images.items():
            if k in name_lower:
                c.cover_image_url = base_media_url + v
                c.save()
                matched = True
                break
        if matched:
            continue
    c.cover_image_url = base_media_url + 'rooms/default_room.jpg'
    c.save()

print("Finished downloading and updating local assets successfully!")
