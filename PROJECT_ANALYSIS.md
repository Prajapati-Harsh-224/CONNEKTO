# Connecto Project Analysis

## 1. Project Overview

Connecto is a prototype B2B ordering platform designed to connect small shop owners with suppliers/distributors. The core demo flow described in the product docs is:

1. Shop owner signs in
2. Discovers suppliers and products
3. Adds items to a cart across multiple suppliers
4. Creates an order/request
5. Supplier receives and updates the order status
6. Shop owner sees the status change

The repository is clearly positioned as a prototype, with the product spec and task plan in the docs folder guiding implementation order.

## 2. Current Project Status

This project is in a foundation-to-prototype stage. A large amount of app structure, role-based flows, auth, dashboards, and backend API scaffolding exist, but some flows are still intentionally placeholder or demo-oriented.

Key observations:

- The project includes a React + Vite frontend and a Python FastAPI backend.
- The root docs describe a Node/Express backend, but the actual implementation is FastAPI + SQLAlchemy.
- Role-based pages and protected routes exist for shop owner, supplier, and Gruh Udyog.
- Auth and business endpoints exist on the backend, but the project still contains placeholder pages for some sections.
- The architecture is consistent with the product vision, but the app is not yet a production-ready marketplace.

## 3. Repository Structure

```text
CONNEKTO_2/
├── README.md
├── PROJECT_ANALYSIS.md
├── package.json
├── backend/
│   ├── package.json
│   ├── requirements.txt
│   ├── app/
│   │   ├── __init__.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   └── database/
│       └── connekto.sql
├── docs/
│   └── connecto/
│       ├── 00_INDEX_AND_USAGE.md
│       ├── 01_README.md
│       ├── 02_PRODUCT_SPEC.md
│       ├── 03_UI_UX_SPEC.md
│       ├── 04_DATA_MODEL.md
│       ├── 05_API_SPEC.md
│       ├── 06_DEVELOPMENT_TASKS.md
│       ├── 07_AI_AGENT_INSTRUCTIONS.md
│       ├── 08_DEMO_SCRIPT.md
│       ├── 09_ROADMAP.md
│       └── 10_PITCH_ONE_LINERS.md
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── public/
    └── src/
        ├── App.css
        ├── App.jsx
        ├── index.css
        ├── main.jsx
        ├── assets/
        ├── components/
        ├── context/
        ├── layouts/
        ├── pages/
        ├── services/
        ├── utils/
        └── ...
```

## 4. Tech Stack

### Frontend

- React 19
- Vite 8
- React Router DOM
- CSS modules / component-based styling in the app
- Environment-driven API base via `VITE_API_BASE_URL`

Relevant files:
- [frontend/package.json](frontend/package.json)
- [frontend/src/App.jsx](frontend/src/App.jsx)
- [frontend/src/services/api.js](frontend/src/services/api.js)

### Backend

- Python 3.11+
- FastAPI
- SQLAlchemy ORM
- Pydantic validation
- MySQL-compatible database layer with fallback DB URL logic
- Cookie-based sessions for auth

Relevant files:
- [backend/app/main.py](backend/app/main.py)
- [backend/app/database.py](backend/app/database.py)
- [backend/app/models.py](backend/app/models.py)
- [backend/app/schemas.py](backend/app/schemas.py)

### Documentation

- The docs under [docs/connecto](docs/connecto) act as the product source of truth.
- The task plan in [docs/connecto/06_DEVELOPMENT_TASKS.md](docs/connecto/06_DEVELOPMENT_TASKS.md) describes implementation phases and explicitly states task order.

## 5. Application Architecture

### Frontend Architecture

The frontend uses a central router in [frontend/src/App.jsx](frontend/src/App.jsx). It defines page access for three major roles:

- Shop Owner
- Supplier
- Gruh Udyog

It also uses a protected route pattern so role-based authorization is enforced for dashboards and role-specific screens.

Main route groupings include:

- Welcome / role-selection / login / signup screens
- Shop owner dashboard and sub-pages for suppliers, cart, checkout, orders, analytics, assistant, profile
- Supplier dashboard and sub-pages for orders, products, customers, analytics, profile
- Gruh Udyog dashboard and sub-pages

The app also has shared infrastructure such as:

- [frontend/src/context/AuthContext.jsx](frontend/src/context/AuthContext.jsx) for auth state
- [frontend/src/services/authService.js](frontend/src/services/authService.js) for login/logout/user-fetch operations
- [frontend/src/services/api.js](frontend/src/services/api.js) for fetch wrapper and API access
- reusable UI components under [frontend/src/components](frontend/src/components)

### Backend Architecture

The backend in [backend/app/main.py](backend/app/main.py) centralizes:

- API startup and DB table creation
- Response envelope helpers
- Password hashing and verification
- Session cookie handling
- Role validation and authorization helpers
- Route handlers for auth, supplier, shop-owner, and analytics workflows

The data model is defined in [backend/app/models.py](backend/app/models.py), including:

- User
- Shop
- SessionToken
- Supplier
- Product
- Checkout
- SupplierOrder
- OrderItem

