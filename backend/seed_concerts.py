import os
import django
import datetime
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freq_backend.settings')
django.setup()

from social.models import Concert

def seed_concerts():
    print('Seeding concerts...')
    
    Concert.objects.all().delete()
    
    now = timezone.now()
    
    concerts = [
        {
            'title': 'The Eras Tour',
            'artist_name': 'Taylor Swift',
            'city': 'New York',
            'venue': 'MetLife Stadium',
            'date_time': now + datetime.timedelta(days=14, hours=20),
            'description': 'The Eras Tour is the ongoing sixth concert tour by American singer-songwriter Taylor Swift. Experience all musical eras!',
            'image_url': 'https://images.weserv.nl/?url=https://upload.wikimedia.org/wikipedia/en/3/3b/Taylor_Swift_-_The_Eras_Tour.png',
            'ticket_url': 'https://ticketmaster.com'
        },
        {
            'title': 'After Hours til Dawn Tour',
            'artist_name': 'The Weeknd',
            'city': 'Los Angeles',
            'venue': 'SoFi Stadium',
            'date_time': now + datetime.timedelta(days=30, hours=21),
            'description': 'Global stadium tour supporting his fourth and fifth studio albums.',
            'image_url': 'https://images.weserv.nl/?url=https://upload.wikimedia.org/wikipedia/en/e/e6/The_Weeknd_-_Blinding_Lights.png',
            'ticket_url': 'https://ticketmaster.com'
        },
        {
            'title': 'Rare Impact Tour',
            'artist_name': 'Selena Gomez',
            'city': 'Chicago',
            'venue': 'United Center',
            'date_time': now + datetime.timedelta(days=45, hours=19),
            'description': 'Supporting mental health initiatives worldwide with her biggest hits.',
            'image_url': 'https://images.weserv.nl/?url=https://upload.wikimedia.org/wikipedia/en/7/77/Selena_Gomez_-_Rare.png',
            'ticket_url': 'https://ticketmaster.com'
        },
        {
            'title': 'Aditya Gadhvi Live',
            'artist_name': 'Aditya Gadhvi',
            'city': 'Ahmedabad',
            'venue': 'Narendra Modi Stadium',
            'date_time': now + datetime.timedelta(days=5, hours=18),
            'description': 'The folk king returns for a massive navratri-style celebration.',
            'image_url': 'https://images.weserv.nl/?url=https://upload.wikimedia.org/wikipedia/commons/4/4b/Aditya_Gadhvi.jpg',
            'ticket_url': 'https://bookmyshow.com'
        },
        {
            'title': 'Arijit Singh: One Night Only',
            'artist_name': 'Arijit Singh',
            'city': 'Mumbai',
            'venue': 'Jio World Garden',
            'date_time': now + datetime.timedelta(days=10, hours=20),
            'description': 'An intimate evening with the voice of romance.',
            'image_url': 'https://images.weserv.nl/?url=https://upload.wikimedia.org/wikipedia/commons/a/ae/Arijit_Singh_at_GiMA_Awards_2015_%281%29.jpg',
            'ticket_url': 'https://bookmyshow.com'
        }
    ]
    
    for c in concerts:
        Concert.objects.create(**c)
        title = c['title']
        print(f'Created {title}')
        
    print(f'Successfully seeded {len(concerts)} concerts!')

if __name__ == '__main__':
    seed_concerts()
