from django.urls import path
from .consumers import ChatConsumer, DMConsumer

websocket_urlpatterns = [
    path('ws/chat/<str:room_id>/', ChatConsumer.as_asgi()),
    path('ws/dm/<str:user_id>/', DMConsumer.as_asgi()),
]
