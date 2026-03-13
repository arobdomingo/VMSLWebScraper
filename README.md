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
