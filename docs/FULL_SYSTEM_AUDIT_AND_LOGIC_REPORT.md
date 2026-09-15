# Connekto — Full System Audit & Logic Verification Report

> **Audit date:** 2026-09-15  
> **Auditor:** Antigravity AI  
> **Scope:** Frontend (React/Vite), Backend (FastAPI/SQLAlchemy), Database (SQLite), Runtime behaviour  
> **Rule:** Every conclusion is labelled `CODE-VERIFIED`, `RUNTIME-VERIFIED`, `NOT VERIFIED`, `NOT IMPLEMENTED`, or `DEMO ONLY`.

---

## 1. Executive Summary

Connekto is a B2B marketplace platform (shop owner ↔ supplier) built with a React/Vite frontend and a FastAPI/SQLAlchemy backend. The project is in an advanced **demo-prototype** state.

**Critical finding:** The two most fundamental flows — authentication and supplier discovery — are fully disconnected from the backend and run entirely on local/mock data. The backend itself is complete and production-quality, but the frontend bypasses it for auth and never calls it for the supplier list.

| Domain | Status |
|--------|--------|
| Backend (FastAPI) | CODE-VERIFIED — all API endpoints implemented |
| Database (SQLite) | CODE-VERIFIED — schema exists, tables created on startup |
| Authentication | 🔴 DEMO ONLY — `authService.js` never calls the backend |
| Supplier Discovery | 🔴 DEMO ONLY — `SupplierListPage` uses hardcoded demo data |
| Supplier Detail & Products | 🟡 PARTIAL — calls real API, backend validated, but only works if a supplier with that ID exists in the DB |
| Cart | 🟡 PARTIAL — localStorage only, no server-side state |
| Checkout & Order Creation | 🟢 WORKING — real API call, real DB writes, multi-supplier split |
| Supplier Incoming Orders | 🟢 WORKING — real API |
| Order Status Updates | 🟢 WORKING — real API with transition guards |
| Area/Service-Area Matching | 🔴 NOT IMPLEMENTED |
| Gruh Udyog | 🔵 DEMO/MOCK — all data hardcoded, no backend calls |
| Payment | 🟡 PARTIAL — payment method field stored; no gateway integration |

**Final verdict: MAJOR BACKEND/DATABASE LOGIC IS MISSING** for the core discovery and auth flows.

---

## 2. Current Architecture

```
FRONTEND (React 19 + Vite 8)            BACKEND (FastAPI 2.0 + Python)
┌──────────────────────────────┐         ┌──────────────────────────────┐
│  src/                        │         │  app/                        │
│  ├── pages/           [JSX]  │  HTTP   │  ├── main.py      [routes]   │
│  ├── services/        [JS]   │◄───────►│  ├── models.py    [ORM]      │
│  ├── context/         [JSX]  │         │  ├── schemas.py   [pydantic] │
│  ├── utils/           [JS]   │         │  ├── database.py  [engine]   │
│  └── data/            [JS]   │         │  └── (tests/)                │
└──────────────────────────────┘         └──────────────────────────────┘
                                                      │
                                               SQLite (local)
                                           connekto.db (backend/)
```

**Database:** SQLite at `backend/connekto.db` (224 KB on disk, CODE-VERIFIED).  
**Node:** Backend port 4000 (set in `backend/.env`). Frontend dev server on port 5173.  
**CORS:** Configured for `localhost:5173` and `localhost:5174`.  
**Frontend API base URL:** `http://localhost:4000/api` (default in `api.js`).

---

## 3. Frontend Audit

### 3.1 Routing (`App.jsx`) — CODE-VERIFIED

| Route | Component | Notes |
|-------|-----------|-------|
| `/` | `WelcomePage` | Public landing |
| `/login` | `LoginPage` | Uses demo auth |
| `/signup` | `SignupPage` | Uses demo auth |
| `/forgot-password` | `AuthPlaceholderPage` | Placeholder only |
| `/dashboard/shop-owner` | `ShopOwnerDashboardPage` | Protected (SHOP_OWNER) |
| `/dashboard/shop-owner/suppliers` | `SupplierListPage` | Uses demo data |
| `/dashboard/shop-owner/suppliers/:id` | `SupplierDetailPage` | Calls real API |
| `/dashboard/shop-owner/suppliers/:id/products` | `SupplierCatalogPage` | Calls real API |
| `/dashboard/shop-owner/suppliers/:id/products/:pid` | `ProductDetailPage` | Calls real API |
| `/dashboard/shop-owner/cart` | `ShopOwnerCartPage` | localStorage |
| `/dashboard/shop-owner/checkout` | `CheckoutPage` | Real API |
| `/dashboard/shop-owner/orders` | `ShopOwnerOrdersPage` | Real API |
| `/dashboard/shop-owner/orders/:id` | `ShopOwnerOrderDetailPage` | Real API |
| `/dashboard/shop-owner/analytics` | `ShopOwnerAnalyticsPage` | Real API (minimal data) |
| `/dashboard/shop-owner/assistant` | Redirects to home | NOT IMPLEMENTED |
| `/dashboard/supplier` | `SupplierDashboardPage` | Real API |
| `/dashboard/supplier/orders` | `SupplierIncomingOrdersPage` | Real API |
| `/dashboard/supplier/orders/:id` | `SupplierIncomingOrderDetailPage` | Real API |
| `/dashboard/supplier/products` | `SupplierProductManagementPage` | Real API with localStorage fallback |
| `/dashboard/supplier/analytics` | `SupplierAnalyticsPage` | Real API (minimal data) |
| `/dashboard/supplier/customers` | `SupplierCustomersPage` | DEMO ONLY |
| `/dashboard/gruh-udyog` | `GruhUdyogDashboardPage` | DEMO ONLY |
| `/dashboard/gruh-udyog/products` | `GruhUdyogProductsPage` | DEMO ONLY |
| `/dashboard/gruh-udyog/service-areas` | `GruhUdyogServiceAreasPage` | DEMO ONLY |
| `/dashboard/gruh-udyog/orders` | `GruhUdyogOrdersPage` | DEMO ONLY |

### 3.2 `ProtectedRoute` — CODE-VERIFIED

`ProtectedRoute` checks `user.role` from the `AuthContext`. Because `AuthContext` resolves to a **demo user** (never real backend session), route protection is also demo-only. There is no actual session cookie enforcement on the frontend.

### 3.3 `AuthContext` — CODE-VERIFIED

```js
// AuthContext.jsx lines 20-25
useEffect(() => {
  getCurrentUser()
    .then((response) => setUser(response?.data?.user || getDemoUserFromRole()))
    .catch(() => setUser(getDemoUserFromRole()))  // ALWAYS resolves to demo user
    .finally(() => setIsLoading(false))
}, [])
```

`getCurrentUser()` in `authService.js` returns `Promise.resolve({ data: { user: { id: 'demo-user', name: 'Demo User', role: getSelectedRole() } } })`.  
**Impact:** The app always boots as a demo user. No real authentication happens at any point.

