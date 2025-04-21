# Language Learning Chat App (Frontend)

A modern, interactive language learning web application featuring AI-powered chat, personalized onboarding, and gamified sentence exercises. Built with React, TypeScript, and Tailwind CSS.

---

## ✨ Features

- **AI Chat Tutor:** Conversational interface for language practice with real-time, streaming AI responses.
- **Personalized Onboarding:** Collects user info (name, native language, target language) to tailor the experience.
- **Personalized Greetings:** If user left off in between learning a word, the AI tutor remembers and offers to continue from where they stopped, providing a seamless learning experience.
- **Gamified Exercises:** Drag-and-drop sentence unscrambling with hints, timers, and instant feedback.
- **Pronunciation Practice:** Playable audio for vocabulary words.
- **Responsive & Accessible:** Mobile-friendly, and keyboard accessible.

---

## 📁 Folder Structure (Key Parts)

```
frontend/
  ├── src/
  │   ├── components/         # Reusable UI components (Chat, Exercise, Onboarding, etc.)
  │   ├── context/            # React context providers for session and messages
  │   ├── hooks/              # Custom React hooks (chat streaming, drag-drop logic, etc.)
  │   ├── utils/              # Utility functions (API, exercise logic, validation)
  │   ├── types/              # TypeScript type definitions
  │   ├── assets/             # Static assets (e.g., SVGs)
  │   └── App.tsx, main.tsx   # App entry and root component
  ├── public/                 # Static public files
  ├── package.json            # Project dependencies and scripts
  └── ...
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)

### Installation
1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd nova/frontend
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```

### Development
Start the app in development mode (with hot reload):
```bash
npm run dev
```
- The app will be available at [http://localhost:5173](http://localhost:5173) by default.

---

## 🖥️ Backend (FastAPI)

### Prerequisites
- Python 3.8+
- pip

### Installation
1. **Navigate to the backend directory:**
   ```bash
   cd nova/backend
   ```
2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
   *(If `requirements.txt` does not exist, see below for a sample.)*

3. **Set up environment variables:**
   - Create a `.env` file in `backend/` with:
     ```env
     OPENAI_API_KEY=your-openai-key
     BACKEND_URL=http://localhost:8000
     ```

### Running the Backend
From the project root (where you see the `backend/` folder):
```bash
uvicorn backend.main:app --reload
```
- The API will be available at [http://localhost:8000](http://localhost:8000)
- Interactive docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### Example `requirements.txt`
```
fastapi
uvicorn[standard]
sqlalchemy[asyncio]
aiosqlite
python-dotenv
gtts
openai
```

### Database

- The backend uses **SQLite** as its database engine by default (for easy local development).
- The database file is created automatically as `db.sqlite3` in the project root (same level as the `backend/` folder).
- **No manual setup is required.**

#### Accessing the Database
- You can inspect or modify the database using any SQLite client, such as:
  - [DB Browser for SQLite](https://sqlitebrowser.org/)
  - The `sqlite3` CLI tool:
    ```bash
    sqlite3 db.sqlite3
    ```
- The main tables are:
  - `users` — stores user profiles and progress
  - `sessions` — stores chat session history

#### Common SQLite Commands

- **Find a session by session ID:**
  ```sql
  SELECT * FROM sessions WHERE id = 'your-session-id';
  ```

- **Find a user by user name:**
  ```sql
  SELECT * FROM users WHERE user_name = 'your-username';
  ```

- **List all sessions for a user:**
  ```sql
  SELECT * FROM sessions WHERE user_id = (SELECT id FROM users WHERE user_name = 'your-username');
  ```

- **View a user's word progress:**
  ```sql
  SELECT user_name, word_progress FROM users WHERE user_name = 'your-username';
  ```

- **View message history for a session:**
  ```sql
  SELECT message_history FROM sessions WHERE id = 'your-session-id';
  ```

#### Notes
- The database schema is defined in `backend/models/db.py`.

---

## 📚 API Endpoints

### Session Management
- **POST `/session/start`**
  - **Request Body:**
    ```json
    {
      "user_name": "string",
      "source_language": "string",
      "target_language": "string"
    }
    ```
  - **Response:**
    ```json
    {
      "session_id": "string",
      "greeting": "string"
    }
    ```

- **POST `/session/continue`**
  - **Request Body:**
    ```json
    {
      "session_id": "string",
      "user_message": "string"
    }
    ```
  - **Response:**
    - Streams JSON chunks with the LLM's response.

### Speech Synthesis
- **GET `/speech/{word}`**
  - **Path Parameter:** `word` (string, lowercase)
  - **Response:** Returns an MP3 audio file for the word's pronunciation (English only).

---

## 🛠️ Technologies Used
- **React** (with hooks & context)
- **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS** (utility-first styling)
- **@tanstack/react-query** (data fetching & caching)
- **react-beautiful-dnd** (drag-and-drop UI)
- **framer-motion** (animations)


