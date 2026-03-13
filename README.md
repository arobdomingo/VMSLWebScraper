VMSL Data & Analytics Platform

A full-stack data platform for the Vancouver Metro Soccer League (VMSL) that collects, structures, and serves league statistics through a REST API and interactive web interface.

The project scrapes publicly available VMSL data and transforms it into structured datasets that can be explored through a FastAPI backend and a React + TypeScript frontend dashboard.

Project Overview

The official VMSL website contains valuable information such as standings and player statistics, but the data is difficult to analyze programmatically.

This project builds a complete data pipeline that:

Scrapes league data from the VMSL website

Structures and normalizes the data

Serves the data through a REST API

Displays statistics through a modern web interface

The platform currently supports:

League standings

Team overview pages

Top scorers

MVP leaders

Goalkeeper shutouts

Features

Standings by season and division

Team overview pages with statistics

Top scorers leaderboard

MVP leaderboard

Goalkeeper shutouts leaderboard

Structured REST API

Interactive frontend dashboard

Tech Stack
Backend

Python

FastAPI

Web scraping

REST API design

Frontend

React

TypeScript

Tailwind CSS

React Router

Data Processing

HTML parsing

Data normalization

Structured API responses

Project Structure
VMSLWebScraper/
│
├── backend/
│   ├── api/
│   ├── scrapers/
│   ├── models/
│   └── main.py
│
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── api/
│   └── App.tsx
│
├── data/
│
└── README.md
Example API Endpoints
Standings
GET /standings/{year}/{division}

Returns:

Games played

Wins

Losses

Goals for

Goals against

Points

Top Scorers
GET /scorers/{year}/{division}

Returns:

Player name

Team

Goals scored

Rank

MVP Leaders
GET /mvps/{year}/{division}

Returns leaderboard statistics for MVP awards.

Local Development
1. Clone the repository
git clone https://github.com/yourusername/VMSLWebScraper.git
cd VMSLWebScraper
2. Backend setup
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

Backend runs at:

http://localhost:8000
3. Frontend setup
cd frontend
npm install
npm run dev

Frontend runs at:

http://localhost:5173
Future Improvements

Planned improvements include:

Match fixtures and results

Player career statistics

Advanced analytics

Data visualizations

Historical season archives

Public API documentation

Motivation

This project was created to explore how sports data can be collected and analyzed using modern software engineering tools.

It also serves as a portfolio project demonstrating full-stack development, including:

Web scraping

Backend API design

Frontend development

Data processing pipelines
