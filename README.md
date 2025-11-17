# ChatGPT-style Mock App
Tech: React + TailwindCSS (frontend), Node.js + Express (backend, mock JSON)

## Live demo
- Frontend: https://chatgptclone-9p4m.vercel.app/
- Backend: https://chatgptclone-4.onrender.com

## Run locally

### Backend
1. cd backend
2. npm install
3. copy `.env.example` -> `.env` and add GEMINI_API_KEY (if using real model) — do NOT commit `.env`
4. npm start
Backend runs on http://localhost:4000 by default.

### Frontend
1. cd frontend
2. npm install
3. In `src` set `API_BASE` or create `.env`:
   - Option A (recommended): create `.env` with `REACT_APP_API_BASE=https://chatgptclone-2-vq73.onrender.com`
   - Option B: edit `src/*` files that reference `API_BASE` to point to deployed backend.
4. npm start

## Features
- Start new session, session-based chat with URL `/chat/:id`
- Tabular answers (TableAnswer) + descriptions
- Like/dislike feedback
- Dark / Light theme (toggle in top bar)
- Session list with generated titles (first non-greeting user question)
- Mock data persisted to `mock-data.json` (no DB)

## Notes
- If you pushed any API keys accidentally, rotate them immediately.
- Backend stores sessions in `mock-data.json` in the backend folder.

