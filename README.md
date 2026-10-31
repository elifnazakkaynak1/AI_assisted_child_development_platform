# AI-Assisted Child Development Platform

Web-based decision support platform that brings parents, specialists and children
around one shared schedule, task list and record of observations.
The AI component summarizes records by role; it supports decisions, it never makes them.

## Requirements
- Node.js (LTS)
- Git

## Setup
### Backend
```
cd backend
npm install
npm run seed
npm start
```
`npm run seed` creates the local SQLite database (`backend/data/app.db`) and fills it with synthetic users.
The API runs on http://localhost:3000. Check it at http://localhost:3000/api/health

### Frontend
```
cd frontend
npm install
npm run dev
```
The app runs on http://localhost:5173

## Project structure
- `backend/`  Node.js + Express + SQLite API
- `frontend/` React (Vite) application
- `docs/`     SRS, SDD and PMP

## Team
- Elifnaz AKKAYNAK
- Livaze Yağmur TEKİNARSLAN 
- Akın AKCA