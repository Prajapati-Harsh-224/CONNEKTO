# Connekto — Full System Audit Before Supplier Phase

## 1. Audit Date

2026-09-09

## 2. Project Understanding Summary

Connekto is a prototype B2B ordering platform with a FastAPI backend and a React + Vite frontend. The main flow is a shop owner discovering suppliers, adding products from multiple suppliers to a cart, checking out, creating supplier-specific orders, and tracking those orders. The codebase includes the intended role system for Shop Owner, Supplier, and Gruh Udyog, but the implementation is mixed: some core paths are live and working at a prototype level, while a large amount of the data and UI still relies on frontend demo data and hardcoded assumptions.

The application is functional enough to demonstrate the intended business flow, but it is not yet consistent enough to be considered a complete supplier-ready platform. The most important blocker is the mismatch between the project documentation and the actual implementation: the repository contains a substantial amount of prototype/demo logic beyond the original “foundation” plan, and the live backend is only partially integrated with the real user journey.

## 3. Architecture Confirmed

- Frontend: React 19, Vite 8, React Router DOM 7, JavaScript/JSX, localized UI via `LocaleContext` and translation files.
- Backend: Python FastAPI with SQLAlchemy 2 models, SQLite fallback, cookie/session auth, and role-based endpoints.
- App structure: route-based role dashboards under `/dashboard/...`, plus a public landing experience and auth pages.
- Data model: SQLAlchemy models exist for users, shops, suppliers, products, checkout, supplier orders, and order items.
- Runtime configuration: backend uses SQLite in the local project config (`backend/.env`), while the docs and some comments still reference MySQL and Node/Express assumptions.
- Current state: cart state is stored in `localStorage` and supplier details are sourced from demo files, while core checkout/order APIs exist in FastAPI but are not yet fully data-backed by broader product catalog integrations.

## 4. Documentation vs Actual Code Differences

| Topic | Documentation / Expected | Actual Code |
|---|---|---|
| Backend stack | README and older docs imply Node/Express or a hybrid setup | Actual backend is Python FastAPI |
| Database | Docs and some notes mention MySQL-first setup | Local runtime config uses SQLite by default (`backend/.env`) |
| Scope | Foundation docs describe early prototype work | The actual app has a far more complete frontend prototype, including shop-owner cart/checkout/order views |
| Supplier flow | Supplier role is meant to be later work | Supplier pages and dashboard logic are present, but not fully backed by live supplier catalog data |
| Data source | Real backend data expected | Supplier discovery and checkout/cart views still rely on demo data files |
| Localization | Translation system is expected to be coherent | Translation file contains duplicate keys and multiple partial definitions |
| Route flow | Core shop-owner flow is the priority | Actual app has more pages than the docs describe, but some flow states are still placeholders or demo-only |

## 5. Overall Status

READY WITH FIXES

## 6. Complete Feature Checklist

