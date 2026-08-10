import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freq_backend.settings')
django.setup()

from accounts.models import User, FavoriteArtist, Follow, Notification
from music.models import Track, Artist, VinylWallItem
from chat.models import ChatRoom, Message, RoomMembership
from social.models import Post

def seed_large_database():
    print("=== FREQ Seeding Large Production Database ===")

    PROTOTYPE_USERS = [
        {
            'username': 'tanvi_roliya',
            'email': 'tanvi@freq.com',
            'password': 'password123',
            'bio': 'Swiftie for life 💖 Pop & Acoustic lover | Always listening to Taylor & Arijit',
            'avatar_url': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
            'age': 21,
            'gender': 'Female',
            'gender_preference': 'Both',
            'city': 'Mumbai',
            'country': 'India',
            'country_flag': '🇮🇳',
            'favorite_genres': ['Pop', 'Acoustic', 'R&B'],
            'favorite_artists': ['Taylor Swift', 'Arijit Singh', 'Olivia Rodrigo']
        },
        {
            'username': 'alex_beats',
            'email': 'alex@freq.com',
            'password': 'password123',
            'bio': 'Synthwave & Electronic producer 🎧 Building late night midnight vibes',
            'avatar_url': 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300',
            'age': 24,
            'gender': 'Male',
            'gender_preference': 'Both',
            'city': 'San Francisco',
            'country': 'United States',
            'country_flag': '🇺🇸',
            'favorite_genres': ['Electronic', 'House', 'Synthwave'],
            'favorite_artists': ['The Weeknd', 'Daft Punk', 'Alan Walker']
        },
        {
            'username': 'melody_finder',
            'email': 'melody@freq.com',
            'password': 'password123',
            'bio': 'Curating R&B and Lo-Fi soul tracks ☕ Coffee & vinyl enthusiast',
            'avatar_url': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300',
            'age': 22,
            'gender': 'Female',
            'gender_preference': 'Female',
            'city': 'London',
            'country': 'United Kingdom',
            'country_flag': '🇬🇧',
            'favorite_genres': ['R&B', 'Lo-Fi', 'Pop'],
            'favorite_artists': ['SZA', 'Frank Ocean', 'The Weeknd']
        },
        {
            'username': 'rhythm_king',
            'email': 'marcus@freq.com',
            'password': 'password123',
            'bio': 'Hip-Hop head & beat collector 🎤 Kendrick & Travis scott fanatic',
            'avatar_url': 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300',
            'age': 25,
            'gender': 'Male',
            'gender_preference': 'Both',
            'city': 'New York',
            'country': 'United States',
            'country_flag': '🇺🇸',
            'favorite_genres': ['Hip Hop', 'Rap', 'Trap'],
            'favorite_artists': ['Kendrick Lamar', 'Travis Scott', 'Drake', 'Kanye West']
        },
        {
            'username': 'sarah_vibe',
            'email': 'sarah@freq.com',
            'password': 'password123',
            'bio': 'Indie rock & folk acoustics 🌿 Road trips & stargazing playlists',
            'avatar_url': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
            'age': 23,
            'gender': 'Female',
            'gender_preference': 'Both',
            'city': 'Vancouver',
            'country': 'Canada',
            'country_flag': '🇨🇦',
            'favorite_genres': ['Indie', 'Folk', 'Rock'],
            'favorite_artists': ['Zach Bryan', 'Coldplay', 'Lana Del Rey']
        },
        {
            'username': 'arjun_vibe',
            'email': 'arjun@freq.com',
            'password': 'password123',
            'bio': 'Bollywood classical fusion & Coke Studio beats 🎻 Music is life',
            'avatar_url': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
            'age': 23,
            'gender': 'Male',
            'gender_preference': 'Both',
            'city': 'Delhi',
            'country': 'India',
            'country_flag': '🇮🇳',
            'favorite_genres': ['Bollywood', 'Classical', 'Pop'],
            'favorite_artists': ['Arijit Singh', 'Pritam', 'AR Rahman']
        },
        {
            'username': 'chloe_grooves',
            'email': 'chloe@freq.com',
            'password': 'password123',
            'bio': 'Deep House & Techno DJ from Berlin 🎧 late night raves',
            'avatar_url': 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300',
            'age': 26,
            'gender': 'Female',
            'gender_preference': 'Both',
            'city': 'Berlin',
            'country': 'Germany',
            'country_flag': '🇩🇪',
            'favorite_genres': ['Techno', 'Deep House', 'Electronic'],
            'favorite_artists': ['Daft Punk', 'Alan Walker', 'Martin Garrix']
        }
    ]

    users_map = {}
    for udata in PROTOTYPE_USERS:
        u, created = User.objects.get_or_create(
            username=udata['username'],
            defaults={
                'email': udata['email'],
                'bio': udata['bio'],
                'avatar_url': udata['avatar_url'],
                'age': udata['age'],
                'gender': udata['gender'],
                'gender_preference': udata['gender_preference'],
                'city': udata['city'],
                'country': udata['country'],
                'country_flag': udata['country_flag'],
                'favorite_genres': udata['favorite_genres']
            }
        )
        if created:
            u.set_password(udata['password'])
            u.save()
            print(f" + User created: {u.username}")
        users_map[u.username] = u

    # Real Artist Images Dictionary
    ARTIST_IMAGES = {
        'Taylor Swift': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
        'Arijit Singh': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300',
        'Olivia Rodrigo': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
        'The Weeknd': 'https://images.unsplash.com/photo-1571327073757-71d13c24de36?w=300',
        'Daft Punk': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300',
        'Alan Walker': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300',
        'SZA': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
        'Frank Ocean': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
        'Kendrick Lamar': 'https://images.unsplash.com/photo-1520638023430-8d6554b4f5d6?w=300',
        'Travis Scott': 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300',
        'Drake': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
        'Kanye West': 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300',
        'Zach Bryan': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300',
        'Coldplay': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300',
        'Lana Del Rey': 'https://images.unsplash.com/photo-1549834185-bd9f078a5dfe?w=300',
        'Pritam': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
        'AR Rahman': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
        'Martin Garrix': 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300',
        'Sabrina Carpenter': 'https://images.unsplash.com/photo-1516280440502-124b8d7eb80a?w=300'
    }

    # Seed FavoriteArtist objects for users
    for udata in PROTOTYPE_USERS:
        u = users_map[udata['username']]
        for artist in udata.get('favorite_artists', []):
            img_url = ARTIST_IMAGES.get(artist, 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300')
            FavoriteArtist.objects.get_or_create(
                user=u,
                artist_name=artist,
                defaults={'artist_image_url': img_url}
            )
    print(" + Favorite Artists seeded with profile images.")

    # Create Follow Relationships so Friends feed is full
    all_users = list(users_map.values())
    for u1 in all_users:
        for u2 in all_users:
            if u1 != u2:
                Follow.objects.get_or_create(follower=u1, following=u2)

    # 1. Purge non-music or old posts
    Post.objects.all().delete()
    print(" + Cleared old posts database.")

    # 2. Seed 100% Music, Artist Gossip, Concert Meetup & Song Recommendation Posts
    MUSIC_POSTS = [
        {
            'username': 'alex_beats',
            'content': '⚡ THE WEEKND NEWS: Abel just posted a teaser from the studio! Visuals for the final chapter album look insane. Here is his latest official press photo 🔥',
            'image_url': 'https://images.unsplash.com/photo-1571327073757-71d13c24de36?w=600',
            'is_public': True,
            'is_hot_take': False
        },
        {
            'username': 'alex_beats',
            'content': '🎟️ THE WEEKND AFTER HOURS STADIUM TOUR LONDON! Who is attending at Wembley Stadium next weekend? Group meetup outside Gate 3! 🎧',
            'image_url': 'https://images.weserv.nl/?url=is1-ssl.mzstatic.com/image/thumb/Music114/v4/cc/65/5f/cc655fe6-71d5-bc44-5d51-6df731f2cc05/20UMGIM81373.rgb.jpg/600x600bb.jpg',
            'is_public': True,
            'is_hot_take': False
        },
        {
            'username': 'tanvi_roliya',
            'content': '🎟️ ERAS TOUR MUMBAI CONCERT MEETUP! Who else is going to Section B4 on Saturday? Let\'s link up before the gates open! DM me here on FREQ! 💖✨',
            'image_url': 'https://images.weserv.nl/?url=is1-ssl.mzstatic.com/image/thumb/Music115/v4/e9/c0/88/e9c088ef-2272-965a-0205-0210e74f1418/24UMGIM10359.rgb.jpg/600x600bb.jpg',
            'is_public': True,
            'is_hot_take': False
        },
        {
            'username': 'tanvi_roliya',
            'content': '🤫 Artist Gossip: Taylor Swift reportedly spotted leaving electric lady studios in NYC with Lana Del Rey! Here is Taylor\'s latest backstage acoustic snapshot 🎙️',
            'image_url': 'https://images.unsplash.com/photo-1549834185-bd9f078a5dfe?w=600',
            'is_public': True,
            'is_hot_take': False
        },
        {
            'username': 'melody_finder',
            'content': '🎵 Song Recommendation: If you love late night R&B soul, listen to "SZA - Snooze" on vinyl. The vocal harmonies are perfection ☕',
            'image_url': 'https://images.weserv.nl/?url=is1-ssl.mzstatic.com/image/thumb/Music122/v4/e5/22/aa/e522aa4d-d790-2139-38b4-250868fbc6c5/196587754323.jpg/600x600bb.jpg',
            'is_public': True,
            'is_hot_take': False
        },
        {
            'username': 'rhythm_king',
            'content': '🎤 KENDRICK LAMAR & TRAVIS SCOTT NYC MEETUP! We are hosting a hip-hop cypher and listening party before the Brooklyn show. DM if coming!',
            'image_url': 'https://images.weserv.nl/?url=is1-ssl.mzstatic.com/image/thumb/Music112/v4/a4/09/2d/a4092d6e-82ef-5f12-fa8a-6b834927cbcd/22UMGIM48126.rgb.jpg/600x600bb.jpg',
            'is_public': True,
            'is_hot_take': False
        },
        {
            'username': 'sarah_vibe',
            'content': '🎟️ COLDPLAY LIVE WORLD TOUR VANCOUVER! Meeting up with 8 FREQ listeners at the main venue plaza! Who wants to join our squad?',
            'image_url': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600',
            'is_public': True,
            'is_hot_take': False
        },
        {
            'username': 'arjun_vibe',
            'content': '🎻 COKE STUDIO LIVE CONCERT DELHI! Arijit Singh & AR Rahman live performance next month! Who else got VIP standing passes?',
            'image_url': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
            'is_public': True,
            'is_hot_take': False
        },
        {
            'username': 'chloe_grooves',
            'content': '🎧 BERLIN TECHNO FESTIVAL MEETUP! Daft Punk tribute set starting tonight at 11 PM. Who is raving with us tonight? 🔊',
            'image_url': 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=600',
            'is_public': True,
            'is_hot_take': False
        }
    ]



    for p in MUSIC_POSTS:
        u = users_map.get(p['username'])
        if u:
            Post.objects.create(
                user=u,
                content=p['content'],
                image_url=p['image_url'],
                is_public=p['is_public'],
                is_hot_take=p.get('is_hot_take', False)
            )

    print("=== FREQ Seeding Complete with 100% Music & Concert Posts! ===")

if __name__ == '__main__':
    seed_large_database()

