import axios from 'axios';

const API_BASE_URL = `http://${window.location.hostname}:8000/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, { refresh: refreshToken });
        localStorage.setItem('access_token', response.data.access);
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.put('/auth/profile/', data),
  getPublicProfile: (username) => api.get(`/auth/profile/${username}/`),
  getFollowers: (username) => api.get(`/auth/profile/${username}/followers/`),
  getFollowing: (username) => api.get(`/auth/profile/${username}/following/`),
  followToggle: (userId) => api.post(`/auth/follow/${userId}/`),
  searchUsers: (q) => api.get(`/auth/search/?q=${q}`),
  getNotifications: () => api.get('/auth/notifications/'),
  getUnreadCount: () => api.get('/auth/notifications/unread-count/'),
  markAllNotificationsRead: () => api.post('/auth/notifications/read-all/'),
  discoverUsers: () => api.get('/auth/discover/'),
  getFavoriteArtists: () => api.get('/auth/favorite-artists/'),
  addFavoriteArtist: (data) => api.post('/auth/favorite-artists/', data),
  removeFavoriteArtist: (data) => api.delete('/auth/favorite-artists/', { data }),
  boostProfile: () => api.post('/auth/boost/'),
  deleteAccount: (password) => api.post('/auth/profile/delete/', { password }),
  blockToggle: (userId) => api.post(`/auth/block/${userId}/`),
  getBlockedUsers: () => api.get('/auth/blocked-users/'),
};

export const musicAPI = {
  getArtists: (params) => api.get('/music/artists/', { params }),
  getArtist: (artistId) => api.get(`/music/artists/${artistId}/`),
  getTracks: (params) => api.get('/music/tracks/', { params }),
  getTrack: (trackId) => api.get(`/music/tracks/${trackId}/`),
  getTrending: () => api.get('/music/tracks/trending/'),
  search: (q) => api.get(`/music/search/?q=${q}`),
  getVinylWall: (username) => api.get(`/music/vinyl-wall/${username}/`),
  addToVinylWall: (trackId) => api.post('/music/vinyl-wall/', { track_id: trackId }),
  removeFromVinylWall: (itemId) => api.delete(`/music/vinyl-wall/item/${itemId}/`),
  reorderVinylWall: (items) => api.put('/music/vinyl-wall/reorder/', { items }),
  scrapeInfo: (title, artist = '') => api.get(`/music/scrape-info/?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`),
};


export const socialAPI = {
  getFeed: (tab = 'foryou') => api.get(`/social/feed/?tab=${tab}`),
  createPost: (data) => api.post('/social/posts/', data),
  getPost: (id) => api.get(`/social/posts/${id}/`),
  deletePost: (id) => api.delete(`/social/posts/${id}/`),
  toggleLike: (postId) => api.post(`/social/posts/${postId}/like/`),
  getComments: (postId) => api.get(`/social/posts/${postId}/comments/`),
  addComment: (postId, content) => api.post(`/social/posts/${postId}/comments/`, { content }),
  toggleRepost: (postId) => api.post(`/social/posts/${postId}/repost/`),
  toggleBookmark: (postId) => api.post(`/social/posts/${postId}/bookmark/`),
  getUserPosts: (username) => api.get(`/social/users/${username}/posts/`),
  getUserReposts: (username) => api.get(`/social/users/${username}/reposts/`),
  logListening: (trackId, durationSeconds = 0) => api.post('/social/listening/', { track_id: trackId, duration_seconds: durationSeconds }),
  getListeningFeed: () => api.get('/social/listening/feed/'),
  getLeaderboard: () => api.get('/social/leaderboard/'),
};

export const chatAPI = {
  getRooms: (q = '') => api.get(q ? `/chat/rooms/?q=${q}` : '/chat/rooms/'),
  getRoom: (id) => api.get(`/chat/rooms/${id}/`),
  joinRoom: (id) => api.post(`/chat/rooms/${id}/join/`),
  leaveRoom: (id) => api.post(`/chat/rooms/${id}/leave/`),
  sendRoomMessage: (id, content) => api.post(`/chat/rooms/${id}/send/`, { content }),
  getRoomMembers: (id) => api.get(`/chat/rooms/${id}/members/`),
  getDMs: () => api.get('/chat/dms/'),
  getDMsWith: (userId) => api.get(`/chat/dms/${userId}/`),
  sendDM: (userId, content) => api.post(`/chat/dms/${userId}/send/`, { content }),
  blast: (userIds, content) => api.post('/chat/blast/', { user_ids: userIds, content }),
  getRequests: () => api.get('/chat/requests/'),
  respondRequest: (id, action) => api.post(`/chat/requests/${id}/`, { action }),
};

export const triviaAPI = {
  getFeaturedQuizzes: () => api.get('/trivia/quizzes/featured/'),
  startQuiz: (artistId) => api.post('/trivia/start/', { artist_id: artistId }),
  submitAnswer: (questionId, answer, timeTaken) => api.post('/trivia/answer/', { question_id: questionId, answer, time_taken: timeTaken }),
  getLeaderboard: () => api.get('/trivia/leaderboard/'),
  getUserBadges: (username) => api.get(`/trivia/badges/${username}/`),
  getUserStats: () => api.get('/trivia/stats/'),
};

export const recommendAPI = {
  getForYou: () => api.get('/recommendations/for-you/'),
  getSimilarTracks: (trackId) => api.get(`/recommendations/similar/${trackId}/`),
  getTasteMatch: (userId) => api.get(`/recommendations/taste-match/${userId}/`),
  getPromptMatch: (prompt) => api.get(`/recommendations/prompt-match/?prompt=${encodeURIComponent(prompt)}`),
  getPersona: (username) => api.get(username ? `/recommendations/persona/${username}/` : '/recommendations/persona/'),
};



export const concertAPI = {
  getConcerts: (city = '') => api.get(city ? `/social/concerts/?city=${city}` : '/social/concerts/'),
  getConcert: (id) => api.get(`/social/concerts/${id}/`),
  toggleAttend: (id) => api.post(`/social/concerts/${id}/attend/`),
  inviteFriend: (id, userId) => api.post(`/social/concerts/${id}/invite/${userId}/`),
};

export const userConcertsAPI = {
  getUserConcerts: (username) => api.get(`/social/users/${username}/concerts/`)
};
export default api;