| Area | Feature | Status | Verification | Issue | Priority |
|------|---------|--------|--------------|-------|----------|
| Landing/Home | Welcome page and marketing content | PASS | BOTH | Minor inconsistencies, but the page loads and flows to role selection | P2 |
| Role selection | Role chooser and selected-role state | PASS | BOTH | Works as intended in app logic | P2 |
| Shop Owner login/signup | Auth forms and registration flow | PASS | BOTH | API and UI work for the basic auth case | P1 |
| Shop Owner authentication/session | Cookie-based login and protected routes | PASS | BOTH | Works in backend tests and session-based logic | P1 |
| Shop Owner dashboard | Dashboard shell and route access | PASS | CODE | Mostly present and route-protected | P2 |
| Sidebar/navigation | Navigation and cart badge | PASS | CODE | Basic behavior is consistent, but some links are placeholders | P2 |
| Header | Brand, search, location, user controls | PASS | CODE | Basic composition works | P2 |
| Language selector | Locale switching | WARNING | BOTH | Locale file has duplicate keys; not fully validated across all locales | P1 |
| Profile | Profile page in role layouts | WARNING | CODE | Present, but not deeply validated against live user data | P2 |
| Notifications | Notification icon and UI affordance | NOT VERIFIED | NOT VERIFIED | No clear live behavior or backend integration | P2 |
| Suppliers | Supplier discovery list | FAIL | BOTH | Heavily demo-driven and not live-backed in a reliable way | P0 |
| Supplier details | Supplier details and product views | FAIL | BOTH | Depends on synthetic supplier data and not a live data contract | P0 |
| Supplier products | Product catalogs | FAIL | BOTH | Product catalog data is partly demo-driven | P0 |
| Product interactions | Add to cart and item quantity | PASS | BOTH | Works on the prototype cart state in the browser | P1 |
| Cart | Multi-supplier grouping and quantity controls | PASS | BOTH | Works in local prototype state, but not as a true backend-backed cart | P1 |
| Multi-supplier cart | Cross-supplier grouping | PASS | BOTH | Works in localStorage and current UI flow | P1 |
| Checkout | Order creation from cart | PASS | BOTH | Prototype checkout works with current data model | P1 |
| Place order | Submit checkout request | PASS | BOTH | Real API request works in current demo/test setup | P1 |
| Order confirmation | Confirmation screen and order summary | PASS | CODE | UI is present and coherent | P2 |
| Orders | Orders list and detail page | PASS | BOTH | Works with current backend and demo data assumptions | P1 |
| Order details | Order state detail rendering | PASS | CODE | Present and navigable | P2 |
| Order status | Supplier status transitions | WARNING | CODE | Guarded by backend transitions but not fully live-tested UI update path | P2 |
| Analytics | Analytics pages | WARNING | CODE | Exists but likely static/demo data only | P2 |
| AI Assistant | Assistant page | NOT VERIFIED | NOT VERIFIED | Not deeply validated despite page presence | P2 |
| Localization | English/Hindi/Gujarati strings | WARNING | BOTH | Duplicate keys and likely untranslated strings in some flows | P1 |
| Responsive design | Mobile/desktop layout handling | WARNING | NOT VERIFIED | No complete browser-driven viewport validation performed here | P1 |
| API/backend integration | Live request flow | FAIL | BOTH | Some endpoints exist, but supplier and catalog data are not consistently live-backed | P0 |
| Data/state consistency | Cart, role, auth, order state | FAIL | BOTH | Mixed demo/localStorage state with backend persistence | P0 |
| Loading states | Loading UX | PASS | CODE | Basic loading states exist | P2 |
| Empty states | Empty cart, empty orders, no products | PASS | CODE | Present and consistent | P2 |
| Error states | Validation and request errors | WARNING | CODE | Basic errors exist, but not comprehensive | P2 |
| Role protection | Route guard logic | PASS | CODE | ProtectedRoute is present and works at the route layer | P1 |
| Navigation | Cross-page routing | PASS | CODE | Most routes work in the app shell and layouts | P2 |
| Build/lint/tests | Frontend build + backend tests | PASS/WARNING | BOTH | Build passes; lint emits warnings; backend tests pass | P1 |

## 7. Complete End-to-End Flow

| Step | Expected | Actual | Status | Issue |
|------|----------|--------|--------|-------|
| Landing/Home | Public landing page loads | Loads with marketing sections and CTA | PASS | Mostly functional |
| Role Selection | User can choose a role | Works in route and saved state | PASS | No major issue |
| Shop Owner Login | Login accepts credentials | Works through backend auth endpoints | PASS | Good prototype behavior |
| Shop Owner Dashboard | Authenticated dashboard loads | Dashboard shell and relevant routes load | PASS | Mostly coherent |
| Suppliers | Supplier list loads | Uses demo supplier data rather than real API-backed supplier list | FAIL | Demo data reliance is a core issue |
| Supplier Detail | Supplier info and products load | Product/supplier detail is built off synthetic data | FAIL | No trustworthy live catalog |
| Add Products | Products can be added to cart | Adds to localStorage cart | PASS | Prototype works |
| Multi-supplier cart | Multiple supplier grouping appears | Works in localStorage | PASS | Not a real server-managed cart |
| Checkout | Cart becomes order request | `POST /api/checkout` creates order request | PASS | Works for current prototype |
| Order Confirmation | Confirmation is shown after check out | Present and coherent | PASS | UI is present |
| Orders | Orders list shows placed orders | API returns orders for the signed-in shop owner | PASS | Real enough for prototype |
| Order Details | Details page opens for placed order | Route and API exist | PASS | Works in current code |
| Analytics | Charts/summary appear | Mostly static or empty analytics data | WARNING | Not enough live data |
| AI Assistant | Business assistant can respond | Not validated as a functioning assistant | NOT VERIFIED | Needs real data or stub review |

## 8. Functional Bugs

