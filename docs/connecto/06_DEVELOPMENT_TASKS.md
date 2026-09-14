# Connecto — Development Tasks

## Execution Rule

Complete tasks in order unless a dependency requires otherwise.

Do not implement future tasks automatically.

After each task:
1. Inspect existing code.
2. Implement only the requested scope.
3. Run/build/test the relevant area.
4. Report files changed.
5. Report how the feature was tested.
6. Stop.

## Phase 0 — Repository Audit

TASK-00
- Inspect current React and Node project.
- Identify routing, components, API structure, database setup, environment configuration.
- Do not change functionality.
- Produce a short architecture summary.

Done when:
- Existing project structure is documented.
- Existing working features are identified.
- No unnecessary code changes are made.

## Phase 1 — Foundation

TASK-01
- Establish reusable UI layout and navigation.

TASK-02
- Implement role selection.

TASK-03
- Implement login UI.

TASK-04
- Implement signup UI for Shop Owner, Supplier, and Gruh Udyog.

TASK-05
- Implement authentication backend if backend exists in current project.

## Phase 2 — Shop Owner

TASK-06
- Shop Owner dashboard.

TASK-07
- Supplier listing.

TASK-08
- Supplier details.

TASK-09
- Product catalog.

TASK-10
- Product search/filter.

TASK-11
- Product detail/add-to-cart.

TASK-12
- Cart.

TASK-13
- Multi-supplier cart grouping.

TASK-14
- Checkout/order request.

TASK-15
- Orders list.

TASK-16
- Order details and status.

## Phase 3 — Supplier

TASK-17
- Supplier dashboard.

TASK-18
- Incoming orders.

TASK-19
- Supplier order details.

TASK-20
- Order status update.

TASK-21
- Product management.

## Phase 4 — Analytics

TASK-22
- Shop owner analytics.

TASK-23
- Supplier analytics.

## Phase 5 — Localization

TASK-24
- Add language architecture.

TASK-25
- English translations.

TASK-26
- Hindi translations.

TASK-27
- Gujarati translations.

## Phase 6 — Prototype Polish

TASK-28
- Mobile responsiveness.

TASK-29
- Loading states.

TASK-30
- Empty states.

TASK-31
- Error states.

TASK-32
- Demo seed data.

TASK-33
- End-to-end demo testing.

## Phase 7 — Optional Demonstrations

TASK-34
- AI assistant prototype UI.

TASK-35
- Gruh Udyog prototype role.

These are optional and must not block the primary retailer → supplier ordering flow.

## Explicitly Out of Scope for First Prototype

- Real payment settlement
- Payment splitting
- Production-grade inventory synchronization
- Real brand integrations
- Delivery fleet management
- Automated route optimization
- Complex recommendation engine
- Full accounting
- GST compliance engine
- Commission settlement
- Marketplace-scale infrastructure
