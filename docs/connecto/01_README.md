# Connecto — AI Development Blueprint

## 1. Product Summary

Connecto is a B2B procurement and ordering platform designed to digitally connect small retail shop owners with FMCG distributors and other suppliers.

The initial product should solve one core problem:

> Small retailers often depend on sales representatives, phone calls, WhatsApp messages, or periodic visits to place replenishment orders. Connecto should make product discovery, ordering, and order visibility simpler and faster.

Connecto is not initially positioned as an official platform of any FMCG brand. It is a neutral technology platform that can be used by independent distributors, wholesalers, retailers, and eventually small manufacturers/home businesses.

## 2. Primary Users

### Shop Owner
- Discover suppliers/products
- Browse product catalogs
- Add products from multiple suppliers to a cart
- Create an order/request
- Track orders
- View basic business/order analytics
- Eventually use an AI assistant for business insights

### Distributor / Supplier
- Create a business profile
- Add/manage products
- Receive retailer orders
- View pending/confirmed/completed orders
- Manage order status
- View basic sales/order analytics
- Eventually manage delivery routes and customers

### Gruh Udyog / Small Manufacturer
This is a future expansion. The prototype may show this role, but it must not distract from the primary retailer ↔ distributor workflow.

## 3. Prototype Goal

The prototype is NOT required to be a production-ready marketplace.

Its purpose is to demonstrate the product concept clearly to:
- Incubators
- Mentors
- Potential retailers
- Potential distributors
- Early partners

The most important demo should be understandable in approximately 5 minutes.

## 4. Core Demo Story

1. Shop owner signs in.
2. Shop owner reaches dashboard.
3. Shop owner opens Suppliers.
4. Shop owner searches/selects a supplier.
5. Shop owner browses products.
6. Shop owner adds products to cart.
7. Shop owner can add products from multiple suppliers.
8. Shop owner reviews the combined cart.
9. System separates the order by supplier.
10. Shop owner places the order/request.
11. Orders appear in the Orders page.
12. Supplier logs in and sees the incoming order.
13. Supplier changes order status.
14. Shop owner sees the updated status.

This flow is the product's primary proof of value.

## 5. Product Positioning

Initial positioning:

> "Connecto helps small retailers order FMCG products from their suppliers digitally, while giving distributors a simpler way to receive and manage retailer orders."

Avoid claiming:
- Official partnership with any FMCG brand
- Official distributor status
- Guaranteed product availability
- Real-time inventory unless actually implemented
- Payment settlement capabilities unless actually implemented

## 6. Prototype vs MVP

### Prototype
A visual and functional demonstration. Dummy data is acceptable.

### MVP
A limited product used by real retailers and suppliers with real workflows and measurable feedback.

The current project should be treated as a prototype unless real users are actively using it.

## 7. Scope Priority

### P0 — Must Have
- Authentication UI
- User role selection
- Shop owner dashboard
- Supplier listing
- Supplier profile
- Product catalog
- Product search/filter
- Cart
- Multi-supplier cart grouping
- Order creation
- Orders page
- Supplier order management
- Responsive mobile-first UI

### P1 — Useful
- Basic analytics
- Supplier-side dashboard
- Product management
- Profile/business settings
- Notifications
- Gujarati/Hindi language support

### P2 — Later
- AI business assistant
- Online payment splitting
- Automated settlements
- Delivery route optimization
- Inventory synchronization
- Brand partnerships
- Gruh Udyog marketplace expansion
- Advanced analytics
- Recommendations

## 8. Important Product Principle

Do not build every feature just because it can be built.

The first objective is to prove:

> Retailer can discover products → order from suppliers → supplier receives the order → order status is visible.

Everything else is secondary.

## 9. Technology

Frontend:
- React.js

Backend:
- Node.js
- Express.js

Database:
- Use the database already selected by the project. Do not replace it without explicit approval.

## 10. AI Development Rule

This document is the source of truth for the prototype.

AI coding agents must:
- Inspect the existing repository before changing code.
- Preserve existing working functionality.
- Avoid unnecessary rewrites.
- Implement one task at a time.
- Explain files changed.
- Explain how to test the task.
- Stop after the requested task is complete.
- Never invent business requirements when the specification is unclear.