| Bug ID | Page | Feature | Expected | Actual | Reproduction Steps | Severity | Suggested Fix Direction |
|--------|------|---------|----------|--------|-------------------|----------|------------------------|
| BO-01 | Supplier List / Supplier Detail | Supplier discovery | Live supplier catalog or real API data | Frontend uses demo supplier data from `supplierDiscoveryData.js` and other fallback sources | Open supplier list and inspect supplier cards/data sources | P0 | Replace demo-driven data with real backend API contract and DB-backed supplier records |
| BO-02 | Cart / Checkout | Multi-supplier checkout | Single cart backed by consistent state and supplier metadata | Cart is stored in browser `localStorage` and supplier details are resolved via demo lookups | Add products from multiple suppliers, then inspect localStorage and checkout payload | P1 | Keep cart state consistent with API-backed products and supplier metadata |
| BO-03 | Localization | Translation stability | Clean locale translations without duplicates | `translations.js` contains repeated keys across locale objects | Run lint and inspect duplicate translation keys | P1 | Remove duplicate keys and consolidate locale definitions |
| BO-04 | Backend startup / runtime config | App environment setup | A single, clear runtime config | README and actual code differ on Node/Express vs FastAPI and MySQL vs SQLite | Read docs and inspect runtime config | P1 | Align docs with actual runtime architecture and environment defaults |
| BO-05 | Orders / Analytics | Live data quality | Accurate order and analytics data | Some analytics are empty or static; many pages are UI-first prototypes | Visit analytics and orders after checkout flow | P2 | Wire analytics to real backend aggregations |
| BO-06 | Role flow | App navigation and route expectations | Smooth and role-aware flow | Some route patterns and placeholder pages remain | Navigate between dashboard role pages and unmatched sections | P2 | Clean up placeholder fallback routes and dead-end pages |

## 9. Visual/UI Problems

| Page | Viewport | Problem | Severity |
|------|----------|---------|----------|
| Public landing page | 390x844 | Large hero typography and large asset blocks may create visual overload | P2 |
| Cart / Checkout | 390x844 | Long supplier names, product strings, and totals may cause cramped card layouts | P1 |
| Shop Owner dashboard | 1280x800 | Card density may look busy with mixed spacing and multiple large stat treatments | P2 |
| Orders page | 1024x768 | The tab list and detail pane could be crowded in narrower widths | P2 |
| Auth pages | 360x800 | Long forms and role header blocks may compress vertical rhythm | P2 |
| Localization pages | 390x844 | Some translated text and buttons may expand beyond expected widths | P1 |

## 10. Responsive Problems

### 1440 x 900
- Layout is acceptable for the main shell and static content.
- Some cards and stat blocks are visually dense but not broken.

### 1280 x 800
- Shop Owner dashboard and order list are usable but visually crowded.
- Some detail panels may compress too much for comfortable reading.

### 1024 x 768
- Narrower dashboards and order panels become more compressed.
- Multi-column layouts may feel overloaded, especially in the checkout and cart views.

### 768 x 1024
- Forms remain usable but can become height-heavy and less comfortable for editing.
- The cart/checkout stack may be harder to scan without overflow control.

### 390 x 844 and 375 x 812
- The most likely issue is stacked content compression and text wrapping.
- Not fully live-validated in this environment, but code patterns indicate risk and should be checked in browser QA.

## 11. Navigation Problems

- Some pages exist under a role dashboard, but the actual user journey still contains placeholders or redirects that are not meaningful enough for real operations.
- The assistant route is redirected to the home dashboard instead of a working assistant page.
- Some unmatched `:section` routes render placeholder content instead of real business pages; this makes route coverage look fuller than it really is.
- The route tree includes multi-role shells, but several role-specific experiences still appear as prototype shells rather than fully working workflows.

## 12. Authentication & Role Problems

- Authentication endpoints exist and backend tests confirm account creation and login logic for all roles.
- The route guards are implemented and role-based redirect logic is present.
- However, there is no complete end-to-end browser session test covering protected paths, incorrect-role access, and logout flow in a live UI environment.
- The selected role is persisted in front-end storage, which helps navigation but is not a substitute for trusted backend enforcement and role validation across every route.

## 13. Localization Problems

- The translation file contains duplicate keys, which indicates overlap or parse conflicts between localized blocks.
- A number of strings are still hardcoded in English rather than routed through the translation layer.
- Hindi and Gujarati content was not fully verified live in this session; the risk is that some static text or labels may remain untranslated or mis-sized.
- Because translation keys are overwritten or duplicated, some locale values may be unpredictable from one route to another.

