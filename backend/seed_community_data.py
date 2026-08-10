import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freq_backend.settings')
django.setup()

from accounts.models import User, FavoriteArtist, Follow, Notification
from music.models import Track, Artist, VinylWallItem
from chat.models import ChatRoom, Message, RoomMembership

def seed_data():
    print("--- Seeding FREQ Prototype Community & Fan Clubs ---")


    # 1. Create Prototype Users
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
            print(f"  + Created user: {u.username}")

        # Seed favorite artists
        for art in udata['favorite_artists']:
            FavoriteArtist.objects.get_or_create(
                user=u,
                artist_name=art,
                defaults={'artist_image_url': udata['avatar_url']}
            )
        users_map[u.username] = u

    # 2. Create Fan Club Chat Rooms & Seed Conversations
    FAN_CLUBS = [
        {
            'name': 'Swifties Global Lounge',
            'description': 'The official fan club for Taylor Swift fans worldwide! Discuss Eras Tour & new lyrics.',
            'room_type': 'general',
            'cover': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500',
            'conversations': [
                ('tanvi_roliya', 'Hey Swifties! Has anyone analyzed the vault track lyrics yet? 💜'),
                ('melody_finder', 'Yes! The acoustic bridge on track 5 is absolute perfection.'),
                ('alex_beats', 'I synth-mixed a live acoustic cover of Cruel Summer last night, let me know what you think! 🎧'),
                ('sarah_vibe', 'The Eras Tour setlist is legendary. Which surprise song was your favorite so far? 🔮'),
                ('rhythm_king', 'Even as a hip-hop head, Taylor’s songwriting on Folklore deserves pure respect 🔥')
            ]
        },
        {
            'name': 'The Weeknd XO Club',
            'description': 'Midnight synthesizers, After Hours & Hurry Up Tomorrow discussions.',
            'room_type': 'artist',
            'cover': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
            'conversations': [
                ('alex_beats', 'Abel just teased new studio snippets for the trilogy finale! ⚡'),
                ('rhythm_king', 'The production on Blinding Lights is unmatched. Peak 80s synthwave.'),
                ('melody_finder', 'I still get chills listening to Die For You on vinyl 🖤'),
                ('tanvi_roliya', 'Who is attending the stadium tour in London or NYC?')
            ]
        },
        {
            'name': 'Lo-Fi Chill & Study Haven',
            'description': 'Relaxing beats, rainy cafe ambient sounds, and focus music chat.',
            'room_type': 'genre',
            'cover': 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=500',
            'conversations': [
                ('melody_finder', 'Welcome to the chill lounge! Coffee brewed and lo-fi beats playing ☕🌿'),
                ('sarah_vibe', 'Rainy afternoon studying vibes... any recommendation for slow chillhop?'),
                ('alex_beats', 'Check out Lofi Girl’s latest 24/7 stream or Nujabes nostalgia mix! 🎧')
            ]
        },
        {
            'name': 'Hip-Hop Cypher & Beats',
            'description': 'Share new hip-hop drops, freestyle bars, and production techniques.',
            'room_type': 'genre',
            'cover': 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=500',
            'conversations': [
                ('rhythm_king', 'NYC Hip-Hop listening session is live! What album drop was the best this year? 🎤'),
                ('alex_beats', 'Kendrick’s lyrical depth on the new album set a whole new bar.'),
                ('tanvi_roliya', 'The beat switches on Travis Scott’s tour were insane 🔥')
            ]
        }
    ]

    for club in FAN_CLUBS:
        room, r_created = ChatRoom.objects.get_or_create(
            name=club['name'],
            defaults={
                'description': club['description'],
                'room_type': club['room_type'],
                'cover_image_url': club['cover'],
                'created_by': users_map.get('alex_beats')
            }
        )
        print(f"  + Configured Fan Club Room: {room.name}")
        # Ensure members
        for username, uobj in users_map.items():
            RoomMembership.objects.get_or_create(room=room, user=uobj)

        # Seed realistic messages
        for sender_uname, msg_text in club.get('conversations', []):
            sender_obj = users_map.get(sender_uname)
            if sender_obj:
                Message.objects.get_or_create(
                    room=room,
                    sender=sender_obj,
                    content=msg_text
                )

    # Seed Direct Messages (DMs) between key users
    from chat.models import DirectMessage
    DM_CONVERSATIONS = [
        ('tanvi_roliya', 'alex_beats', 'Hey Alex! Loved your synth remix post on the feed! 🎧'),
        ('alex_beats', 'tanvi_roliya', 'Thanks Tanvi! I am working on an acoustic synth mashup next! 🎵'),
        ('tanvi_roliya', 'alex_beats', 'That sounds amazing! Send me a preview when it is ready ✨'),
        ('rhythm_king', 'melody_finder', 'Yo! Did you check out the new R&B beats drop?'),
        ('melody_finder', 'rhythm_king', 'Yes! Adding it to my vinyl collection playlist right now ☕')
    ]

    for sender_u, recv_u, content in DM_CONVERSATIONS:
        s_obj = users_map.get(sender_u)
        r_obj = users_map.get(recv_u)
        if s_obj and r_obj:
            DirectMessage.objects.get_or_create(
                sender=s_obj,
                receiver=r_obj,
                content=content
            )
    print("  + Seeded Direct Message (DM) conversations between users.")

    # 3. Seed Social Posts (Public & Friends-Only)
    from social.models import Post
    POSTS_DATA = [
        {
            'username': 'tanvi_roliya',
            'content': 'Just spent the afternoon listening to Taylor Swift Eras Tour setlist on vinyl! 💖 What is your ultimate comfort song?',
            'image_url': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600',
            'is_public': True,
            'is_hot_take': False
        },
        {
            'username': 'tanvi_roliya',
            'content': '🔒 Friends Exclusive: Secret playlist I made for late night acoustic mood. Only for my close FREQ friends! 🎧',
            'image_url': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600',
            'is_public': False,
            'is_hot_take': False
        },
        {
            'username': 'alex_beats',
            'content': 'Synthesizer session done! 80s analog synthwave vibes hit different at 2 AM ⚡',
            'image_url': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
            'is_public': True,
            'is_hot_take': True
        },
        {
            'username': 'alex_beats',
            'content': '🔒 Friends Only Drop: Unreleased synthwave track preview for my circle! Let me know what you think 🔥',
            'image_url': 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600',
            'is_public': False,
            'is_hot_take': False
        },
        {
            'username': 'melody_finder',
            'content': 'Rainy London evening with vinyl spinning SZA and Frank Ocean ☕ Cozy beats all night.',
            'image_url': 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600',
            'is_public': True,
            'is_hot_take': False
        },
        {
            'username': 'rhythm_king',
            'content': 'Hot Take 🎤 Hip-Hop production in 2026 is reaching a whole new level of sampling brilliance.',
            'image_url': 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=600',
            'is_public': True,
            'is_hot_take': True
        },
        {
            'username': 'sarah_vibe',
            'content': 'Roadtrip acoustic playlist under the stars 🌿 Acoustic guitar + mountain air = magic.',
            'image_url': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600',
            'is_public': True,
            'is_hot_take': False
        }
    ]

    for p in POSTS_DATA:
        u = users_map.get(p['username'])
        if u:
            Post.objects.get_or_create(
                user=u,
                content=p['content'],
                defaults={
                    'image_url': p['image_url'],
                    'is_public': p['is_public'],
                    'is_hot_take': p['is_hot_take']
                }
            )

    print("FREQ Seeding Complete with Social Posts!")


if __name__ == '__main__':
    seed_data()

