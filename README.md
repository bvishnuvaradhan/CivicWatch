# CivicWatch

CivicWatch is a community issue reporting and resolution platform. Citizens can report civic problems (for example potholes, garbage, broken lights, water issues) with location and evidence, while workers and administrators can track, verify, and close issues through a structured workflow.

The goal is to make civic problem resolution transparent, accountable, and data-driven.

## Project Idea

Many city issues are reported informally and then lost in communication gaps. CivicWatch provides a single digital workflow where:

- Citizens report and follow issue progress.
- Field workers receive and update assigned tasks.
- Admins monitor trends, performance, and resolution quality.

This creates a clear lifecycle from report to closure, with timestamps, ownership, and status visibility.

## Core Features

- JWT-based authentication and role-aware authorization.
- Issue creation with category, severity, description, and geolocation.
- Comments and activity timeline for collaborative tracking.
- Voting/engagement support for community prioritization.
- Worker dashboard for execution and status updates.
- Admin dashboard with statistics and moderation capabilities.
- Leaderboard/activity views to improve accountability.

## User Roles

- Citizen: create issues, view issue progress, interact with community reports.
- Worker: handle assigned issues, update status, post progress notes.
- Admin: manage system-level operations, review reports, monitor analytics.

## Tech Stack

### Backend

- Java 21
- Spring Boot 3.3+
- Spring Security (JWT, stateless auth)
- Spring Data JPA
- PostgreSQL (Neon)
- PostGIS support for location-aware data

### Frontend

- React + Vite + TypeScript
- Tailwind CSS
- React Router
- Axios API client with token interceptor

## Architecture

- Frontend ([frontend](frontend)) handles UI, routing, auth context, and API integration.
- Backend ([backend](backend)) exposes REST APIs and applies business rules, security, and persistence.
- Database (Neon PostgreSQL) stores users, issues, comments, votes, flags, and related domain data.

## Repository Structure

- [backend](backend): Spring Boot API service.
- [frontend](frontend): React client application.
- [schema.sql](schema.sql): database schema setup.
- [metadata.json](metadata.json): project metadata.

## Local Setup

### Prerequisites

- Java 21
- Maven 3.9+
- Node.js 20+
- npm
- PostgreSQL/Neon database

### 1. Clone and Install

```bash
git clone https://github.com/bvishnuvaradhan/CivicWatch.git
cd CivicWatch
```

Frontend dependencies:

```bash
cd frontend
npm install
```

### 2. Configure Environment

Backend reads these environment variables:

- PORT (default 8085)
- DB_URL
- DB_USERNAME
- DB_PASSWORD
- JWT_SECRET
- CORS_ALLOWED_ORIGINS

Frontend expects:

- VITE_API_URL (example: http://localhost:8085/api)

### 3. Database Setup

Run [schema.sql](schema.sql) against your PostgreSQL/Neon instance.

### 4. Run Backend

```bash
cd backend
mvn spring-boot:run
```

### 5. Run Frontend

```bash
cd frontend
npm run dev
```

## Production Deployment

Current deployment stack:

- Frontend: Vercel
- Backend: Render (Docker)
- Database: Neon PostgreSQL

Live endpoints:

- Frontend: https://civic-watch-xi.vercel.app/
- Backend API: https://civicwatch-api-we6r.onrender.com


## API and Security Notes

- Auth endpoints are under /api/auth.
- Most protected endpoints require a Bearer token.
- Passwords are stored using BCrypt hashing.
- CORS origins are environment-driven for safer deployments.

## Suggested Next Improvements

- Add API documentation (OpenAPI/Swagger).
- Add unit and integration test coverage report in CI.
- Add observability (health checks, metrics, alerting).
- Add image upload storage strategy and moderation workflow.
