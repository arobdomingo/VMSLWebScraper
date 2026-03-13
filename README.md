# VMSL Data & Analytics Platform

A full-stack data platform for the Vancouver Metro Soccer League (VMSL) that collects, structures, and serves league statistics through a REST API and interactive web interface.

The project scrapes publicly available VMSL data and transforms it into structured datasets that can be explored through a FastAPI backend and a React + TypeScript frontend dashboard.

## Project Overview

The official VMSL website contains valuable information such as standings and player statistics, but the data is difficult to analyze programmatically.

This project builds a complete data pipeline that:

1. Scrapes league data from the VMSL website
2. Structures and normalizes the data
3. Serves the data through a REST API
4. Displays statistics through a modern web interface

The platform currently supports:

- League standings
- Team overview pages
- Top scorers
- MVP leaders
- Goalkeeper shutouts

## Features

- Standings by season and division
- Team overview pages with statistics
- Top scorers leaderboard
- MVP leaderboard
- Goalkeeper shutouts leaderboard
- Structured REST API
- Interactive frontend dashboard

## Tech Stack

### Backend

- Python
- FastAPI
- Web scraping
- REST API design

### Frontend

- React
- TypeScript
- Tailwind CSS
- React Router

### Data Processing

- HTML parsing
- Data normalization
- Structured API responses

## Project Structure

VMSLWebScraper/
│
├── backend/
│  ├── api/
│  ├── models/
│ ├── scrapers/
│  └── main.py
│
├── frontend/
│   ├── src/
│   │   ├── api/
│  │   ├── components/
│   │   ├── pages/
│  │   └── App.tsx
│
├── data/
│
└─README.md

## Example API Endpoints

### Standings

GET /standings/{year}/{division}

Returns:

- Games played
- Wins
- Losses
- Goals for
- Goals against
- Points

### Top Scorers

GET /scorers/{year}/{division}

Returns:

- Player name
- Team
- Goals scored
- Rank

### MVP Leaders

GET /mvps/{year}/{division}

Returns leaderboard statistics for MVP awards.

### Shutouts

GET /shutouts/{year}/{division}

Returns:

- Goalkeeper name
- Team
- Number of shutouts
- Rank

## Local Development

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/VMSLWebScraper.git
cd VMSLWebScraper
```

### 2. Install backend dependencies

```bash
pip install -r requirements.txt
```

### 3. Start the backend server

Run this from the root of the repository:
```
uvicorn backend.main:app --reload
```
The API will be available at: http://localhost:8000

Interactive API docs:http://localhost:8000/docs

### 4. Start the frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at: http://localhost:5173

## Future Improvements

Planned improvements include:

- Match fixtures and results
- Historical archives across more seasons
- Player career statistics
- Team comparison tools
- Search and filtering improvements

## Motivation

This project was created to make VMSL data easier to access, explore, and analyze.

It also serves as a full-stack portfolio project demonstrating experience with:

- Web scraping
- Backend API development
- Frontend interface design
- Data transformation and normalization
- End-to-end application structure
