# Connecto — API Specification

The API should be implemented incrementally.

## Authentication

POST /api/auth/register/shop-owner
- Shop Owner Register API
- Required: name (Full name), shopName, shopAddress, area, phone, password
- Optional: email, confirmPassword

POST /api/auth/register/supplier
- Supplier Register API
- Required: name (Full name), area, phone, password
- Optional: email, confirmPassword

POST /api/auth/register/gruh-udyog
- Gruh Udyog Register API
- Required: name (Full name), area, phone, password
- Optional: email, confirmPassword

POST /api/auth/login
- Authenticate user

GET /api/auth/me
- Return current user

POST /api/auth/logout
- End session if applicable

## Suppliers

GET /api/suppliers
- List suppliers
- Optional filters: category, area, search

GET /api/suppliers/:id
- Supplier details

POST /api/suppliers
- Create supplier profile

PUT /api/suppliers/:id
- Update supplier profile

## Products

GET /api/suppliers/:supplierId/products
- Supplier product catalog

GET /api/products/:id
- Product details

POST /api/products
- Supplier creates product

PUT /api/products/:id
- Supplier updates product

DELETE /api/products/:id
- Supplier removes/deactivates product

## Cart

GET /api/cart
- Get current shop owner's cart

POST /api/cart/items
- Add product

PUT /api/cart/items/:id
- Update quantity

DELETE /api/cart/items/:id
- Remove item

DELETE /api/cart
- Clear cart

## Checkout / Orders

POST /api/checkout
- Convert cart into supplier-wise orders

GET /api/orders
- Get current user's orders

GET /api/orders/:id
- Order details

PUT /api/orders/:id/status
- Supplier updates order status

## Analytics

GET /api/analytics/shop
- Shop owner analytics

GET /api/analytics/supplier
- Supplier analytics

## API Rules

- Validate all input.
- Enforce role-based access.
- Never allow one shop owner to access another user's private orders.
- Never trust client-side prices during checkout in a production system.
- Return consistent error formats.
- Do not expose passwords or password hashes.