## 14. API / Backend Problems

- Shop-owner checkout, order fetching, and auth endpoints are real and testable.
- Supplier discovery, catalog data, and cart metadata are not fully backed by a consistent live API layer.
- A large portion of supplier data exists only in frontend utility files and mock/demo objects.
- There is a partial mismatch between backend business logic and the frontend’s data assumptions, especially around supplier metadata, service areas, and real product catalog retrieval.
- The app is in a “prototype but partially integrated” state, not a fully live backend-backed production flow.

## 15. Data / State Problems

- Cart state is stored in browser localStorage under a demo key: `connecto.demoCart`.
- Supplier metadata is sourced from synthetic discovery files rather than backend records.
- The role and auth state are partly dependent on client-side persistence and selected-role history rather than a fully trusted backend session model across all flows.
- Some pages read cart state and supplier info from different sources, which can cause inconsistent UI and mismatch between displayed data and backend-recorded order items.

## 16. Build / Lint / Test Results

### Frontend
- `npm run build` -> PASS
- `npm run lint` -> WARNING
  - Warning count includes multiple duplicate translation keys and some unused variables/imports.

### Backend
- `pytest -q` -> PASS
  - Result: 8 passed in 2.75s

### Runtime verification notes
- Frontend dev server was started successfully.
- Backend live startup was verified using the project virtual environment and correct invocation path.
- Browser-dependent end-to-end interaction was not fully automated in this environment, so the live UI path still contains a large amount of “NOT VERIFIED” risk.

## 17. Browser Verification Limitations

The environment used for this audit did not provide a full interactive browser automation session for the complete user journey. As a result:

- Real front-end interaction and visual verification were only partially exercised.
- Live validation for Supplier flow, full auth/session browser confidence, and deep responsive checks remains limited.
- The project should be treated as partially live-validated, not fully browser-tested.

## 18. P0 — Blocking Issues

1. Supplier discovery, supplier details, and product catalog remain predominantly demo-backed, which makes the system unreliable for the real business workflow.
2. Frontend data state and backend order logic are not consistently aligned across cart, supplier metadata, and product data paths.
3. The current product flow is still too dependent on synthetic or local browser-state data to justify beginning the Supplier role in a meaningful live way.

## 19. P1 — Important Issues

1. Translation duplication and translation key overlap create risk of inconsistent localization.
2. Build passes, but lint warnings show code quality issues that should be cleaned before deeper iteration.
3. Role/login flow is good structurally, but the session and route protection were not fully browser-tested across every role.
4. Docs and actual runtime config diverge significantly, which increases implementation drift risk.
5. Cart/checkout prototype works, but it is not backed by a robust backend-driven data model yet.

## 20. P2 — Polish Issues

1. Some screens include large or crowded visual blocks that may not age well on smaller/mobile widths.
2. Placeholder pages remain in the route map for some unmatched sections.
3. Some English strings remain hardcoded instead of using localized keys.
4. Several UI elements are not yet fully aligned with the product’s intended business narrative.
5. Analytics and assistant flows are not yet polished enough to be considered complete.

## 21. Recommended Fix Order

1. Fix the data contract and supplier/product integration first. This is the foundation for a trustworthy supplier and checkout flow.
2. Remove the remaining demo-only supplier/cart assumptions and align them with backend data.
3. Clean up auth/session validation and role-protection checks through live browser testing.
4. Resolve localization key duplication and translation consistency.
5. Address quality warnings, responsive layout issues, and placeholder route cleanup.
6. Then revisit the Supplier role start after the Shop Owner path is stable and verified end-to-end.

## 22. Supplier Phase Readiness

Should we begin the Supplier role now?

NO.

The project has a working prototype for Shop Owner auth, cart, and checkout, but the data model for supplier discovery and product workflows is still too demo-driven and partially inconsistent with the backend. Before proceeding with the Supplier role, the project must:

- replace demo-only supplier catalogue data with real backend-backed records,
- align cart and checkout state with actual product/supplier metadata,
- verify route and role protection in a real browser session,
- clean up localization and lint warnings,
- validate the full shop-owner journey in a live environment with no placeholder assumptions.

## 23. Final Verdict

FIX SHOP OWNER ISSUES FIRST