Request validation contracts are defined in [backend/app/schemas.py](backend/app/schemas.py), including login, registration, product creation, checkout, and status updates.

## 6. Implemented Features and Observed Functionality

### Authentication

Implemented in backend and frontend:

- user registration
- login with identifier + password + optional role check
- session-based auth using `connecto_session` cookie
- current user retrieval via `/api/auth/me`
- logout
- role checks for protected endpoints

Relevant code:
- [backend/app/main.py](backend/app/main.py)
- [frontend/src/context/AuthContext.jsx](frontend/src/context/AuthContext.jsx)
- [frontend/src/services/authService.js](frontend/src/services/authService.js)
- [frontend/src/pages/LoginPage.jsx](frontend/src/pages/LoginPage.jsx)

### Supplier-side Order and Product Management

The backend includes endpoints for:

- supplier dashboard metrics
- incoming orders listing
- incoming order detail
- order status transitions
- product listing
- product creation
- product editing
- product deactivation

These align closely with the product spec for supplier-side workflow.

### Shop Owner Order Flow

Backend endpoints support:

- viewing shop owner orders
- retrieving a single order
- placing a checkout/order request from cart items
- analytics stub for shop-owner order reporting

This is consistent with the prototype ordering lifecycle.

### UI/Role Shell

The frontend includes pages such as:

- [frontend/src/pages/WelcomePage.jsx](frontend/src/pages/WelcomePage.jsx)
- [frontend/src/pages/RoleSelectionPage.jsx](frontend/src/pages/RoleSelectionPage.jsx)
- [frontend/src/pages/LoginPage.jsx](frontend/src/pages/LoginPage.jsx)
- [frontend/src/pages/SignupPage.jsx](frontend/src/pages/SignupPage.jsx)
- [frontend/src/pages/ShopOwnerDashboardPage.jsx](frontend/src/pages/ShopOwnerDashboardPage.jsx)
- [frontend/src/pages/SupplierDashboardPage.jsx](frontend/src/pages/SupplierDashboardPage.jsx)
- [frontend/src/pages/GruhUdyogDashboardPage.jsx](frontend/src/pages/GruhUdyogDashboardPage.jsx)

There are many role-specific pages and reusable dashboard cards/components that strongly suggest the prototype UI is scaffolded and partially connected.

## 7. What is Still Placeholder or Not Fully Implemented

The project is not yet complete. The current state includes several prototype or placeholder areas:

- Some pages still behave as placeholders, especially fallback dashboard sections like `DashboardPlaceholderPage`.
- The root README describes a Node/Express backend even though the actual app is FastAPI-based.
- Some product behavior is demo-data oriented rather than user-real data.
- Advanced features like payment settlement, inventory sync, delivery optimization, and AI assistant intelligence remain future work.
- The documentation explicitly identifies many tasks as future phases.

From the project docs:

- P0 must-haves are mostly in scope, but not every UI path is fully finished.
- P1/P2 items such as localization, analytics sophistication, and AI assistance are deferred.
- The project specifically avoids doing real payments and heavy business logic before the core ordering flow is validated.

## 8. Key Product Constraints and Design Direction

The docs clarify that Connecto is meant to be a lightweight prototype for proving the workflow:

> retailer discovers products → places order → supplier receives it → order status is visible

This shapes the current codebase. The app is focused on achieving that business story without overbuilding the platform.

The product vision also explicitly says:

- Do not claim real-brand partnerships
- Do not implement full production payment settlement
- Keep the flow simple and demo-friendly
- Prioritize the retailer ↔ supplier ordering loop over optional expansions

## 9. Run and Development Notes

### Frontend

From the repo root:

```powershell
cd frontend
npm install
npm run dev
```

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
npm run dev
```

The app expects environment configuration for the frontend and backend, including CORS and the DB URL. The backend is configured to load environment variables from `.env`.

## 10. Notable Files to Review First

If someone wants to understand the app quickly, the most important files are:

- [README.md](README.md)
- [docs/connecto/00_INDEX_AND_USAGE.md](docs/connecto/00_INDEX_AND_USAGE.md)
- [docs/connecto/06_DEVELOPMENT_TASKS.md](docs/connecto/06_DEVELOPMENT_TASKS.md)
- [frontend/src/App.jsx](frontend/src/App.jsx)
- [frontend/src/context/AuthContext.jsx](frontend/src/context/AuthContext.jsx)
- [backend/app/main.py](backend/app/main.py)
- [backend/app/models.py](backend/app/models.py)
- [backend/app/database.py](backend/app/database.py)

## 11. Final Assessment

Connecto is a well-structured prototype foundation with a clear product vision and a strong role-based architecture. It already includes a meaningful amount of backend logic and UI scaffolding for authentication, supplier management, shop-owner ordering, and dashboard flows.

However, it is still best described as a prototype foundation rather than a completed production application. The key value proposition is present in the code and docs, but several pages and workflows remain intentionally incomplete or demo-only until the task plan is executed in order.

This is a strong starting point for iterative implementation, especially if the next steps follow the documented task sequence instead of expanding into unrelated features.
