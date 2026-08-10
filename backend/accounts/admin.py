from django.contrib import admin
from .models import User, FavoriteArtist, Follow, Notification

admin.site.register(User)
admin.site.register(FavoriteArtist)
admin.site.register(Follow)
admin.site.register(Notification)
