# Connekto — AI Master Project Context & Working Instructions

> **Purpose:** This file is the single reusable context file for AI coding agents working on the Connekto project.
>
> Before making ANY code change, the AI agent must read this file and inspect the actual repository/code. The repository is the final source of truth when this file and the code disagree.

---

# 1. PROJECT IDENTITY

**Product name:** Connekto  
**Important spelling:** `Connekto` with **k**.

Connekto is a prototype B2B ordering platform focused on connecting small shop owners with suppliers/distributors.

The primary business workflow is:

**Shop Owner → Discover Suppliers → Browse Supplier Products → Add Products From Multiple Suppliers → Cart → Checkout / Order Request → Separate Supplier Orders → Supplier Receives Order → Supplier Updates Status → Shop Owner Tracks Status**

This is currently a **prototype**, not a production marketplace.

Do not claim:
- official FMCG brand partnerships
- production-scale marketplace traction
- real payment settlement
- guaranteed live inventory
- logistics/delivery fleet capability
- production AI intelligence

---

# 2. CURRENT PRODUCT PRIORITY

The most important product flow is the retailer-to-supplier ordering loop.

Priority order:

1. Shop Owner authentication
2. Shop Owner dashboard
3. Supplier discovery
4. Supplier details
5. Supplier product catalog
6. Multi-supplier cart
7. Checkout / order request
8. Order confirmation
9. Shop Owner orders and order details
10. Supplier incoming orders
11. Supplier order status updates
12. Shop Owner status reflection
13. Basic analytics
14. Supplier management/dashboard
15. Lightweight Gruh Udyog role
16. Prototype AI Assistant

Do not add large new features before the core flow is stable.

---

# 3. TECHNOLOGY STACK — ACTUAL PROJECT

## Frontend

- React 19
- Vite 8
- React Router DOM 7
- JavaScript / JSX
- CSS/component-based styling
- Environment variable:
  `VITE_API_BASE_URL`

Important frontend areas:

- `frontend/src/App.jsx`
- `frontend/src/App.css`
- `frontend/src/index.css`
- `frontend/src/components/`
- `frontend/src/context/`
- `frontend/src/layouts/`
- `frontend/src/pages/`
- `frontend/src/services/`
- `frontend/src/utils/`

## Backend

The actual backend is **Python FastAPI**, not Node/Express.

- Python 3.11+
- FastAPI
- Uvicorn
- SQLAlchemy 2
- Pydantic
- PyMySQL
- python-dotenv
- Cookie/session-based authentication

Important backend files:

- `backend/app/main.py`
- `backend/app/database.py`
- `backend/app/models.py`
- `backend/app/schemas.py`

`backend/package.json` exists mainly for the Uvicorn convenience scripts. Do not assume the backend is an Express application.

## Database

The project contains SQLAlchemy models and MySQL support through PyMySQL.

The database layer can fall back to SQLite when MySQL is unavailable.

Therefore:

**Do not assume that a particular database is currently active. Inspect `backend/.env`, `backend/app/database.py`, and the actual runtime configuration before changing database behavior.**

Do not create or migrate database tables unnecessarily.

---

# 4. MAIN APPLICATION ROLES

The application currently has three role concepts:

## SHOP_OWNER

Main customer/buyer role.

Important pages/routes include:

- `/dashboard/shop-owner/home`
- `/dashboard/shop-owner/suppliers`
- `/dashboard/shop-owner/suppliers/:supplierId`
- `/dashboard/shop-owner/suppliers/:supplierId/products`
- `/dashboard/shop-owner/suppliers/:supplierId/products/:productId`
- `/dashboard/shop-owner/cart`
- `/dashboard/shop-owner/checkout`
- `/dashboard/shop-owner/orders`
- `/dashboard/shop-owner/orders/:orderId`
- `/dashboard/shop-owner/analytics`
- `/dashboard/shop-owner/profile`

## SUPPLIER

