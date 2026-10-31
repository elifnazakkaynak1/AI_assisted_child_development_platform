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
npm start
```
The API runs on http://localhost:3000. Check it at http://localhost:3000/api/health

## Project structure
- `backend/`  Node.js + Express + SQLite API
- `frontend/` React (Vite) application
- `docs/`     SRS, SDD and PMP

## AI module
All AI calls go through `backend/src/ai.js`. It runs in mock mode by default
(`AI_MODE=mock`): it returns a fixed response labelled "AI-generated" and does not
call any external service. Demo (backend must be running):
http://localhost:3000/api/ai/summary

## Team
- Elifnaz AKKAYNAK
- Livaze Yağmur TEKİNARSLAN 
- Akın AKCA