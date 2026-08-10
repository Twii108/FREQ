from django.contrib import admin
from .models import Post, Like, Comment, Repost, Bookmark, ListeningActivity

admin.site.register(Post)
admin.site.register(Like)
admin.site.register(Comment)
admin.site.register(Repost)
admin.site.register(Bookmark)
admin.site.register(ListeningActivity)