Supplier/distributor role.

Important pages/routes include:

- `/dashboard/supplier/home`
- `/dashboard/supplier/orders`
- `/dashboard/supplier/orders/:orderId`
- `/dashboard/supplier/products`
- `/dashboard/supplier/customers`
- `/dashboard/supplier/analytics`
- `/dashboard/supplier/profile`

## GRUH_UDYOG

Lightweight manufacturer/home-business role.

Important pages/routes include:

- `/dashboard/gruh-udyog/home`
- `/dashboard/gruh-udyog/products`
- `/dashboard/gruh-udyog/service-areas`
- `/dashboard/gruh-udyog/orders`
- `/dashboard/gruh-udyog/profile`

Gruh Udyog is secondary to the retailer-supplier workflow. Do not let it distract from the main product.

---

# 5. AUTHENTICATION & SECURITY

Authentication uses:

- frontend `AuthContext`
- `authService`
- backend auth endpoints
- session cookie
- protected routes
- role checks

Important frontend files:

- `frontend/src/context/AuthContext.jsx`
- `frontend/src/services/authService.js`
- `frontend/src/components/ProtectedRoute.jsx`

Important backend auth logic is in:

- `backend/app/main.py`

Never bypass role protection just to make a page easier to access.

Never hardcode:
- passwords
- API keys
- session tokens
- production credentials

---

# 6. CURRENT FRONTEND ARCHITECTURE

The main router is:

`frontend/src/App.jsx`

Shared application shell:

- `frontend/src/layouts/AppShell.jsx`
- `frontend/src/layouts/RoleLayout.jsx`

Shared navigation/UI:

- `frontend/src/components/Navbar.jsx`
- `frontend/src/components/Sidebar.jsx`
- `frontend/src/components/MobileNavigation.jsx`
- `frontend/src/components/navigation.js`

Shared functional components include:

- `ProductCard.jsx`
- `ProductImage.jsx`
- `QuantitySelector.jsx`
- `OrderCard.jsx`
- `StatusBadge.jsx`
- `StatusTimeline.jsx`
- `MetricCard.jsx`
- `LoadingState.jsx`
- `EmptyState.jsx`
- `LanguageSelector.jsx`
- `ProtectedRoute.jsx`

Reuse existing components and patterns before creating new ones.

---

# 7. CURRENT SERVICES

Important frontend service files:

- `api.js`
- `authService.js`
- `catalogService.js`
- `checkoutService.js`
- `orderService.js`
- `shopAnalyticsService.js`
- `supplierAnalyticsService.js`
- `supplierDashboardService.js`
- `supplierOrderService.js`
- `supplierProductService.js`
- `gruhUdyogService.js`

When changing a page, inspect the corresponding service first.

Do not replace API-backed behavior with permanent hardcoded frontend data just because an API is temporarily unavailable.

---

# 8. CURRENT DATA MODEL

The current SQLAlchemy model layer includes:

## User
`users`

Contains user identity, login information, role and basic account data.

## Shop
`shops`

Represents a shop owned by a Shop Owner.

## SessionToken
`sessions`

Stores authentication sessions.

## Supplier
`suppliers`

Represents suppliers/distributors.

## Product
`products`

Products belong to suppliers.

Relevant concepts include:

- supplier
- name
- brand
- category
- pack size
- price
- minimum quantity
- image
- active/inactive
- demo-data flag

## Checkout
`checkouts`

Represents the overall checkout session.

## SupplierOrder
`supplier_orders`

Represents the supplier-specific order created from a checkout.

This is important:

**One multi-supplier checkout can create multiple supplier orders.**

## OrderItem
`supplier_order_items`

Stores product snapshots, quantities and line totals for supplier orders.

Do not redesign this architecture without a clear requirement.

---

# 9. MULTI-SUPPLIER CART RULE

Multi-supplier cart is a core Connekto feature.

The Shop Owner may add products from multiple suppliers.

