import random
from django.core.management.base import BaseCommand
from music.models import Artist, Track
from chat.models import ChatRoom
from trivia.models import Quiz, TriviaQuestion

# Pool of beautiful portrait images for artists from Unsplash
IMAGE_POOL = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
    "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=300",
    "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=300",
    "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300",
    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300",
    "https://images.unsplash.com/photo-1504257404292-b99b1b318a8b?w=300",
    "https://images.unsplash.com/photo-1529068755536-a5ade0dcb4e8?w=300",
    "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300",
    "https://images.unsplash.com/photo-1489980508314-941910ded1f4?w=300",
    "https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=300",
    "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300",
    "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=300"
]

ADJECTIVES = [
    'Silent', 'Dark', 'Electric', 'Vocal', 'Acoustic', 'Synthesized', 'Alternative', 'Retro',
    'Future', 'Cosmic', 'Melodic', 'Neon', 'Subtle', 'Symphonic', 'Indie', 'Midnight', 'Echo',
    'Rhythm', 'Beat', 'Harmony', 'Lunar', 'Solar', 'Hyper', 'Super', 'Deep', 'Liquid', 'Glitch'
]

NOUNS = [
    'Orchestra', 'Duo', 'Band', 'Project', 'Symphony', 'Theory', 'Engine', 'Vibe', 'Waves',
    'Echoes', 'Sounds', 'Tracks', 'Beatmakers', 'Ensemble', 'Collective', 'System', 'Pulse',
    'Flow', 'Generation', 'Legacy', 'Division', 'Unit', 'Club', 'Society', 'Syndicate', 'Loop'
]

GENRES = ['Pop', 'Rock', 'Hip Hop', 'R&B', 'Electronic', 'Jazz', 'Indie', 'Metal', 'Classical', 'Country']

class Command(BaseCommand):
    help = 'Seed database with 1000+ artists and tracks for testing search scale'

    def handle(self, *args, **options):
        self.stdout.write('Generating 1000+ artists and tracks (Bulk insertion)...')

        # 1. Clear existing database for music scale
        Track.objects.all().delete()
        Artist.objects.all().delete()

        # Let's generate combinations
        artist_names = set()
        while len(artist_names) < 1010:
            name = f"{random.choice(ADJECTIVES)} {random.choice(NOUNS)}"
            # Add some decorators to make them unique
            if random.random() < 0.2:
                name = f"DJ {name}"
            elif random.random() < 0.2:
                name = f"{name} {random.randint(1, 99)}"
            artist_names.add(name)

        artist_list = list(artist_names)
        
        artists_to_create = []
        tracks_to_create = []
        
        for i, name in enumerate(artist_list):
            spotify_id = f"mock_artist_{i}_{random.randint(100000, 999999)}"
            genres = random.sample(GENRES, k=random.randint(1, 3))
            
            artists_to_create.append(Artist(
                name=name,
                spotify_id=spotify_id,
                image_url=random.choice(IMAGE_POOL),
                genres=genres,
                popularity=random.randint(10, 95),
                bio=f"{name} is an underground sensation specializing in {', '.join(genres)} music production.",
                followers_count=random.randint(100, 500000)
            ))

        # Bulk create Artists
        created_artists = Artist.objects.bulk_create(artists_to_create)
        self.stdout.write(f"Successfully created {len(created_artists)} artists in MongoDB!")

        # 2. Generate a track for each artist
        for i, artist in enumerate(created_artists):
            spotify_id = f"mock_track_{i}_{random.randint(100000, 999999)}"
            track_title = f"{random.choice(ADJECTIVES)} Song"
            if random.random() < 0.5:
                track_title = f"{artist.name} Hit {random.randint(1, 10)}"
            
            tracks_to_create.append(Track(
                title=track_title,
                artist=artist,
                spotify_id=spotify_id,
                album_name=f"Album of {artist.name}",
                album_art_url=artist.image_url,
                duration_ms=random.randint(120000, 300000),
                preview_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                popularity=random.randint(20, 95),
                release_date="2024",
                genres=artist.genres,
                audio_features={
                    'danceability': round(random.uniform(0.3, 0.9), 3),
                    'energy': round(random.uniform(0.3, 0.9), 3),
                    'valence': round(random.uniform(0.2, 0.9), 3),
                    'tempo': random.randint(80, 180),
                    'acousticness': round(random.uniform(0.01, 0.6), 3)
                }
            ))

        # Bulk create Tracks
        created_tracks = Track.objects.bulk_create(tracks_to_create)
        self.stdout.write(f"Successfully created {len(created_tracks)} tracks in MongoDB!")
        self.stdout.write("Large catalog seeding finished successfully!")
