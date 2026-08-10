# FREQ 🎵

FREQ is a real-time, interactive music social network that brings people together through sound. Whether you're chatting with friends, discovering new artists, or tuning into live listening rooms, FREQ connects the community through a shared love of music.

## 🌟 Features

*   **Real-time Chat**: Connect with friends and communities instantly using WebSockets.
*   **Live Listening Rooms (Listen Together)**: Join synchronized rooms where everyone listens to the exact same track at the exact same time.
*   **User Profiles & Avatars**: Customize your profile, select your favorite artists, and express your musical identity.
*   **Dynamic UI**: A beautiful, fully responsive dark-mode interface built with modern web aesthetics.
*   **Global Community**: Find and add friends who share your musical tastes.

## 🛠️ Technology Stack

### Frontend
*   **React** (with Vite for blazing fast builds)
*   **JavaScript (ES6+)**
*   **Vanilla CSS** for custom, fluid, and highly optimized styling

### Backend
*   **Django** (Python web framework)
*   **Django Channels** (for real-time WebSocket communication in Chat and Listen Together rooms)
*   **MongoDB** (NoSQL database for flexible data storage)

## 🚀 Getting Started (Local Development)

### Prerequisites
*   Node.js & npm
*   Python 3.x
*   MongoDB (running locally on port `27017`)

### 1. Backend Setup
1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Activate your virtual environment (if you have one setup):
   ```bash
   # On Windows
   .\venv\Scripts\activate
   ```
3. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the Django development server:
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

### 2. Frontend Setup
1. Open a *new* terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install the node modules:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev -- --host
   ```
4. Open your browser and navigate to the provided local network link (e.g., `http://localhost:5173/`).

## 🤝 Contributing
Contributions, issues, and feature requests are always welcome! 

---
*Built with ❤️ for music lovers.*
