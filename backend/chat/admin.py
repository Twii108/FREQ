from django.contrib import admin
from .models import ChatRoom, Message, DirectMessage, MessageRequest, RoomMembership

admin.site.register(ChatRoom)
admin.site.register(Message)
admin.site.register(DirectMessage)
admin.site.register(MessageRequest)
admin.site.register(RoomMembership)
