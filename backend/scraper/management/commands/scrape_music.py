"""Django management command to scrape music data from Spotify, Last.fm, and MusicBrainz."""
import time
from django.core.management.base import BaseCommand
from music.models import Artist, Track
from scraper.spotify_scraper import fetch_new_releases, fetch_artist_details, fetch_audio_features, fetch_artist_top_tracks
from scraper.lastfm_scraper import fetch_artist_tags


class Command(BaseCommand):
    help = 'Scrape music data from Spotify, Last.fm, and MusicBrainz'

    def add_arguments(self, parser):
        parser.add_argument('--artists', nargs='+', type=str, help='Specific artist names to scrape')
        parser.add_argument('--limit', type=int, default=50, help='Number of new releases to fetch')

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🎵 Starting Freq Music Scraper...'))

        # Step 1: Fetch new releases from Spotify
        self.stdout.write('📀 Fetching new releases from Spotify...')
        tracks_data = fetch_new_releases(limit=options.get('limit', 50))
        self.stdout.write(f'   Found {len(tracks_data)} tracks')

        # Step 2: Process and save artists + tracks
        artist_cache = {}
        spotify_ids_to_fetch = []

        for td in tracks_data:
            artist_sid = td.get('artist_spotify_id', '')
            if not artist_sid:
                continue

            if artist_sid not in artist_cache:
                artist_details = fetch_artist_details(artist_sid)
                if artist_details:
                    artist, created = Artist.objects.update_or_create(
                        spotify_id=artist_sid,
                        defaults={
                            'name': artist_details['name'],
                            'image_url': artist_details.get('image_url', ''),
                            'genres': artist_details.get('genres', []),
                            'popularity': artist_details.get('popularity', 0),
                            'followers_count': artist_details.get('followers_count', 0),
                        }
                    )
                    artist_cache[artist_sid] = artist
                    status_text = '✅ Created' if created else '🔄 Updated'
                    self.stdout.write(f'   {status_text} artist: {artist.name}')
                    time.sleep(0.1)

            artist = artist_cache.get(artist_sid)
            if not artist:
                continue

            track, created = Track.objects.update_or_create(
                spotify_id=td['spotify_id'],
                defaults={
                    'title': td['title'],
                    'artist': artist,
                    'album_name': td.get('album_name', ''),
                    'album_art_url': td.get('album_art_url', ''),
                    'duration_ms': td.get('duration_ms', 0),
                    'preview_url': td.get('preview_url', ''),
                    'spotify_uri': td.get('spotify_uri', ''),
                    'is_explicit': td.get('is_explicit', False),
                    'release_date': td.get('release_date', ''),
                    'genres': artist.genres,
                }
            )
            if created:
                spotify_ids_to_fetch.append(td['spotify_id'])

        # Step 3: Fetch specific artists if provided
        specific_artists = options.get('artists') or [
            'Drake', 'Billie Eilish', 'The Weeknd', 'Taylor Swift',
            'Kanye West', 'Sabrina Carpenter', 'Olivia Rodrigo',
            'Travis Scott', 'Dua Lipa', 'Bad Bunny',
            'Kendrick Lamar', 'SZA', 'Ariana Grande', 'Post Malone',
            'Doja Cat', 'Harry Styles', 'BTS', 'Ed Sheeran',
            'Rihanna', 'Bruno Mars',
        ]

        self.stdout.write(f'🎤 Fetching top tracks for {len(specific_artists)} artists...')
        for artist_name in specific_artists:
            from scraper.spotify_scraper import get_spotify_client
            try:
                sp = get_spotify_client()
                results = sp.search(q=f'artist:{artist_name}', type='artist', limit=1)
                artists = results.get('artists', {}).get('items', [])
                if not artists:
                    continue
                sp_artist = artists[0]
                artist_sid = sp_artist['id']

                artist, _ = Artist.objects.update_or_create(
                    spotify_id=artist_sid,
                    defaults={
                        'name': sp_artist['name'],
                        'image_url': sp_artist['images'][0]['url'] if sp_artist.get('images') else '',
                        'genres': sp_artist.get('genres', []),
                        'popularity': sp_artist.get('popularity', 0),
                        'followers_count': sp_artist.get('followers', {}).get('total', 0),
                    }
                )

                top_tracks = fetch_artist_top_tracks(artist_sid)
                for tt in top_tracks:
                    track, created = Track.objects.update_or_create(
                        spotify_id=tt['spotify_id'],
                        defaults={
                            'title': tt['title'],
                            'artist': artist,
                            'album_name': tt.get('album_name', ''),
                            'album_art_url': tt.get('album_art_url', ''),
                            'duration_ms': tt.get('duration_ms', 0),
                            'preview_url': tt.get('preview_url', ''),
                            'spotify_uri': tt.get('spotify_uri', ''),
                            'popularity': tt.get('popularity', 0),
                            'is_explicit': tt.get('is_explicit', False),
                            'release_date': tt.get('release_date', ''),
                            'genres': artist.genres,
                        }
                    )
                    if created:
                        spotify_ids_to_fetch.append(tt['spotify_id'])

                self.stdout.write(f'   ✅ {artist.name}: {len(top_tracks)} tracks')
                time.sleep(0.2)
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'   ❌ Error with {artist_name}: {e}'))

        # Step 4: Fetch audio features for ML
        if spotify_ids_to_fetch:
            self.stdout.write(f'🎧 Fetching audio features for {len(spotify_ids_to_fetch)} tracks...')
            features = fetch_audio_features(spotify_ids_to_fetch)
            for sid, feat in features.items():
                Track.objects.filter(spotify_id=sid).update(audio_features=feat)
            self.stdout.write(f'   ✅ Updated {len(features)} tracks with audio features')

        # Step 5: Fetch genre tags from Last.fm
        self.stdout.write('🏷️  Fetching genre tags from Last.fm...')
        for artist in Artist.objects.all()[:30]:
            if not artist.genres:
                tags = fetch_artist_tags(artist.name)
                if tags:
                    artist.genres = tags
                    artist.save()
                    self.stdout.write(f'   🏷️  {artist.name}: {tags}')
                time.sleep(0.2)

        total_artists = Artist.objects.count()
        total_tracks = Track.objects.count()
        self.stdout.write(self.style.SUCCESS(
            f'\n🎉 Scraping complete! {total_artists} artists, {total_tracks} tracks in database.'
        ))