The UI should show one cart but group products by supplier.

At checkout:

**One checkout session → separate supplier orders**

The prototype does NOT implement real payment splitting or supplier settlement.

Supported prototype order/payment methods include:

- Cash on Delivery
- Pay Later
- Request Order

Do not introduce real payment gateways or settlement logic unless explicitly requested.

---

# 10. DEMO DATA RULES

The project contains demo-data utilities, including:

- `shopOwnerDemoData.js`
- `supplierCatalogDemoData.js`
- `supplierDemoData.js`
- `supplierDiscoveryData.js`

Demo data is acceptable for the prototype.

When using real-world FMCG brands in demo data:

- do not imply official partnerships
- do not imply authorization
- clearly treat them as demo/reference data when necessary

Prefer existing demo data before creating additional duplicate datasets.

---

# 11. CURRENT UI / DESIGN SYSTEM

Recent pages have been redesigned toward a common modern SaaS visual language.

The target design direction is:

- clean white / very light neutral background
- dark navy typography
- green primary/action accent
- subtle borders
- soft shadows
- rounded cards
- clean icons
- generous but controlled spacing
- professional B2B SaaS appearance
- mobile-first responsive behavior

The same design language should be maintained across:

- Suppliers
- Supplier Catalog
- Cart
- Checkout
- Order Confirmation
- Orders
- Analytics

Avoid:
- large green backgrounds
- excessive gradients
- unnecessary decorative circles
- oversized hero sections
- excessive animation
- random colors
- excessive shadows
- large empty areas

The goal is consistency, not redesigning every page independently.

---

# 12. RESPONSIVE REQUIREMENTS

Important tested/design target widths:

Desktop:
- 1440px
- 1280px
- 1024px

Tablet:
- 768px

Mobile:
- 390px
- 375px
- 360px

Every redesigned page should:

- fit the viewport
- avoid horizontal page overflow
- avoid clipped content
- keep buttons usable
- keep cards readable
- adapt navigation appropriately
- avoid simply shrinking the desktop layout

---

# 13. LOCALIZATION

The project already has:

- `LocaleContext.jsx`
- `LanguageSelector.jsx`
- `localeStorage.js`
- `translations.js`

Supported languages:

- English
- Hindi
- Gujarati

Use the existing translation system for user-facing static UI text.

Do not create a second localization system.

Dynamic values such as supplier names, product names, prices and backend statuses should not be translated unless the existing architecture explicitly supports it.

---

# 14. IMPORTANT CURRENT PAGES / FLOWS

The project has recently received UI refinement work for the Shop Owner journey.

The intended visual flow is:

### Suppliers
Shop Owner opens Suppliers → sees supplier cards → clicks supplier.

### Supplier Detail / Catalog
Clicking a supplier opens that supplier's products using supplier-specific demo/catalog data.

The supplier catalog should retain the same white SaaS theme and functional product interactions.

### Cart
Cart groups products supplier-wise.

Important functions:

- quantity increase/decrease
- minimum quantity validation
- remove product
- clear supplier cart/items
- supplier collapse/expand
- dynamic supplier subtotal
- dynamic total
- cart persistence
- cart badge update
- continue to checkout
- multi-supplier grouping

### Checkout
Checkout shows:

- supplier-wise order groups
- product quantities
- supplier subtotals
- total amount
- order method
- COD / Pay Later / Request Order
- Place Order
- Back to Cart

One checkout can create separate supplier orders.

### Order Confirmation
After Place Order, the user should see a confirmation/order-request result.

Supplier-specific orders should be listed.

Each “View Order” action should navigate to the Shop Owner order detail route.

### Shop Owner Orders
Orders page should support:

- order list
- status
- supplier
- item count
- amount
- date
- filters/search where implemented
- selecting/viewing an order
- full order details

### Order Status
The intended supplier lifecycle is:

**Pending → Accepted → Preparing → Out for Delivery → Delivered**

