from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q, Count
from .models import Artist, Track, VinylWallItem
from .serializers import ArtistSerializer, TrackSerializer, VinylWallItemSerializer


class ArtistListView(APIView):
    """GET /api/music/artists/?q=search&genre=pop"""

    def get(self, request):
        artists = Artist.objects.all()
        q = request.query_params.get('q', '').strip()
        genre = request.query_params.get('genre', '').strip()
        if q:
            artists = artists.filter(name__icontains=q)
        if genre:
            artists = artists.filter(genres__contains=[genre])
        artists = artists[:50]
        serializer = ArtistSerializer(artists, many=True)
        return Response(serializer.data)


class ArtistDetailView(APIView):
    """GET /api/music/artists/<id_or_name>/"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, artist_id):
        import urllib.request
        import urllib.parse
        import json
        from .scraper import fetch_wikipedia_artist_bio

        artist = Artist.objects.filter(name__iexact=artist_id).first()
        if not artist and len(str(artist_id)) == 24:
            try:
                artist = Artist.objects.filter(id=artist_id).first()
            except Exception:
                artist = None

        if not artist:
            artist = Artist.objects.filter(name__icontains=artist_id).first()

        # If not in local database, fetch dynamically from iTunes API!
        if not artist:
            try:
                url = f"https://itunes.apple.com/search?term={urllib.parse.quote(artist_id)}&entity=song&limit=15"
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=5) as response:
                    res_data = json.loads(response.read().decode())
                    results = res_data.get('results', [])
                    if results:
                        item0 = results[0]
                        artist, _ = Artist.objects.get_or_create(
                            name=item0.get('artistName', artist_id),
                            defaults={
                                'spotify_id': f"itunes-{item0.get('artistId')}",
                                'image_url': item0.get('artworkUrl100', '').replace('100x100bb', '600x600bb'),
                                'genres': [item0.get('primaryGenreName', 'Pop')],
                                'popularity': 95
                            }
                        )
                        for item in results:
                            t_title = item.get('trackName')
                            preview_url = item.get('previewUrl')
                            album_art = item.get('artworkUrl100', '').replace('100x100bb', '600x600bb')
                            album_name = item.get('collectionName', '')
                            if t_title and preview_url:
                                Track.objects.get_or_create(
                                    spotify_id=f"itunes-{item.get('trackId')}",
                                    defaults={
                                        'title': t_title,
                                        'artist': artist,
                                        'album_name': album_name,
                                        'album_art_url': album_art,
                                        'preview_url': preview_url,
                                        'popularity': 90
                                    }
                                )
            except Exception as e:
                print("iTunes Artist detail fetch error:", e)

        if not artist:
            return Response({'error': 'Artist not found'}, status=status.HTTP_404_NOT_FOUND)

        # Fetch live iTunes tracks & albums
        raw_tracks = []
        try:
            import ssl
            ctx = ssl._create_unverified_context()
            url = f"https://itunes.apple.com/search?term={urllib.parse.quote(artist.name)}&entity=song&limit=15"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, context=ctx, timeout=5) as response:
                res_data = json.loads(response.read().decode())
                results = res_data.get('results', [])
                if results:
                    artist.image_url = results[0].get('artworkUrl100', '').replace('100x100bb', '600x600bb')
                    artist.save()
                    for item in results:
                        t_title = item.get('trackName')
                        preview_url = item.get('previewUrl')
                        album_art = item.get('artworkUrl100', '').replace('100x100bb', '600x600bb')
                        album_name = item.get('collectionName', 'Single')
                        if t_title and preview_url:
                            t_obj, _ = Track.objects.get_or_create(
                                spotify_id=f"itunes-{item.get('trackId')}",
                                defaults={
                                    'title': t_title,
                                    'artist': artist,
                                    'album_name': album_name,
                                    'album_art_url': album_art,
                                    'preview_url': preview_url,
                                    'popularity': 95
                                }
                            )
                            raw_tracks.append({
                                'id': str(t_obj.id),
                                'title': t_title,
                                'artist_name': artist.name,
                                'album_name': album_name,
                                'album_art_url': album_art,
                                'preview_url': preview_url
                            })
        except Exception as e:
            import traceback
            traceback.print_exc()
            print("iTunes detail error:", e)


        data = dict(ArtistSerializer(artist).data)
        data['tracks'] = raw_tracks
        data['albums'] = list(set([t['album_name'] for t in raw_tracks if t.get('album_name')]))
        if not data.get('bio'):
            data['bio'] = fetch_wikipedia_artist_bio(artist.name)

        return Response(data)










        if not data.get('bio'):
            data['bio'] = fetch_wikipedia_artist_bio(artist.name)

        return Response(data)




class TrackListView(APIView):
    """GET /api/music/tracks/?q=search&artist_id=1"""

    def get(self, request):
        tracks = Track.objects.select_related('artist').all()
        q = request.query_params.get('q', '').strip()
        artist_id = request.query_params.get('artist_id')
        if q:
            tracks = tracks.filter(Q(title__icontains=q) | Q(artist__name__icontains=q))
        if artist_id:
            tracks = tracks.filter(artist_id=artist_id)
        tracks = tracks[:50]
        serializer = TrackSerializer(tracks, many=True, context={'request': request})
        return Response(serializer.data)


class TrackDetailView(APIView):
    """GET /api/music/tracks/<id>/"""

    def get(self, request, track_id):
        try:
            track = Track.objects.select_related('artist').get(id=track_id)
        except Track.DoesNotExist:
            return Response({'error': 'Track not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = TrackSerializer(track, context={'request': request})
        return Response(serializer.data)


class TrendingTracksView(APIView):
    """GET /api/music/tracks/trending/ - Tracks most added to vinyl walls."""

    def get(self, request):
        tracks = Track.objects.annotate(
            wall_count=Count('vinyl_appearances')
        ).order_by('-wall_count', '-popularity')[:20]
        serializer = TrackSerializer(tracks, many=True, context={'request': request})
        return Response(serializer.data)


class VinylWallView(APIView):
    """GET /api/music/vinyl-wall/<username>/ - User's vinyl wall.
       POST /api/music/vinyl-wall/ - Add track to own wall.
       DELETE /api/music/vinyl-wall/<item_id>/ - Remove from wall."""

    def get(self, request, username=None):
        from accounts.models import User
        if username:
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            user = request.user
        items = VinylWallItem.objects.filter(user=user).select_related('track__artist')
        serializer = VinylWallItemSerializer(items, many=True)
        return Response(serializer.data)

    def post(self, request):
        track_id = request.data.get('track_id')
        note = request.data.get('note', '')
        try:
            track = Track.objects.get(id=track_id)
        except Track.DoesNotExist:
            return Response({'error': 'Track not found'}, status=status.HTTP_404_NOT_FOUND)
        max_pos = VinylWallItem.objects.filter(user=request.user).count()
        item, created = VinylWallItem.objects.get_or_create(
            user=request.user, track=track,
            defaults={'position': max_pos, 'note': note}
        )
        if not created:
            return Response({'error': 'Already in vinyl wall'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = VinylWallItemSerializer(item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request, item_id=None):
        try:
            item = VinylWallItem.objects.get(id=item_id, user=request.user)
            item.delete()
            return Response({'status': 'removed'})
        except VinylWallItem.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class VinylWallReorderView(APIView):
    """PUT /api/music/vinyl-wall/reorder/ - Reorder vinyl wall items."""

    def put(self, request):
        items = request.data.get('items', [])
        for item_data in items:
            try:
                item = VinylWallItem.objects.get(id=item_data['id'], user=request.user)
                item.position = item_data['position']
                item.save()
            except (VinylWallItem.DoesNotExist, KeyError):
                continue
        return Response({'status': 'reordered'})


class SearchView(APIView):
    """GET /api/music/search/?q=query - Unified search for Artists and Tracks."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):

        import urllib.request
        import urllib.parse
        import json

        q = request.query_params.get('q', '').strip()
        if len(q) < 2:
            return Response({'artists': [], 'tracks': []})

        # 1. Fetch Artists from iTunes API
        try:
            url_artist = f"https://itunes.apple.com/search?term={urllib.parse.quote(q)}&entity=musicArtist&limit=8"
            req = urllib.request.Request(url_artist, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=4) as response:
                data = json.loads(response.read().decode())
                for item in data.get('results', []):
                    artist_name = item.get('artistName')
                    artist_id = str(item.get('artistId'))
                    if artist_name and artist_id:
                        Artist.objects.get_or_create(
                            spotify_id=f"itunes-{artist_id}",
                            defaults={
                                'name': artist_name,
                                'image_url': f"https://images.weserv.nl/?url=is1-ssl.mzstatic.com/image/thumb/Music/v4/avatar.jpg&we=1",
                                'genres': [item.get('primaryGenreName', 'Pop')],
                                'popularity': 90
                            }
                        )
        except Exception as e:
            print("iTunes Artist search error:", e)

        # 2. Fetch Songs from iTunes API
        try:
            url_song = f"https://itunes.apple.com/search?term={urllib.parse.quote(q)}&entity=song&limit=15"
            req = urllib.request.Request(url_song, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=4) as response:
                data = json.loads(response.read().decode())
                for item in data.get('results', []):
                    artist_name = item.get('artistName')
                    track_title = item.get('trackName')
                    preview_url = item.get('previewUrl')
                    album_name = item.get('collectionName', '')
                    album_art = item.get('artworkUrl100', '').replace('100x100bb', '400x400bb')
                    track_id = str(item.get('trackId'))
                    artist_id = str(item.get('artistId'))

                    if not artist_name or not track_title or not preview_url:
                        continue

                    artist, _ = Artist.objects.get_or_create(
                        spotify_id=f"itunes-{artist_id}",
                        defaults={
                            'name': artist_name,
                            'image_url': album_art,
                            'genres': [item.get('primaryGenreName', 'Pop')],
                            'popularity': 85
                        }
                    )
                    if artist.image_url.endswith('avatar.jpg'):
                        artist.image_url = album_art
                        artist.save()

                    t_obj, created = Track.objects.get_or_create(
                        spotify_id=f"itunes-{track_id}",
                        defaults={
                            'title': track_title,
                            'artist': artist,
                            'album_name': album_name,
                            'album_art_url': album_art,
                            'preview_url': preview_url,
                            'popularity': 90,
                            'genres': [item.get('primaryGenreName', 'Pop')]
                        }
                    )
                    if not created and preview_url and t_obj.preview_url != preview_url:
                        t_obj.preview_url = preview_url
                        t_obj.save()
        except Exception as e:
            print("iTunes Song search error:", e)

        # 3. Retrieve matching Artists & Tracks from DB
        artists = Artist.objects.filter(name__icontains=q)[:10]
        tracks = Track.objects.filter(
            Q(title__icontains=q) | Q(artist__name__icontains=q)
        ).select_related('artist')[:15]

        return Response({
            'artists': ArtistSerializer(artists, many=True).data,
            'tracks': TrackSerializer(tracks, many=True, context={'request': request}).data,
        })



class ScrapeInfoView(APIView):
    """GET /api/music/scrape-info/?title=song&artist=name - Scrape live lyrics & artist bio."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from .scraper import scrape_track_lyrics_and_bio
        from freq_backend.cache_utils import get_cached_data, set_cached_data

        title = request.query_params.get('title', '').strip()
        artist = request.query_params.get('artist', '').strip()

        if not title:
            return Response({'error': 'Title parameter required'}, status=status.HTTP_400_BAD_REQUEST)

        cache_key = f"scraped_info_{hash(title.lower() + artist.lower())}"
        cached_data = get_cached_data(cache_key)
        if cached_data:
            return Response(cached_data)

        info = scrape_track_lyrics_and_bio(title, artist)
        set_cached_data(cache_key, info, timeout_seconds=86400) # Cache for 24 hours
        return Response(info)

