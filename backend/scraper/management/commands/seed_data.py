import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from music.models import Artist, Track
from chat.models import ChatRoom
from trivia.models import Quiz, TriviaQuestion, Badge
from social.models import Post

User = get_user_model()

ARTISTS = [
    {
        'name': 'The Weeknd',
        'spotify_id': '1XyoAEzJz3u1jUktRihNu6',
        'image_url': 'https://images.unsplash.com/photo-1571327073757-71d13c24de36?w=400',
        'genres': ['R&B', 'Pop', 'Synthpop'],
        'popularity': 98,
        'bio': 'Abel Makkonen Tesfaye, known professionally as The Weeknd, is a Canadian singer-songwriter and record producer.',
        'tracks': [
            {'title': 'Blinding Lights', 'album': 'After Hours', 'art': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400', 'duration': 200000, 'preview': 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/c4/88/4e/c4884ebb-b152-bfbd-cc64-ef02b9003bc4/mzaf_6433291583091048624.plus.aac.p.m4a', 'spotify_id': '0VjIjW4GlUZAMYd2vXMiOa'},
            {'title': 'Starboy', 'album': 'Starboy', 'art': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400', 'duration': 230000, 'preview': 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/a9/94/ef/a994ef71-5202-8682-a84c-c0c0349b1473/mzaf_6288674395893096234.plus.aac.p.m4a', 'spotify_id': '7wwjX7Z9fXm7S2W1KkO1L5'},
            {'title': 'Die For You', 'album': 'Starboy', 'art': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400', 'duration': 260000, 'preview': 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/42/e8/8a/42e88a03-2d84-decf-45f4-dec2bc6c67ef/mzaf_1130630489569102422.plus.aac.p.m4a', 'spotify_id': '2Ch7peQDw7ntAFi5SR76rS'},
            {'title': 'Save Your Tears', 'album': 'After Hours', 'art': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400', 'duration': 215000, 'preview': 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/a5/4a/01/a54a01bf-1698-e6c7-c4b4-d6a89c9cfdc9/mzaf_1038481234986745163.plus.aac.p.m4a', 'spotify_id': '5QO7feNgmgMvZYGj6s6n6X'},
            {'title': 'The Hills', 'album': 'Beauty Behind the Madness', 'art': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400', 'duration': 242000, 'preview': 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/d7/5b/4d/d75b4dbf-4d1e-2e92-c2ab-cfc4f74d9e50/mzaf_4723908233f20e402b5.plus.aac.p.m4a', 'spotify_id': '7fBv7CLKzipRk6EC6T0ORn'}
        ],
        'questions': [
            {'q': 'Which artist released the album "After Hours"?', 'a': 'Taylor Swift', 'b': 'The Weeknd', 'c': 'Drake', 'd': 'Bruno Mars', 'correct': 'b', 'cat': 'album'},
            {'q': 'What is The Weeknd\'s real name?', 'a': 'Abel Tesfaye', 'b': 'Aubrey Graham', 'c': 'Christopher Breaux', 'd': 'Jacques Webster', 'correct': 'a', 'cat': 'general'},
            {'q': 'Which track features French electronic duo Daft Punk?', 'a': 'Blinding Lights', 'b': 'The Hills', 'c': 'Starboy', 'd': 'Save Your Tears', 'correct': 'c', 'cat': 'lyrics'},
            {'q': 'In which year was the album "Starboy" released?', 'a': '2015', 'b': '2016', 'c': '2017', 'd': '2018', 'correct': 'b', 'cat': 'year'},
            {'q': 'Which track was featured in the Fifty Shades of Grey soundtrack?', 'a': 'Earned It', 'b': 'The Hills', 'c': 'Call Out My Name', 'd': 'Often', 'correct': 'a', 'cat': 'album'}
        ]
    },
    {
        'name': 'Taylor Swift',
        'spotify_id': '06HL4z0CvFAxyCO2zG51rj',
        'image_url': 'https://images.unsplash.com/photo-1549834185-bd9f078a5dfe?w=400',
        'genres': ['Pop', 'Country', 'Folk'],
        'popularity': 99,
        'bio': 'Taylor Alison Swift is an American singer-songwriter. Known for her genre-spanning discography, songwriting, and artistic reinventions.',
        'tracks': [
            {'title': 'Cruel Summer', 'album': 'Lover', 'art': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400', 'duration': 178000, 'preview': 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/1b/82/ff/1b82ff63-cf60-bf12-0faa-a8a599dc0b67/mzaf_4289898234907409204.plus.aac.p.m4a', 'spotify_id': '1BxfuN26g621VNaPT54nax'},
            {'title': 'Blank Space', 'album': '1989', 'art': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400', 'duration': 231000, 'preview': 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/38/ab/4e/38ab4e3d-ecf4-5f4d-ec2b-c67ef99d1469/mzaf_4874012398623409867.plus.aac.p.m4a', 'spotify_id': '1u8c2tll5ht1A0jUIjZ685'},
            {'title': 'Anti-Hero', 'album': 'Midnights', 'art': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400', 'duration': 200000, 'preview': 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/02/b5/4f/02b54f5a-eb36-bc5b-4e0d-9b4b9b9a6745/mzaf_1409230985472890289.plus.aac.p.m4a', 'spotify_id': '02M7Hw6G4o64u1v9Oh86NE'},
            {'title': 'Shake It Off', 'album': '1989', 'art': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400', 'duration': 219000, 'preview': 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/50/7d/8b/507d8bcf-4d1e-2e92-c2ab-cfc4f74d9e50/mzaf_1304958372349071034.plus.aac.p.m4a', 'spotify_id': '0x9924Z7f03a6c11d2345e'},
            {'title': 'Fortnight', 'album': 'The Tortured Poets Department', 'art': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400', 'duration': 228000, 'preview': 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/71/6d/f4/716df405-781a-7082-33f2-0e402b54f5ae/mzaf_1643909023409867512.plus.aac.p.m4a', 'spotify_id': '22g2t9z7g7eX11o74d23ab'}
        ],
        'questions': [
            {'q': 'Which Taylor Swift album features the track "Cruel Summer"?', 'a': '1989', 'b': 'Reputation', 'c': 'Lover', 'd': 'Folklore', 'correct': 'c', 'cat': 'album'},
            {'q': 'What was Taylor Swift\'s debut country single?', 'a': 'Tim McGraw', 'b': 'Teardrops on My Guitar', 'c': 'Our Song', 'd': 'Love Story', 'correct': 'a', 'cat': 'general'},
            {'q': 'How many Grammy Awards did Taylor Swift win for Album of the Year up to 2024?', 'a': '2', 'b': '3', 'c': '4', 'd': '5', 'correct': 'c', 'cat': 'general'},
            {'q': 'Which album has a black-and-white theme and newspaper font cover?', 'a': 'Midnights', 'b': 'Reputation', 'c': 'Speak Now', 'd': 'Red', 'correct': 'b', 'cat': 'album'},
            {'q': 'Who is featured on Taylor Swift\'s track "Fortnight"?', 'a': 'Ed Sheeran', 'b': 'Bon Iver', 'c': 'Post Malone', 'd': 'Lana Del Rey', 'correct': 'c', 'cat': 'lyrics'}
        ]
    },
    {
        'name': 'Billie Eilish',
        'spotify_id': '6qqNV0wWsnsqevQAea9Ijt',
        'image_url': 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400',
        'genres': ['Pop', 'Alternative', 'Indie'],
        'popularity': 95,
        'bio': 'Billie Eilish Pirate Baird O\'Connell is an American singer-songwriter. She first gained public attention in 2015 with her debut single "Ocean Eyes".',
        'tracks': [
            {'title': 'LUNCH', 'album': 'HIT ME HARD AND SOFT', 'art': 'https://images.unsplash.com/photo-1525683879097-df41b2a48e1a?w=400', 'duration': 180000, 'preview': 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/62/c4/a0/62c4a04c-f63c-f5f8-d6b3-8c238b0f8184/mzaf_1642930948956209867.plus.aac.p.m4a', 'spotify_id': '62t9z74d23ab22g2t9z7g7'},
            {'title': 'CHIHIRO', 'album': 'HIT ME HARD AND SOFT', 'art': 'https://images.unsplash.com/photo-1525683879097-df41b2a48e1a?w=400', 'duration': 303000, 'preview': 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/82/c4/04/82c404cf-63cf-5f84-d6b3-8c2382c404cf/mzaf_1495867490234098673.plus.aac.p.m4a', 'spotify_id': '22g2t9z7g7eX11o74d23ac'},
            {'title': 'Bad Guy', 'album': 'WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?', 'art': 'https://images.unsplash.com/photo-1525683879097-df41b2a48e1a?w=400', 'duration': 194000, 'preview': 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/50/a7/b0/50a7b003-a6c1-1d2a-a12b-54f58863bc11/mzaf_1249856983023490710.plus.aac.p.m4a', 'spotify_id': '21515v709gH24x11d234ee'},
            {'title': 'What Was I Made For?', 'album': 'Barbie The Album', 'art': 'https://images.unsplash.com/photo-1525683879097-df41b2a48e1a?w=400', 'duration': 222000, 'preview': 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/d8/46/c4/d846c4f7-4d9e-50f5-a701-968842e88a03/mzaf_1430948596702934098.plus.aac.p.m4a', 'spotify_id': '3Z01968846c4f74d9e50f5'}
        ],
        'questions': [
            {'q': 'What was Billie Eilish\'s breakout debut single uploaded to SoundCloud in 2015?', 'a': 'Bad Guy', 'b': 'Bellyache', 'c': 'Ocean Eyes', 'd': 'Lovely', 'correct': 'c', 'cat': 'lyrics'},
            {'q': 'Which movie features the song "What Was I Made For?"?', 'a': 'Barbie', 'b': 'Oppenheimer', 'c': 'Dune', 'd': 'La La Land', 'correct': 'a', 'cat': 'album'},
            {'q': 'Who is Billie Eilish\'s main producer and co-writer brother?', 'a': 'Finneas O\'Connell', 'b': 'Aron O\'Connell', 'c': 'Patrick O\'Connell', 'd': 'Liam O\'Connell', 'correct': 'a', 'cat': 'general'},
            {'q': 'What is the color theme of her album "HIT ME HARD AND SOFT"?', 'a': 'Yellow', 'b': 'Green', 'c': 'Red', 'd': 'Blue', 'correct': 'd', 'cat': 'album'},
            {'q': 'How old was Billie Eilish when she won her first Grammy for Album of the Year?', 'a': '17', 'b': '18', 'c': '19', 'd': '20', 'correct': 'b', 'cat': 'general'}
        ]
    }
]

MOCK_USERS = [
    {'username': 'alex_beats', 'email': 'alex@freq.com', 'age': 21, 'city': 'Mumbai', 'country': 'India', 'flag': '🇮🇳', 'genres': ['Pop', 'R&B'], 'avatar': 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'},
    {'username': 'melody_finder', 'email': 'melody@freq.com', 'age': 23, 'city': 'Paris', 'country': 'France', 'flag': '🇫🇷', 'genres': ['Electronic', 'Alternative'], 'avatar': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'},
    {'username': 'groove_rider', 'email': 'groove@freq.com', 'age': 24, 'city': 'Tokyo', 'country': 'Japan', 'flag': '🇯🇵', 'genres': ['Hip Hop', 'Pop'], 'avatar': 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150'},
    {'username': 'indie_ear', 'email': 'indie@freq.com', 'age': 22, 'city': 'London', 'country': 'UK', 'flag': '🇬🇧', 'genres': ['Indie', 'Rock'], 'avatar': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'}
]

class Command(BaseCommand):
    help = 'Seed database with high-quality mock music data for Freq app'

    def handle(self, *args, **options):
        self.stdout.write('Seeding Freq Database...')

        # 1. Create mock users
        user_objs = []
        for mu in MOCK_USERS:
            user, created = User.objects.get_or_create(
                username=mu['username'],
                defaults={
                    'email': mu['email'],
                    'age': mu['age'],
                    'city': mu['city'],
                    'country': mu['country'],
                    'country_flag': mu['flag'],
                    'favorite_genres': mu['genres'],
                    'avatar_url': mu['avatar'],
                    'status_text': f"Listening to some clean beats from {mu['city']}!",
                    'is_verified': random.choice([True, False])
                }
            )
            if created:
                user.set_password('freq-default-pass-123')
                user.save()
            user_objs.append(user)
        self.stdout.write(f'   Added {len(user_objs)} mock discovery users')

        # 2. Create artists & tracks
        for ad in ARTISTS:
            artist, _ = Artist.objects.update_or_create(
                spotify_id=ad['spotify_id'],
                defaults={
                    'name': ad['name'],
                    'image_url': ad['image_url'],
                    'genres': ad['genres'],
                    'popularity': ad['popularity'],
                    'bio': ad['bio'],
                    'followers_count': random.randint(1000000, 50000000)
                }
            )

            # Generate audio feature values
            for td in ad['tracks']:
                Track.objects.update_or_create(
                    spotify_id=td['spotify_id'],
                    defaults={
                        'title': td['title'],
                        'artist': artist,
                        'album_name': td['album'],
                        'album_art_url': td['art'],
                        'duration_ms': td['duration'],
                        'preview_url': td['preview'],
                        'popularity': random.randint(70, 99),
                        'release_date': '2023',
                        'genres': ad['genres'],
                        'audio_features': {
                            'danceability': round(random.uniform(0.4, 0.9), 3),
                            'energy': round(random.uniform(0.4, 0.9), 3),
                            'valence': round(random.uniform(0.3, 0.8), 3),
                            'tempo': random.randint(90, 160),
                            'acousticness': round(random.uniform(0.01, 0.4), 3)
                        }
                    }
                )

            # Create default Artist Chatroom
            ChatRoom.objects.update_or_create(
                name=f'{artist.name} Chatroom',
                defaults={
                    'description': f'Hangout for all fans of {artist.name}!',
                    'room_type': 'artist',
                    'artist': artist,
                    'cover_image_url': artist.image_url,
                }
            )

            # Create featured Quiz
            quiz, _ = Quiz.objects.update_or_create(
                title=f'{artist.name} Challenge',
                defaults={
                    'description': f'Test your knowledge on {artist.name}\'s career and hits!',
                    'cover_image_url': artist.image_url,
                    'quiz_type': 'artist',
                    'artist': artist,
                    'is_featured': True
                }
            )

            # Add 5 questions
            for qd in ad['questions']:
                TriviaQuestion.objects.get_or_create(
                    quiz=quiz,
                    question_text=qd['q'],
                    defaults={
                        'option_a': qd['a'],
                        'option_b': qd['b'],
                        'option_c': qd['c'],
                        'option_d': qd['d'],
                        'correct_option': qd['correct'],
                        'category': qd['cat'],
                        'difficulty': 'medium'
                    }
                )

        # 3. Create generic chatrooms & badges
        ChatRoom.objects.get_or_create(name='Global Music Lounge', defaults={'description': 'Main lounge to discuss tracks, concerts, and suggestions!', 'room_type': 'general'})
        ChatRoom.objects.get_or_create(name='Hip Hop & Rap Central', defaults={'description': 'Fresh hip hop releases, discussions, and ratings.', 'room_type': 'general'})

        Badge.objects.update_or_create(name='Swiftie Elite', defaults={'description': 'Scored 100% on Taylor Swift trivia', 'icon_url': '🏆'})
        Badge.objects.update_or_create(name='XO Representative', defaults={'description': 'Scored 100% on The Weeknd trivia', 'icon_url': '👑'})
        Badge.objects.update_or_create(name='Music Maestro', defaults={'description': 'Completed 5 quizzes with 80%+ scores', 'icon_url': '🎓'})

        # Seed favorite artists for mock users so their orbital images show up!
        try:
            from accounts.models import FavoriteArtist
            artists_pool = list(Artist.objects.filter(name__in=['The Weeknd', 'Taylor Swift', 'Billie Eilish']))
            for user in user_objs:
                for artist in artists_pool:
                    FavoriteArtist.objects.update_or_create(
                        user=user,
                        artist_name=artist.name,
                        defaults={
                            'artist_image_url': artist.image_url,
                            'spotify_id': artist.spotify_id
                        }
                    )
        except Exception:
            pass

        # 4. Generate mock posts in feed
        t_weeknd = Artist.objects.filter(name='The Weeknd').first()
        track_blinding = Track.objects.filter(title='Blinding Lights').first()

        Post.objects.get_or_create(
            content="Who's excited for the Weeknd's upcoming world tour? The new synth pop production style is just unmatched.",
            user=user_objs[0],
            defaults={
                'track': track_blinding,
                'tagged_artist': t_weeknd,
                'is_hot_take': False
            }
        )

        Post.objects.get_or_create(
            content="Opinion: Cruel Summer is the most infectious pop bridge of the decade. Do you agree or is it overrated?",
            user=user_objs[1],
            defaults={
                'is_hot_take': True,
                'rating': 4
            }
        )

        self.stdout.write(self.style.SUCCESS('Seed data successfully populated!'))