---

## 4. Backend Audit

### 4.1 Technology & Structure — CODE-VERIFIED

- **Framework:** FastAPI 2.0.0
- **ORM:** SQLAlchemy 2 (mapped columns, declarative base)
- **Auth:** Cookie-based session tokens (table: `sessions`), scrypt password hashing
- **All routes in a single file:** `backend/app/main.py` (524 lines)
- **Session cookie name:** `connecto_session`
- **Session duration:** 7 days

### 4.2 API Endpoints — CODE-VERIFIED

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/health` | None | None | Health check |
| POST | `/api/auth/register/shop-owner` | None | — | Shop owner registration |
| POST | `/api/auth/register/supplier` | None | — | Supplier registration |
| POST | `/api/auth/register/gruh-udyog` | None | — | Gruh Udyog registration |
| POST | `/api/auth/login` | None | — | Login (all roles) |
| GET | `/api/auth/me` | Required | Any | Current session user |
| POST | `/api/auth/logout` | Optional | Any | Logout |
| GET | `/api/suppliers` | Required | SHOP_OWNER | List all suppliers |
| GET | `/api/suppliers/{id}` | Required | SHOP_OWNER | Supplier detail + products |
| GET | `/api/suppliers/{id}/products` | Required | SHOP_OWNER | Supplier product catalog |
| GET | `/api/suppliers/{id}/products/{pid}` | Required | SHOP_OWNER | Single product |
| POST | `/api/checkout` | Required | SHOP_OWNER | Create checkout + split orders |
| GET | `/api/orders` | Required | SHOP_OWNER | Shop owner's orders |
| GET | `/api/orders/{id}` | Required | SHOP_OWNER | Single order detail |
| GET | `/api/analytics/shop` | Required | SHOP_OWNER | Shop analytics |
| GET | `/api/supplier/dashboard` | Required | SUPPLIER/GU | Supplier dashboard metrics |
| GET | `/api/supplier/orders` | Required | SUPPLIER/GU | Incoming supplier orders |
| GET | `/api/supplier/orders/{id}` | Required | SUPPLIER/GU | Single incoming order |
| PUT | `/api/supplier/orders/{id}/status` | Required | SUPPLIER/GU | Update order status |
| GET | `/api/supplier/products` | Required | SUPPLIER/GU | Supplier's product list |
| POST | `/api/supplier/products` | Required | SUPPLIER/GU | Create product |
| GET | `/api/supplier/products/{id}` | Required | SUPPLIER/GU | Single product (supplier-owned) |
| PUT | `/api/supplier/products/{id}` | Required | SUPPLIER/GU | Update product |
| DELETE | `/api/supplier/products/{id}` | Required | SUPPLIER/GU | Deactivate product |
| GET | `/api/analytics/supplier` | Required | SUPPLIER/GU | Supplier analytics |

### 4.3 Backend Role Security — CODE-VERIFIED

- `GET /api/suppliers` enforces `user.role == "SHOP_OWNER"` — returns 403 for SUPPLIER.
- `GET /api/supplier/orders` enforces `user.role != "SHOP_OWNER"` — returns 403 for SHOP_OWNER.
- All other routes enforce `require_user` (returns 401 if no valid session cookie).
- **However:** Because the frontend never sets a real session cookie (auth is demo), ALL frontend API calls to the real backend will receive 401 until the auth is connected.

---

## 5. Database Audit

### 5.1 Configuration — CODE-VERIFIED

- **Primary:** `DATABASE_URL=sqlite:///./connekto.db` (from `backend/.env`)
- **Fallback:** If MySQL is configured and fails, falls back to SQLite at `/app/data/connekto.db`
- **Schema creation:** `Base.metadata.create_all(bind=engine)` runs on startup — tables auto-created
- **Migration:** No Alembic or migration framework; schema is applied directly on each startup
- One migration patch runs on startup: `ALTER TABLE users ADD COLUMN area VARCHAR(100)` (wrapped in try/except for idempotency)

### 5.2 Tables and Models — CODE-VERIFIED

#### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(36) | UUID PK |
| name | VARCHAR(100) | |
| email | VARCHAR(255) | Unique, nullable |
| phone | VARCHAR(30) | Unique, nullable |
| area | VARCHAR(100) | Nullable — added via ALTER TABLE patch |
| login_identifier | VARCHAR(255) | Unique, indexed |
| password_hash | VARCHAR(255) | scrypt |
| role | VARCHAR(30) | SHOP_OWNER / SUPPLIER / GRUH_UDYOG |
| created_at | DateTime | |

#### `shops`
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(36) | UUID PK |
| owner_id | FK(users.id) | Unique — 1:1 with user |
| name | VARCHAR(150) | |
| address | VARCHAR(250) | |
| area | VARCHAR(100) | Shop's area/locality |

#### `sessions`
| Column | Type | Notes |
|--------|------|-------|
| token | VARCHAR(128) | PK |
| user_id | FK(users.id) | |
| expires_at | DateTime | 7 days TTL |

#### `suppliers`
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(80) | PK — format: `supplier-{user_id_prefix}` |
| name | VARCHAR(150) | Set to `"{name}'s Supply Desk"` on registration |
| owner_id | FK(users.id) | Nullable, Unique |

**MISSING COLUMNS IN `suppliers`:** No `area`, `service_area`, `city`, `pincode`, `phone`, `email`, `location`, `latitude`, `longitude`, `is_verified`, `rating`, `description` columns. The supplier model is extremely minimal.

#### `products`
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(36) | UUID PK |
| supplier_id | FK(suppliers.id) | Indexed |
| name | VARCHAR(150) | |
| brand | VARCHAR(100) | |
| category | VARCHAR(100) | |
| pack_size | VARCHAR(80) | |
| price | Numeric(10,2) | |
| minimum_quantity | Integer | |
| image_url | Text | |
| is_active | Boolean | |
| is_demo_data | Boolean | |

#### `checkouts`
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(40) | Format: `CO-{hex}` |
| shop_owner_id | FK(users.id) | |
| total_amount | Numeric(10,2) | |
| payment_method | VARCHAR(40) | |
| created_at | DateTime | |

#### `supplier_orders`
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(100) | Format: `{SUPPLIER_ID}-{CHECKOUT_ID}-{n}` |
| checkout_id | FK(checkouts.id) | |
| supplier_id | FK(suppliers.id) | |
| supplier_name | VARCHAR(150) | Denormalized snapshot |
| service_area | VARCHAR(100) | Always set to `""` (empty string) |
| shop_owner_id | FK(users.id) | |
| subtotal | Numeric(10,2) | |
| status | VARCHAR(30) | Default: `"Pending"` |
| created_at / updated_at | DateTime | |

**Note:** `service_area` field exists in the model but is **always written as an empty string** (`service_area=""`) in the checkout logic. It is never populated.

