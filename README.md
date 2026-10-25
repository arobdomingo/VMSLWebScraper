# VMSL Data & Analytics Platform

**[Try the deployed web app](https://vmsl-web-scraper.vercel.app/)** · [Source code](https://github.com/arobdomingo/VMSLWebScraper)

A full-stack application that extracts publicly available **Vancouver Metro Soccer League** statistics, structures them through a **FastAPI** backend, and displays them in a **React + TypeScript** interface.

## Features
- Division standings, schedules, team pages and goal statistics.
- Scorers, MVP and goalkeeper shutout leaderboards.
- REST API and interactive web views.

## Stack
Python, FastAPI, SQLAlchemy, React, TypeScript, Vite, React Router, Tailwind CSS.

## Structure
- `backend/main.py` — API routes.
- `backend/scraper.py` — data extraction and normalization.
- `backend/models.py` — response models.
- `backend/database.py` and `crud.py` — database support.
- `vmsl-frontend/src/` — frontend pages and API client.

## Local development
Requires Python, Node.js and npm. From the repository root:

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload
```

In another terminal:

```bash
cd vmsl-frontend
npm install
npm run dev
```

Backend API docs: `http://localhost:8000/docs`. The frontend typically runs at `http://localhost:5173`. Review the frontend API client configuration if the backend address differs. Data availability depends on the upstream site.

## Status
An evolving full-stack project focused on scraping, normalization, API design and interactive data exploration. Independent project; not affiliated with VMSL.