The Shop Owner should be able to see the updated status.

---

# 15. ANALYTICS

Shop Owner Analytics is intended to show a simple purchasing overview.

Target structure:

1. Analytics header
2. Month/date selector
3. Spending Trend
4. Top Suppliers
5. Most Purchased Products
6. Insight

Analytics should preferably use existing order/analytics data.

Do not invent a second analytics data architecture.

If the backend analytics endpoint is incomplete, first inspect the current implementation before deciding whether a backend change is necessary.

---

# 16. AI ASSISTANT

The AI Assistant is a **controlled prototype feature**, not a production AI system.

It may use controlled responses based on existing demo/business data.

Example questions:

- What products did I order most this month?
- Which supplier did I buy the most from?
- What orders are still pending?
- Show my recent orders.
- What is my total order value this month?
- Which products should I consider reordering?

Do not add an external AI API/SDK unless explicitly requested.

Do not describe the prototype assistant as production AI.

---

# 17. GRUH UDYOG

Gruh Udyog is a lightweight secondary role.

Expected prototype capabilities:

- dashboard
- products
- add/edit products
- service areas
- incoming orders
- order status

Do not turn it into a full marketplace, logistics platform, map/GPS system or advanced manufacturer platform unless explicitly requested.

---

# 18. BACKEND / API RULES

Before modifying backend behavior:

1. Inspect `backend/app/main.py`
2. Inspect `backend/app/models.py`
3. Inspect `backend/app/schemas.py`
4. Inspect `backend/app/database.py`
5. Inspect the corresponding frontend service
6. Check existing route behavior
7. Only then decide whether a backend change is needed

Prefer reusing existing APIs.

Do not create duplicate endpoints.

Do not change database schema unless the requirement genuinely needs it.

Do not silently change API response structures used by existing pages.

---

# 19. AI AGENT WORKING METHOD

For EVERY future task:

## Step 1 — Read this file

Read this entire file first.

## Step 2 — Inspect actual code

Never assume that the documentation or previous AI output is correct.

Inspect:

- relevant page
- router
- related components
- service/API
- backend endpoint if applicable
- data model if applicable
- CSS/shared styling

## Step 3 — Understand existing behavior

Identify what already works.

Do not rebuild working functionality.

## Step 4 — Make the smallest correct change

Modify only what is necessary for the requested task.

Avoid unrelated refactors.

## Step 5 — Preserve existing functionality

A visual redesign must not break:

- routing
- authentication
- role protection
- API integration
- cart persistence
- order creation
- status updates
- localization
- responsive behavior

## Step 6 — Validate

Run available checks such as:

```powershell
cd frontend
npm run build
npm run lint
```

For backend changes, run the relevant Python tests and/or server checks.

If browser validation is unavailable, explicitly say so.

Never claim a manual/browser test was performed if it was not.

---

# 20. HOW TO HANDLE UI CHANGE REQUESTS

When the founder provides a screenshot/reference image:

- treat it as the visual target
- inspect the existing page first
- preserve existing functionality
- reproduce the layout hierarchy, spacing and component structure as closely as practical
- keep the Connekto design system consistent
- keep the background white/light
- maintain responsive behavior
- do not replace functional data with static visual mock data unless explicitly requested

Do not generate images or replace the application with an image.

The requested UI must be implemented as real React UI.

---

# 21. HOW TO HANDLE NEW FEATURE REQUESTS

Before implementing a new feature, determine:

- Is it already partially implemented?
- Is there already a route?
- Is there already a service?
- Is there already a component?
- Is backend support already present?
- Is the database model already sufficient?

Reuse existing architecture wherever possible.

If the requested change conflicts with the current architecture, explain the conflict and choose the least destructive solution.

---

# 22. OUT OF SCOPE UNLESS EXPLICITLY REQUESTED

Do not add:

- real payment gateway
- real multi-party payment settlement
- supplier payout system
- real inventory synchronization
- FMCG brand integrations
- delivery fleet management
- route optimization
- production recommendation engine
- production AI
- full accounting
- GST compliance engine
- commission settlement
- marketplace-scale infrastructure
- unnecessary third-party libraries

---

# 23. BRANDING RULE

Always use:

**Connekto**

Never introduce the old spelling `Connecto` into user-facing UI.

Existing internal filenames, database identifiers, old documentation paths, package identifiers or legacy technical names may remain if changing them would create unnecessary risk.

Do not perform a large rename only to change internal identifiers.

---

# 24. SOURCE-OF-TRUTH PRIORITY

When information conflicts, use this priority:

1. **Actual running code and database configuration**
2. **Current user-provided UI/reference requirements**
3. **This master context file**
4. **Older project documentation**
5. **AI assumptions**

Never blindly trust an old README or old task document.

---

# 25. DO NOT REWRITE THE PROJECT

This project already contains substantial implementation.

Do NOT:

- recreate the application from scratch
- replace React with another framework
- replace FastAPI with Node/Express
- replace SQLAlchemy unnecessarily
- replace the router unnecessarily
- create duplicate pages
- create duplicate services
- replace existing data architecture without reason
- remove working features to simplify a task

---

# 26. SAFE CHANGE RULE

If a request is only a UI redesign:

**Prefer frontend-only changes.**

Only touch backend/database when required for functionality.

If a request is functional and crosses layers:

**Frontend → Service/API → FastAPI → SQLAlchemy/DB**

Trace the complete path before changing it.

---

# 27. FINAL RESPONSE FORMAT FOR EVERY TASK

After completing a task, report:

## Implemented
- concise summary of changes

## Files Changed
- exact file paths

## Functionality
- what existing functionality was preserved
- what new functionality was added

## Validation
- build result
- lint result
- tests
- browser/manual checks if actually performed

## Limitations
- anything that could not be verified

Then STOP.

Do not claim success based only on code inspection when live/browser verification was unavailable.

---

# 28. MASTER INSTRUCTION TO THE AI AGENT

When the founder gives you any new Connekto task, follow this instruction:

> **You are working inside the existing Connekto project. First read `docs/AI_MASTER_PROJECT_CONTEXT.md` completely, then inspect the actual repository and relevant code before making any change. Understand the current architecture and reuse existing components, services, APIs, routes and data structures. Implement only the requested change. Preserve all existing functionality, authentication, role protection, routing, API integration, database behavior, localization, responsive behavior and the Connekto design system. Do not rebuild the project, change the technology stack, create duplicate architecture, or add unrelated features. For UI changes, match the requested reference while keeping the background clean/white and the design consistent with the existing Connekto pages. For functional changes, trace the full frontend → service/API → FastAPI → SQLAlchemy/database path when necessary. Use existing demo data where appropriate. Never claim browser/manual validation unless it was actually performed. Run the relevant build/lint/tests, report exact files changed and any limitations, then stop.**

---

# 29. QUICK START PROMPT FOR FUTURE COPILOT CHAT

Instead of explaining the entire project every time, the founder can use:

> **Read `docs/AI_MASTER_PROJECT_CONTEXT.md` first. Then inspect the current codebase. Treat that file plus the actual code as the project context. Do not modify anything yet. I will give you the specific task next.**

For a task:

> **Read `docs/AI_MASTER_PROJECT_CONTEXT.md`, inspect the existing implementation, and implement the following task without breaking existing functionality: [TASK].**

---

# 30. IMPORTANT REMINDER

This file is a **context and working-rules document**, not a replacement for source code.

As the project evolves, update this file when major architecture, routes, roles, database structure or product direction changes.

Do not let this file become a large historical changelog.

The goal is simple:

**Any new AI coding agent should be able to understand what Connekto is, how the project is structured, what must not be broken, and how it should work — without the founder having to explain the entire project again.**
