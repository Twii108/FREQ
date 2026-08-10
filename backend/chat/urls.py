from django.urls import path
from . import views

urlpatterns = [
    path('rooms/', views.ChatRoomListView.as_view(), name='room_list'),
    path('rooms/<str:room_id>/', views.ChatRoomDetailView.as_view(), name='room_detail'),
    path('rooms/<str:room_id>/join/', views.JoinRoomView.as_view(), name='join_room'),
    path('rooms/<str:room_id>/leave/', views.LeaveRoomView.as_view(), name='leave_room'),
    path('rooms/<str:room_id>/send/', views.SendRoomMessageView.as_view(), name='send_room_message'),
    path('rooms/<str:room_id>/members/', views.RoomMembersListView.as_view(), name='room_members'),
    path('dms/', views.DMListView.as_view(), name='dm_list'),
    path('dms/<str:user_id>/', views.DMDetailView.as_view(), name='dm_detail'),
    path('dms/<str:user_id>/send/', views.SendDMView.as_view(), name='send_dm'),
    path('blast/', views.BlastMessageView.as_view(), name='blast'),
    path('requests/', views.MessageRequestListView.as_view(), name='msg_requests'),
    path('requests/<str:request_id>/', views.AcceptRejectRequestView.as_view(), name='accept_reject_request'),
]