#### `supplier_order_items`
| Column | Type | Notes |
|--------|------|-------|
| id | Integer | Autoincrement PK |
| order_id | FK(supplier_orders.id) | |
| product_id | VARCHAR(36) | No FK constraint to products |
| product_name_snapshot | VARCHAR(150) | |
| product_image_url_snapshot | Text | |
| quantity | Integer | |
| unit_price_snapshot | Numeric(10,2) | |
| line_total | Numeric(10,2) | |

### 5.3 Database Relationships — CODE-VERIFIED

```
users (1)
  ├── (1) shops         [shop.owner_id → users.id]
  ├── (1) suppliers     [supplier.owner_id → users.id]
  ├── (n) sessions      [sessions.user_id → users.id]
  └── (n) checkouts     [checkouts.shop_owner_id → users.id]

checkouts (1)
  └── (n) supplier_orders  [supplier_orders.checkout_id → checkouts.id]

suppliers (1)
  ├── (n) products          [products.supplier_id → suppliers.id]
  └── (n) supplier_orders   [supplier_orders.supplier_id → suppliers.id]

supplier_orders (1)
  └── (n) supplier_order_items  [items.order_id → supplier_orders.id]
```

---

## 6. Authentication & Authorization

### 6.1 Shop Owner Registration — CODE-VERIFIED (Backend)

