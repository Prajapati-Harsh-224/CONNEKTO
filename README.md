# Connecto

Connecto is a prototype foundation for a B2B ordering platform connecting small shop owners with suppliers. This repository currently contains **Phase 1 setup only**. Product workflows are intentionally deferred to the ordered tasks in `docs/connecto/06_DEVELOPMENT_TASKS.md`.

## Structure

```text
connecto/
├── frontend/       React + Vite client
├── backend/        Node.js + Express REST API
├── docs/connecto/  Product source of truth
└── README.md
```

The frontend contains reusable component, page, layout, service, hook, context, utility, and asset directories. The backend is split into controllers, routes, services, models, middleware, utilities, and configuration.

## Requirements

- Python 3.11 or newer
- MySQL 8 or newer
- npm

## Setup

From the repository root:

```powershell
Copy-Item frontend/.env.example frontend/.env
Copy-Item backend/.env.example backend/.env
```

The example values are suitable for local development. Do not commit `.env` files or production credentials.

## Run the frontend

```powershell
cd frontend
npm install
npm run dev
```

The Vite development server normally runs at `http://localhost:5173`.

## Run the backend

In a second terminal:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
npm run dev
```

The FastAPI API normally runs at `http://localhost:4000`.

## Run with Docker

With Docker Desktop running, start the full stack from the repository root:

```powershell
docker compose up --build
```

Open `http://localhost:5173`. The frontend container serves the built Vite app and proxies `/api` requests to the FastAPI container. SQLite data is persisted in the `backend-data` Compose volume.

Stop the stack with:

```powershell
docker compose down
```

## Environment variables

### Frontend

`frontend/.env`:

```text
VITE_API_BASE_URL=http://localhost:4000/api
```

### Backend

`backend/.env`:

```text
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
SESSION_SECRET=replace-with-a-long-random-secret
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/connekto
```

## Frontend/backend communication

The frontend API service reads `VITE_API_BASE_URL` and calls the backend through `/api` with cookie credentials. The backend enables JSON parsing and credentialed CORS for `CLIENT_ORIGIN`. Authentication uses an HttpOnly session cookie. The health check is available at `GET /api/health` and auth endpoints are available under `/api/auth`.

## Current routes

The foundation includes the welcome page, role selection, login/signup/forgot-password placeholders, and role-aware dashboard route placeholders. Authentication and business workflows are not implemented yet.

## Validation

```powershell
cd frontend
npm run build

cd ../backend
npm start
```

With the backend running, open `http://localhost:4000/api/health` and confirm the healthy JSON response.

## Product references

Read the files in `docs/connecto/` in the order listed by `00_INDEX_AND_USAGE.md`. They define the product behavior, data model, API direction, implementation order, and prototype limitations.