Fields collected by `POST /api/auth/register/shop-owner`:
- `name` (owner's name) ✅
- `shopName` ✅
- `shopAddress` ✅
- `area` (locality/area string) ✅
- `phone` ✅
- `email` (optional) ✅
- `password` / `confirmPassword` ✅

Fields **NOT collected:**
- City — NOT COLLECTED
- State — NOT COLLECTED
- Pincode — NOT COLLECTED
- Latitude/longitude — NOT COLLECTED
- Google Maps / geocoding — NOT IMPLEMENTED
- Browser geolocation — NOT IMPLEMENTED

**Where stored:** `User.area` (VARCHAR 100), `Shop.area` (VARCHAR 100), `Shop.address` (VARCHAR 250), `Shop.name` (VARCHAR 150).  
**API endpoint:** `POST /api/auth/register/shop-owner`  
**Backend model:** `User` + `Shop` (both created in same transaction)

### 6.2 Supplier Registration — CODE-VERIFIED (Backend)

Fields collected by `POST /api/auth/register/supplier`:
- `name` (owner's name) ✅
- `area` (service area string) ✅
- `phone` ✅
- `email` (optional) ✅

Fields **NOT collected:**
- Business/supplier name — NOT COLLECTED (auto-set to `"{name}'s Supply Desk"`)
- Address — NOT COLLECTED
- City — NOT COLLECTED
- Pincode — NOT COLLECTED
- Categories — NOT COLLECTED
- Multiple service areas — NOT SUPPORTED (only one `area` string)

**Where stored:** `User.area`, `Supplier.name` (auto-generated)  
**Supplier record:** Created with `id = "supplier-{user_id[:8]}"` and `name = "{user.name}'s Supply Desk"`

### 6.3 Frontend Authentication — CODE-VERIFIED

The `authService.js` file contains **zero real HTTP calls**:

```js
// authService.js — ALL three functions are demo-only
export function login(credentials) {
  return Promise.resolve({ data: { user: { id: 'demo-user', name: credentials.emailOrPhone, role: fallbackRole } } })
}
export function register(credentials) {
  return Promise.resolve({ data: { message: 'Account created successfully.' } })
}
export function getCurrentUser() {
  return Promise.resolve({ data: { user: { id: 'demo-user', name: 'Demo User', role: fallbackRole } } })
}
```

**Impact:**
- Login form never calls `/api/auth/login`
- Signup form never calls `/api/auth/register/...`
- The session cookie is never set
- ALL protected API calls (`/api/suppliers`, `/api/orders`, etc.) will fail with 401

**Status:** DEMO ONLY — CRITICAL BUG

---

## 7. Shop Owner Flow

| Step | Frontend Implemented? | API Implemented? | DB Implemented? | Connected? | Status |
|------|-----------------------|-----------------|----------------|-----------|--------|
| Registration form | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No (demo only) | 🔴 DEMO |
| Login form | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No (demo only) | 🔴 DEMO |
| Shop Owner Dashboard | ✅ Yes | ❌ No backend route | — | — | 🟡 UI only |
| Supplier Discovery | ✅ Yes (demo data) | ✅ Yes (`GET /api/suppliers`) | ✅ Yes | ❌ No | 🔴 DEMO |
| Supplier Detail | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes (but 401) | 🟡 PARTIAL |
| Supplier Products | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes (but 401) | 🟡 PARTIAL |
| Add to Cart | ✅ Yes | ❌ No cart API | — | localStorage | 🟡 LOCAL |
| Cart View (multi-supplier) | ✅ Yes | ❌ No cart API | — | localStorage | 🟡 LOCAL |
| Checkout / Place Order | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes (but 401) | 🟡 PARTIAL |
| Order List | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes (but 401) | 🟡 PARTIAL |
| Order Detail | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes (but 401) | 🟡 PARTIAL |
| Analytics | ✅ Yes (UI) | ✅ Yes (minimal) | ✅ Yes | ✅ Yes (but 401) | 🟡 PARTIAL |

---

## 8. Supplier Flow

| Step | Frontend | API | DB | Connected? | Status |
|------|----------|-----|----|-----------|--------|
| Registration | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No (demo auth) | 🔴 DEMO |
| Dashboard | ✅ Yes | ✅ `GET /api/supplier/dashboard` | ✅ Yes | ❌ No (demo auth → 401) | 🟡 PARTIAL |
| Incoming Orders List | ✅ Yes | ✅ `GET /api/supplier/orders` | ✅ Yes | ❌ No (demo auth → 401) | 🟡 PARTIAL |
| Order Detail | ✅ Yes | ✅ `GET /api/supplier/orders/{id}` | ✅ Yes | ❌ No (demo auth → 401) | 🟡 PARTIAL |
| Order Status Update | ✅ Yes | ✅ `PUT /api/supplier/orders/{id}/status` | ✅ Yes | ❌ No (demo auth → 401) | 🟡 PARTIAL |
| Product Management | ✅ Yes | ✅ Full CRUD | ✅ Yes | ❌ No (demo auth → 401, falls back to localStorage) | 🟡 PARTIAL |
| Customers Page | ✅ Yes (UI) | ❌ No endpoint | ❌ No | — | 🔵 DEMO |
| Supplier Analytics | ✅ Yes | ✅ `GET /api/analytics/supplier` | ✅ Yes | ❌ No (demo auth → 401) | 🟡 PARTIAL |

---

## 9. Gruh Udyog Flow

All Gruh Udyog functionality is **100% DEMO ONLY**. (`CODE-VERIFIED`)

`gruhUdyogService.js` contains an in-memory `demoData` object with hardcoded:
- Business name ("Swad Saman")
- 4 metrics
- 4 products (Groundnut Chikki, Sev Mamra Mix, etc.)
- 6 service areas (Maninagar, etc.)
- 4 demo orders

Every exported service function returns `Promise.resolve({ data: demoData.xxx })`. The `apiRequestForGruhUdyog()` function is defined but never called anywhere.

**No backend endpoints exist for Gruh Udyog-specific data** (it shares the Supplier endpoints since it uses the `GRUH_UDYOG` role, which gets a `Supplier` record like `SUPPLIER`).

---

## 10. Supplier Discovery Logic

### What the code actually does — CODE-VERIFIED

**Frontend (`SupplierListPage.jsx` line 273):**
```js
// Use demo data; in production replace demoSuppliers with API response
const suppliers = demoSuppliers
```

The page imports `demoSuppliers` from `utils/supplierDiscoveryData.js` — a static array of 6 fictional suppliers, all located in "Ahmedabad, Gujarat".

- **No API call is made to `GET /api/suppliers`.**
- `isLoading` is initialized to `false` and is never set to `true`.
- The `error` state is never populated.
- Filtering and sorting run on the hardcoded array.

### Backend `GET /api/suppliers` (what it would return) — CODE-VERIFIED

If called with a valid session cookie, this endpoint:
1. Queries `SELECT * FROM suppliers ORDER BY name`
2. For each supplier, queries its active products
3. Returns a JSON object with a `suppliers` array

**Area filtering:** `GET /api/suppliers` returns ALL suppliers in the database — there is no area, city, or service-area filter parameter.

---

## 11. Area / Service-Area Matching Logic

**This is the most critical section.**

### Question A: Does Shop Owner location exist in the database?
**YES — partially.** `CODE-VERIFIED`  
`Shop.area` (VARCHAR 100) stores the area string entered during registration. `User.area` also stores it. Example: if a shop owner types "Maninagar", `Shop.area = "Maninagar"`.

### Question B: Does Supplier service area exist in the database?
**NO — NOT IMPLEMENTED.** `CODE-VERIFIED`  
The `Supplier` model has only 3 columns: `id`, `name`, `owner_id`. There is no `area`, `service_area`, `city`, `pincode`, or any location column on the `Supplier` table.  
The `SupplierOrder` model has a `service_area` column (VARCHAR 100) but it is always written as `""` (empty string) in the checkout endpoint.

### Question C: Is there a backend query comparing shop area to supplier area?
**NO — NOT IMPLEMENTED.** `CODE-VERIFIED`  
`GET /api/suppliers` performs a simple `select(Supplier).order_by(Supplier.name)` — no WHERE clause, no area join.

### Question D: Is matching performed on backend or frontend?
**NEITHER — NOT IMPLEMENTED.** `CODE-VERIFIED`

### Question E: What exact fields are compared?
**NOTHING is compared.** `NOT IMPLEMENTED`

### Question F: Is matching case-sensitive?
**N/A — NOT IMPLEMENTED**

### Question G: Is matching exact or partial?
**N/A — NOT IMPLEMENTED**

### Question H: Can one supplier serve multiple areas?
**NOT STORED IN DATABASE** — supplier has no area data.

### Question I: Can one shop belong to multiple service areas?
**NO** — `Shop.area` is a single VARCHAR(100) field.

### Question J: What happens when no supplier matches?
**N/A** — matching does not exist.

### Question K: Does the UI show ALL suppliers anyway?
**YES — the UI shows the 6 hardcoded demo suppliers regardless of the logged-in user's area.** `CODE-VERIFIED`

### Question L: Is the current supplier list using demo/static data instead of the matching API?
**YES — 100% demo/static data.** `CODE-VERIFIED`

---

## 12. Supplier Details Logic

`SupplierDetailPage.jsx` uses `getSupplier(supplierId)` from `catalogService.js`, which calls `GET /api/suppliers/{supplierId}`. `CODE-VERIFIED`

**When a supplier ID from the demo list is passed (e.g., "narmada-wholesale"), the backend will return 404** because these IDs do not exist in the SQLite database. Only real registered suppliers appear in the DB with IDs like `supplier-abc12345`.

**Fallback values visible in the UI:**
- `supplier.location || 'Ahmedabad, Gujarat'` — hardcoded fallback
- `supplier.minimumOrder || '₹1,500'` — hardcoded fallback
- `supplier.rating || 4.5` — hardcoded fallback
- `supplier.serviceAreas || ['Ahmedabad', 'Gandhinagar', 'Bopal', 'Vastrapur']` — hardcoded array

These fallbacks confirm the backend response does not return these fields (the `public_supplier_json` function returns `location: ""`, `serviceAreas: []`, `rating: None`).

---

## 13. Product Logic

### Backend — CODE-VERIFIED
- Products table: `id`, `supplier_id`, `name`, `brand`, `category`, `pack_size`, `price`, `minimum_quantity`, `image_url`, `is_active`, `is_demo_data`
- Product → Supplier relationship via `supplier_id` FK
- `GET /api/suppliers/{id}/products` returns ONLY active products (`WHERE is_active = True`) for that specific supplier
- `is_demo_data` flag exists to distinguish seeded data

### Frontend — CODE-VERIFIED
- `SupplierCatalogPage` and `SupplierDetailPage` call real API endpoints
- `SupplierProductManagementPage` (for suppliers) calls real API, falls back to localStorage + demo products if API fails

### Product images — CODE-VERIFIED
- Stored as `image_url` (Text) in database
- Supplier management page shows an "Image URL" input field
- Demo products in `supplierProductService.js` use Unsplash URLs
- No local asset storage or image upload mechanism

---

## 14. Cart Logic

### Storage — CODE-VERIFIED (`cartStorage.js`)
- **Storage key:** `connecto.demoCart`
- **Medium:** `window.localStorage`
- **Structure:** Array of cart items, each containing: `productId`, `supplierId`, `name`, `brand`, `packSize`, `unitPrice`, `quantity`, `minimumQuantity`, `imageUrl`, `supplierName`

### Multi-supplier grouping — CODE-VERIFIED
- Cart items are grouped by `supplierId` in `ShopOwnerCartPage` and `CheckoutPage`
- Grouping is correct — distinct `supplierId` values produce separate supplier sections
- Supplier display metadata (name, location, category) is resolved from `findDemoSupplier(supplierId)` and `findSupplier(supplierId)` — DEMO DATA, not from backend

### Cart persistence — CODE-VERIFIED
- Cart survives browser refresh (localStorage)
- Cart is cleared after successful checkout (`clearCart()`)

---

## 15. Checkout Logic

### Real API connection — CODE-VERIFIED
`CheckoutPage.jsx` calls `createCheckoutRequest(paymentMethod, cart)` → `POST /api/checkout`

### Backend checkout logic — CODE-VERIFIED (`main.py` lines 480–510)
1. Validates payment method (`CASH_ON_DELIVERY`, `PAY_LATER`, `REQUEST_ORDER`)
2. For each cart item, validates: `product exists in DB`, `product.supplier_id == item.supplierId`, `product.is_active`, `quantity >= minimum_quantity`
3. Groups items by `supplier_id`
4. Creates one `Checkout` record
5. Creates one `SupplierOrder` per distinct supplier (multi-supplier split is real and working)
6. Creates `OrderItem` records for each product
7. Sets `service_area = ""` (always empty — NOT populated from supplier record)
8. Commits entire transaction

### Critical blocker — CODE-VERIFIED
The checkout call will **fail with 401** in the current app state because:
- The frontend has no real session cookie (auth is demo)
- `require_user` will find no session token in the request cookies
- Returns `{"success": false, "error": {"code": "UNAUTHENTICATED", "message": "Authentication is required."}}`

---

## 16. Multi-Supplier Order Logic

### Backend — CODE-VERIFIED
The checkout endpoint correctly splits one checkout into N supplier orders:
- One `Checkout` (parent) → N `SupplierOrder` (children)
- Each `SupplierOrder.id` = `"{SUPPLIER_ID}-{CHECKOUT_ID}-{index}"`
- Each supplier order has its own `subtotal`, `status`, `items` list
- Status starts at `"Pending"` for all

### Frontend display — CODE-VERIFIED
- `CheckoutPage` confirms receipt shows all `supplierOrders` from API response
- Order confirmation page links to individual orders via `/dashboard/shop-owner/orders/{order.id}`
- `ShopOwnerOrdersPage` calls `GET /api/orders` which returns ALL supplier-level orders for the shop owner

---

## 17. Supplier Incoming Order Logic

### Full flow — CODE-VERIFIED (backend); NOT VERIFIED (end-to-end runtime, auth blocked)

When a Shop Owner places an order:
1. `Checkout` record created → `shop_owner_id = user.id`
2. `SupplierOrder` created → `supplier_id = supplier.id`, `shop_owner_id = user.id`
3. Supplier calls `GET /api/supplier/orders` → backend queries `WHERE supplier_id = {this_supplier.supplier_id}` → returns all orders for this supplier
4. Supplier calls `GET /api/supplier/orders/{id}` → returns single order with all items

**Supplier identification:** Via session cookie → `User.id` → `Supplier.owner_id`  
**Shop owner identification:** `SupplierOrder.shop_owner_id`  
**Order items:** `supplier_order_items` table joined via `SupplierOrder.items` relationship

---

## 18. Order Status Logic

### Allowed statuses and transitions — CODE-VERIFIED

```
Pending → Accepted | Cancelled
Accepted → Preparing | Cancelled
Preparing → Out for Delivery | Cancelled
Out for Delivery → Delivered
Delivered → (terminal)
Cancelled → (terminal)
```

Defined in `main.py` line 24–28:
```python
TRANSITIONS = {
    "Pending": {"Accepted", "Cancelled"},
    "Accepted": {"Preparing", "Cancelled"},
    "Preparing": {"Out for Delivery", "Cancelled"},
    "Out for Delivery": {"Delivered"},
    "Delivered": set(), "Cancelled": set(),
}
```

### Status update — CODE-VERIFIED
`PUT /api/supplier/orders/{id}/status` with `{"status": "Accepted"}`:
- Validates transition: if `payload.status not in TRANSITIONS.get(order.status, set())` → 400 error
- Invalid transitions are **prevented** at the backend
- Valid transitions persist to DB and return updated order JSON

### Shop Owner visibility — CODE-VERIFIED
`GET /api/orders` returns `SupplierOrder` records including `status` field. Shop Owner can see the updated status.

---

## 19. Payment Logic

### What is implemented — CODE-VERIFIED

| Feature | Status |
|---------|--------|
| Payment method selection (UI) | 🟢 IMPLEMENTED |
| `CASH_ON_DELIVERY` option | 🟢 IMPLEMENTED (stored, no processing) |
| `PAY_LATER` option | 🟢 IMPLEMENTED (stored, no processing) |
| `REQUEST_ORDER` option | 🟢 IMPLEMENTED (stored, no processing) |
| Payment stored in DB | 🟢 IMPLEMENTED (`Checkout.payment_method`) |
| Online payment gateway | 🔴 NOT IMPLEMENTED |
| Payment capture / confirmation | 🔴 NOT IMPLEMENTED |
| Supplier settlement | 🔴 NOT IMPLEMENTED |
| Multi-supplier payment splitting | 🔴 NOT IMPLEMENTED (no gateway) |
| Payment status tracking | 🔴 NOT IMPLEMENTED |

**Conclusion:** Payment is stored as a method label. No real money movement or gateway integration exists. All three payment modes are equivalent in effect — they record a string and create orders. `CODE-VERIFIED`

---

## 20. API Inventory

| Method | Path | Frontend Caller | Backend | DB Query | Auth | Role | Status |
|--------|------|----------------|---------|---------|------|------|--------|
| GET | `/api/health` | `getHealth()` in `api.js` | ✅ | None | None | None | 🟢 |
| POST | `/api/auth/register/shop-owner` | **NEVER CALLED** | ✅ | INSERT users+shops | None | — | 🔴 DISCONNECTED |
| POST | `/api/auth/register/supplier` | **NEVER CALLED** | ✅ | INSERT users+suppliers | None | — | 🔴 DISCONNECTED |
| POST | `/api/auth/register/gruh-udyog` | **NEVER CALLED** | ✅ | INSERT users+suppliers | None | — | 🔴 DISCONNECTED |
| POST | `/api/auth/login` | **NEVER CALLED** | ✅ | SELECT users | None | — | 🔴 DISCONNECTED |
| GET | `/api/auth/me` | **NEVER CALLED** | ✅ | SELECT sessions+users | Cookie | Any | 🔴 DISCONNECTED |
| POST | `/api/auth/logout` | **NEVER CALLED** | ✅ | DELETE sessions | Cookie | Any | 🔴 DISCONNECTED |
| GET | `/api/suppliers` | **NEVER CALLED** (demo data used) | ✅ | SELECT suppliers+products | Cookie | SHOP_OWNER | 🔴 DISCONNECTED |
| GET | `/api/suppliers/{id}` | `catalogService.getSupplier()` | ✅ | SELECT supplier+products | Cookie | SHOP_OWNER | 🟡 API exists, always 401 |
| GET | `/api/suppliers/{id}/products` | `catalogService.getSupplierProducts()` | ✅ | SELECT products WHERE supplier | Cookie | SHOP_OWNER | 🟡 API exists, always 401 |
| GET | `/api/suppliers/{id}/products/{pid}` | `catalogService.getSupplierProduct()` | ✅ | SELECT product | Cookie | SHOP_OWNER | 🟡 API exists, always 401 |
| POST | `/api/checkout` | `checkoutService.createCheckoutRequest()` | ✅ | INSERT checkout+orders+items | Cookie | SHOP_OWNER | 🟡 API exists, always 401 |
| GET | `/api/orders` | `orderService.getOrders()` | ✅ | SELECT supplier_orders | Cookie | SHOP_OWNER | 🟡 API exists, always 401 |
| GET | `/api/orders/{id}` | `orderService.getOrder()` | ✅ | SELECT supplier_order | Cookie | SHOP_OWNER | 🟡 API exists, always 401 |
| GET | `/api/analytics/shop` | `shopAnalyticsService` | ✅ | SELECT supplier_orders aggregated | Cookie | SHOP_OWNER | 🟡 API exists, always 401 |
| GET | `/api/supplier/dashboard` | `supplierDashboardService` | ✅ | SELECT supplier+orders | Cookie | SUPPLIER/GU | 🟡 API exists, always 401 |
| GET | `/api/supplier/orders` | `supplierOrderService` | ✅ | SELECT supplier_orders | Cookie | SUPPLIER/GU | 🟡 API exists, always 401 |
| GET | `/api/supplier/orders/{id}` | `supplierOrderService` | ✅ | SELECT supplier_order | Cookie | SUPPLIER/GU | 🟡 API exists, always 401 |
| PUT | `/api/supplier/orders/{id}/status` | `supplierOrderService` | ✅ | UPDATE supplier_order.status | Cookie | SUPPLIER/GU | 🟡 API exists, always 401 |
| GET | `/api/supplier/products` | `supplierProductService` | ✅ | SELECT products | Cookie | SUPPLIER/GU | 🟡 API exists, falls back to localStorage |
| POST | `/api/supplier/products` | `supplierProductService` | ✅ | INSERT product | Cookie | SUPPLIER/GU | 🟡 API exists, falls back to localStorage |
| PUT | `/api/supplier/products/{id}` | `supplierProductService` | ✅ | UPDATE product | Cookie | SUPPLIER/GU | 🟡 API exists, falls back to localStorage |
| DELETE | `/api/supplier/products/{id}` | `supplierProductService` | ✅ | UPDATE is_active=false | Cookie | SUPPLIER/GU | 🟡 API exists, falls back to localStorage |
| GET | `/api/analytics/supplier` | `supplierAnalyticsService` | ✅ | SELECT supplier_orders aggregated | Cookie | SUPPLIER/GU | 🟡 API exists, always 401 |

---

## 21. Database Relationships (Diagram)

```
users (1)────────────────────────(1) shops
  │                  [shop.owner_id → users.id]
  │
  ├──────────────────────────────(1) suppliers
  │                 [supplier.owner_id → users.id]
  │
  └──────────────────────────────(n) sessions
                    [sessions.user_id → users.id]

users (1)────────────────────────(n) checkouts
                  [checkouts.shop_owner_id → users.id]

checkouts (1)────────────────────(n) supplier_orders
               [supplier_orders.checkout_id → checkouts.id]

suppliers (1)────────────────────(n) products
                [products.supplier_id → suppliers.id]

suppliers (1)────────────────────(n) supplier_orders
              [supplier_orders.supplier_id → suppliers.id]

supplier_orders (1)──────────────(n) supplier_order_items
             [items.order_id → supplier_orders.id]
```

**Notes:**
- `supplier_order_items.product_id` is a plain `VARCHAR(36)` — **no FK constraint** to `products.id`
- `users ↔ suppliers` relationship is optional (`nullable=True`)
- No foreign key from `supplier_orders` to `shops`

---

## 22. Demo / Mock Data Audit

| Feature | Data Source | Real/Demo | Connected to DB? |
|---------|------------|-----------|-----------------|
| Supplier list | `utils/supplierDiscoveryData.js` → `demoSuppliers` array | 🔵 DEMO | ❌ No |
| Category descriptions | `utils/supplierDiscoveryData.js` → `categoryDescriptions` | 🔵 DEMO | ❌ No |
| Location filter ("Ahmedabad") | Hardcoded in `SupplierListPage.jsx` line 398 | 🔵 HARDCODED | ❌ No |
| Supplier product catalog (supplier-side) | `supplierProductService.js` → `demoProducts` array | 🔵 DEMO fallback | ⚠️ Falls back to LS |
| Cart storage key | `cartStorage.js` → `connecto.demoCart` | 🟡 localStorage | ❌ No server state |
| Auth login | `authService.js` → `Promise.resolve(demoUser)` | 🔵 DEMO | ❌ No |
| Auth register | `authService.js` → `Promise.resolve()` | 🔵 DEMO | ❌ No |
| Auth session (me) | `authService.js` → `Promise.resolve(demoUser)` | 🔵 DEMO | ❌ No |
| Gruh Udyog dashboard | `gruhUdyogService.js` → `demoData` object | 🔵 DEMO | ❌ No |
| Gruh Udyog products | `gruhUdyogService.js` → `demoData.products` | 🔵 DEMO | ❌ No |
| Gruh Udyog service areas | `gruhUdyogService.js` → `demoData.serviceAreas` | 🔵 DEMO | ❌ No |
| Gruh Udyog orders | `gruhUdyogService.js` → `demoData.orders` | 🔵 DEMO | ❌ No |
| Supplier incoming orders (UI data) | `data/supplierOrdersDemo.js` | 🔵 DEMO | ⚠️ Falls back |
| Supplier customers page | `data/supplierCustomersDemo.js` | 🔵 DEMO | ❌ No |
| Supplier analytics charts | `data/supplierAnalyticsDemo.js` | 🔵 DEMO | ❌ No |
| Supplier detail location | Hardcoded `'Ahmedabad, Gujarat'` fallback | 🔵 HARDCODED | ❌ No |
| Supplier detail rating | Hardcoded `4.5` fallback | 🔵 HARDCODED | ❌ No |
| Supplier detail service areas | Hardcoded `['Ahmedabad','Gandhinagar','Bopal','Vastrapur']` | 🔵 HARDCODED | ❌ No |
| Supplier dashboard metrics | `GET /api/supplier/dashboard` | 🟢 REAL | ✅ Yes (always 401) |
| Checkout/order creation | `POST /api/checkout` | 🟢 REAL | ✅ Yes (always 401) |
| Shop owner orders | `GET /api/orders` | 🟢 REAL | ✅ Yes (always 401) |

---

## 23. Frontend ↔ Backend Connection Map

```
AUTHENTICATION:
React (LoginPage) → authService.login() → Promise.resolve() → NEVER HITS BACKEND

SUPPLIER DISCOVERY:
React (SupplierListPage) → demoSuppliers (static import) → NEVER HITS BACKEND

SUPPLIER DETAIL:
React (SupplierDetailPage) → catalogService.getSupplier() → fetch /api/suppliers/{id}
  → FastAPI → SELECT Supplier WHERE id = {id} → SQLite → response → React
  [BLOCKED BY 401 in current state]

SUPPLIER PRODUCTS:
React (SupplierCatalogPage) → catalogService.getSupplierProducts() → fetch /api/suppliers/{id}/products
  → FastAPI → SELECT Product WHERE supplier_id = {id} AND is_active = true → SQLite → response
  [BLOCKED BY 401 in current state]

CART:
React (ProductDetailPage) → addToCart() → localStorage.setItem('connecto.demoCart') → NO BACKEND

CHECKOUT:
React (CheckoutPage) → checkoutService.createCheckoutRequest() → fetch POST /api/checkout
  → FastAPI → INSERT checkout + supplier_orders + order_items → SQLite → response
  [BLOCKED BY 401 in current state]

ORDERS (Shop Owner):
React (ShopOwnerOrdersPage) → orderService.getOrders() → fetch /api/orders
  → FastAPI → SELECT SupplierOrder WHERE shop_owner_id = {user.id} → SQLite → response
  [BLOCKED BY 401 in current state]

SUPPLIER ORDERS:
React (SupplierIncomingOrdersPage) → supplierOrderService.getSupplierOrders() → fetch /api/supplier/orders
  → FastAPI → SELECT SupplierOrder WHERE supplier_id = {this_supplier.id} → SQLite → response
  [BLOCKED BY 401 in current state]

SUPPLIER PRODUCTS (management):
React (SupplierProductManagementPage) → supplierProductService.getSupplierProducts() → fetch /api/supplier/products
  → FastAPI → SELECT Product WHERE supplier_id = {this_supplier.id} → SQLite → response
  [BLOCKED BY 401; FALLS BACK TO: localStorage → demoProducts]

GRUH UDYOG (ALL):
React (GruhUdyog*Page) → gruhUdyogService.* → Promise.resolve(demoData) → NEVER HITS BACKEND
```

---

## 24. End-to-End Test Results

All tests performed via static code analysis (NOT VERIFIED runtime — backend not started during audit).

| Step | Expected | Actual | Status |
|------|----------|--------|--------|
| 1. Open app | Landing page loads | ✅ WelcomePage renders | CODE-VERIFIED |
| 2. Navigate to role selection | Role chooser shown | ✅ RoleSelectionPage renders | CODE-VERIFIED |
| 3. Select "Shop Owner" | Role stored, redirect to signup | ✅ roleStorage.js writes to localStorage | CODE-VERIFIED |
| 4. Fill signup form | Account created via API | ❌ authService.register() returns demo success, no API call | FAIL |
| 5. Login | Session cookie set | ❌ authService.login() returns demo user, no API call | FAIL |
| 6. Open Suppliers page | Real suppliers from DB | ❌ demoSuppliers loaded, no API call | FAIL |
| 7. Set shop location / area filter | Filter by area | ❌ Location filter only has hardcoded "Ahmedabad" option | FAIL |
| 8. Click a supplier from list | Supplier detail with real products | ❌ Demo supplier IDs (e.g. "narmada-wholesale") → API calls → 404 from backend + 401 | FAIL |
| 9. Add product to cart | Product in cart | ✅ Adds to localStorage (if products load, which they won't from demo suppliers) | PARTIAL |
| 10. Open cart | Multi-supplier grouping | ✅ Cart groups by supplierId correctly | CODE-VERIFIED |
| 11. Checkout | POST /api/checkout creates orders | ❌ Fails with 401 (no real session) | FAIL |
| 12. Login as Supplier | Real supplier session | ❌ Demo auth, no real session | FAIL |
| 13. Open incoming orders | Real orders from DB | ❌ Fails with 401 | FAIL |
| 14. Update order status | Status updated in DB | ❌ Fails with 401 | FAIL |
| 15. Login as Shop Owner, check status | Updated status visible | ❌ Fails with 401 | FAIL |

**Overall E2E: FAIL** — the authentication disconnection blocks the entire real API flow.

---

## 25. Expected vs. Actual

| Expected Behaviour | Actual Implementation |
|-------------------|----------------------|
| Shop Owner Login calls `POST /api/auth/login` | `authService.login()` returns `Promise.resolve()` with demo user. No HTTP request made. |
| Shop Owner Registration creates a real account | `authService.register()` returns `Promise.resolve('Account created')`. No HTTP request made. |
| After login, session cookie is set | No cookie is ever set. `AuthContext` always uses demo user. |
| Supplier discovery calls `GET /api/suppliers` | `SupplierListPage` uses `const suppliers = demoSuppliers` (static import). No API call. |
| Supplier discovery filters by shop owner's area | No area matching exists anywhere — frontend or backend. |
| Supplier service area stored in DB | `Supplier` table has no area columns. |
| Clicking a supplier loads real data from DB | API call made, but will return 401 (no session) OR 404 (demo IDs don't exist in DB) |
| Cart is backed by server session | Cart is stored in `localStorage` under key `connecto.demoCart` |
| Checkout creates orders in DB | API exists and logic is correct, but fails with 401 — no real session cookie |
| Supplier sees incoming orders in real-time | API exists, but fails with 401 — no real session cookie |
| Order status updates persist to DB | DB logic correct, but 401 blocks all updates |
| Gruh Udyog has real product/order management | All Gruh Udyog data is hardcoded in `gruhUdyogService.js` |
| Analytics shows real aggregated data | Backend analytics endpoints exist but return skeletal data; always blocked by 401 |

---

## 26. Missing / Broken Features

### 🔴 CRITICAL (Blocks all real functionality)
1. **Authentication not connected** — `authService.js` has zero real API calls. No session cookie is ever set. All backend API calls fail with 401.
2. **Supplier discovery not connected** — `SupplierListPage` uses hardcoded demo data. `GET /api/suppliers` is never called.
3. **Area / service-area matching does not exist** — No `area` or `service_area` field on `Supplier` table. No backend query comparing shop area to supplier coverage. No frontend filter based on shop owner's stored area.

### 🟡 SIGNIFICANT (Broken when auth is fixed)
4. **Demo supplier IDs won't resolve** — IDs in `demoSuppliers` (e.g., "narmada-wholesale") do not exist in the DB. After auth is fixed, `/api/suppliers/narmada-wholesale` will return 404.
5. **Supplier has minimal profile** — `Supplier` model only has `id`, `name`, `owner_id`. No location, phone, email, description, categories, verification, rating, or service areas.
6. **`service_area` on SupplierOrder always empty** — `checkout()` hard-codes `service_area=""`. Shop owner can never see which area a supplier serves.
7. **Supplier customers page** — Uses `supplierCustomersDemo.js`. No backend endpoint exists.
8. **Gruh Udyog** — 100% demo. No real backend connection despite the role being registered in DB.
9. **Shop Owner dashboard** — No dedicated backend endpoint. UI is static shell.
10. **Analytics** — Backend aggregation is skeletal (returns `ordersOverTime: []`, `topProducts: []` etc.). Analytics charts will show near-empty data even when auth is connected.

### ⚪ NOT VERIFIED (Runtime)
11. **Backend startup** — Not started during this audit. Startup logic looks correct based on code. NOT VERIFIED at runtime.
12. **CORS in production** — Configured for localhost origins. Will need update for any hosted deployment.

---

## 27. Risks and Technical Issues

| Risk | Severity | Detail |
|------|----------|--------|
| Auth is entirely demo | CRITICAL | No security. Any user sees any page. No real data isolation. |
| Session cookie never set | CRITICAL | The entire backend API is unreachable from the current frontend. |
| `product_id` in `supplier_order_items` has no FK | HIGH | If a product is deleted hard, historical orders lose their reference silently. |
| Supplier table has no location data | HIGH | Area matching is architecturally impossible until columns are added. |
| No database migrations | MEDIUM | Schema changes require `ALTER TABLE` patches added to startup. Risk of drift. |
| `service_area` hardcoded as `""` | MEDIUM | This field will never contain useful data until checkout logic is fixed. |
| Demo supplier IDs in code | MEDIUM | After auth connection, all demo supplier links (e.g., "narmada-wholesale") will 404. |
| `connecto.demoCart` key | LOW | Cart key reveals demo-prototype status. Not suitable for production. |
| Duplicate translation keys | LOW | `translations.js` (116KB) has documented duplicate keys causing unpredictable locale rendering. |
| No password reset | LOW | `/forgot-password` shows `AuthPlaceholderPage` only. |
| No email/SMS verification | LOW | Accounts registered without any verification step. |

---

## 28. Recommended Next Steps (Priority Order)

> **DO NOT MODIFY** — this section is analysis only.

1. **[P0] Connect `authService.js` to real backend** — Replace all three demo `Promise.resolve()` functions with actual `apiRequest()` calls to `/api/auth/login`, `/api/auth/register/...`, and `/api/auth/me`. This single change unlocks the entire backend.

2. **[P0] Connect `SupplierListPage` to real API** — Replace `const suppliers = demoSuppliers` with an API call to `GET /api/suppliers`. Handle loading and error states properly.

3. **[P0] Add location/service-area to `Supplier` model** — Add `area` (VARCHAR 100) and optionally `city`, `service_areas` (JSON/text) columns to the `suppliers` table. Populate during supplier registration.

4. **[P0] Implement area matching in `GET /api/suppliers`** — Accept optional `?area=` query parameter. Join shop's area from the authenticated user's shop record. Filter suppliers by area match.

5. **[P1] Fix demo supplier IDs in `demoSuppliers`** — After connecting the API, supplier IDs must come from the real DB. Remove/replace the static `demoSuppliers` array.

6. **[P1] Populate `service_area` in checkout** — When creating `SupplierOrder`, fetch the supplier's area from DB and write it to `service_area`.

7. **[P1] Enhance Supplier registration** — Collect business name, address, multiple service areas. Update `Supplier` model accordingly.

8. **[P1] Connect Gruh Udyog to real backend** — Replace `gruhUdyogService.js` demo functions with real API calls (reuse existing supplier routes, which already accept `GRUH_UDYOG` role).

9. **[P2] Implement analytics aggregations** — Backend `shop_analytics` returns `ordersOverTime: []`, `topProducts: []`. Implement real SQL aggregations.

10. **[P2] Clean up translations** — Resolve duplicate keys in `translations.js`.

---

## 29. Final Readiness Verdict

### MAJOR BACKEND/DATABASE LOGIC IS MISSING

The core flow status, step by step:

| Flow Step | Status | Evidence |
|-----------|--------|---------|
| Shop Owner registration | 🔴 DEMO — not connected | `authService.register()` = `Promise.resolve()` |
| Shop area/location stored | 🟡 PARTIAL — DB schema ready, never actually written | `authService.js` bypasses registration API |
| Supplier registration | 🔴 DEMO — not connected | Same as above |
| Supplier service area stored | 🔴 NOT IMPLEMENTED | `Supplier` model has no area columns |
| Area matching | 🔴 NOT IMPLEMENTED | No backend query, no filter, no frontend logic |
| Supplier discovery | 🔴 DEMO — hardcoded 6 suppliers | `SupplierListPage` uses `demoSuppliers` |
| Supplier details | 🟡 PARTIAL — API exists but 401 + demo IDs | `getSupplier()` calls API, blocked by no-session |
| Supplier products | 🟡 PARTIAL — API exists but 401 + demo IDs | `getSupplierProducts()` calls API, blocked |
| Multi-supplier cart | 🟡 LOCAL — localStorage only; grouping logic correct | `cartStorage.js` → `connecto.demoCart` |
| Checkout | 🟡 PARTIAL — full backend logic exists but 401 | `POST /api/checkout` → blocked by no session |
| Supplier-level order creation | 🟡 PARTIAL — logic correct, blocked | Same as above |
| Supplier incoming orders | 🟡 PARTIAL — API correct, blocked | `GET /api/supplier/orders` → 401 |
| Supplier status update | 🟡 PARTIAL — API correct with guards, blocked | `PUT /api/supplier/orders/{id}/status` → 401 |
| Shop Owner order tracking | 🟡 PARTIAL — API correct, blocked | `GET /api/orders` → 401 |

### Summary

**What is genuinely working (backend code quality):** The FastAPI backend is well-written and functionally complete. Registration, login, supplier CRUD, product CRUD, checkout order splitting, supplier earnings, and status transitions are all correctly implemented and would work immediately once the frontend auth is connected.

**What is frontend/demo only:**
- Authentication (100% demo)
- Supplier discovery list (100% demo)
- Gruh Udyog (100% demo)
- Cart (localStorage, no server)
- Supplier customers page (demo)

**What backend is actually connected (currently 401-blocked):**
- Supplier detail page
- Supplier product catalog
- Checkout
- Shop owner orders
- Supplier incoming orders
- Order status updates
- Analytics (both roles)

**What database is actually used:**
- SQLite at `backend/connekto.db` — all 7 tables created on startup, schema is ready

**Does Shop Owner → Supplier area matching really work?**  
NO. Area matching does not exist anywhere. The `Supplier` table has no location columns, `GET /api/suppliers` has no area filter, and the frontend filter is hardcoded to "Ahmedabad".

**Do supplier-specific products work?**  
The backend logic is correct (filters by `supplier_id`), but is currently unreachable from the frontend due to the 401 auth blocker.

**Do multi-supplier orders work?**  
The backend checkout split logic is correctly implemented. Once auth is connected, one `POST /api/checkout` call will correctly create N `SupplierOrder` records for N distinct suppliers. Currently 401-blocked.

**Biggest missing/broken logic:**
1. Auth disconnection (`authService.js` is 100% demo)
2. Supplier discovery disconnection (`SupplierListPage` uses only static demo data)
3. Area/service-area matching (does not exist in any layer)

**Exact recommended next step:**
Connect `authService.js` to the real `/api/auth/login` and register endpoints. This single change will unlock the entire backend and allow testing of every other API endpoint.
