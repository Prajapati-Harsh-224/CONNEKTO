# Connecto — Product Specification

## 1. Problem

Small retailers frequently purchase FMCG goods through fragmented processes:
- Sales representatives visit stores periodically.
- Retailers communicate orders through calls or messaging apps.
- Retailers may not have an easy way to compare suppliers/products.
- Distributors need to collect and organize orders.
- Order visibility can be poor for both sides.

Connecto aims to digitize the ordering relationship without requiring the retailer to understand complex B2B software.

## 2. Product Vision

Build a simple, local-language-friendly B2B ordering layer for small retailers and suppliers.

The product should feel closer to a simple shopping/order application than enterprise procurement software.

## 3. User Roles

### ROLE_SHOP_OWNER
Primary customer.

Capabilities:
- Authentication
- Dashboard
- Browse suppliers
- Browse products
- Search
- Cart
- Place order
- Track order
- Analytics
- Profile/settings

### ROLE_SUPPLIER
Primary supply-side user.

Capabilities:
- Authentication
- Supplier dashboard
- Product management
- Incoming orders
- Order status
- Customer/order visibility
- Analytics

### ROLE_GRUH_UDYOG
Future role.

Capabilities can be designed later around:
- Product listing
- Serviceable areas
- Incoming retailer orders

Do not allow this role to complicate the first retailer/distributor demo.

## 4. Shop Owner Journey

### Login
Shop owner selects Shop Owner and enters credentials.

### Dashboard
Show:
- Total orders
- Pending orders
- Completed orders
- Recent orders
- Basic revenue/order summary

Use dummy data for prototype mode.

### Supplier Discovery
Display supplier cards containing:
- Supplier name
- Category
- Service area
- Number of products
- Minimum order information if applicable
- Availability indicator only if supported by data

### Product Catalog
Supplier page displays:
- Product image
- Product name
- Brand
- Pack size
- Price
- Minimum quantity
- Add to cart

Important:
If real brand data is not authorized, use fictional brands or generic product data in the prototype.

### Cart
The cart may contain products from multiple suppliers.

Example:

Supplier A:
- Product 1 × 10
- Product 2 × 5

Supplier B:
- Product 3 × 20

The UI must clearly group products by supplier.

### Checkout / Order Creation
For prototype:
- Show supplier-wise breakdown.
- Show combined estimated total.
- Create separate supplier order records under one checkout/order session.

Do NOT implement real payment splitting unless explicitly requested.

### Orders
Show:
- Order ID
- Supplier
- Date
- Amount
- Status

Possible statuses:
- Pending
- Accepted
- Preparing
- Out for Delivery
- Delivered
- Cancelled

## 5. Supplier Journey

### Dashboard
Show:
- New orders
- Pending orders
- Completed orders
- Sales/order summary

### Incoming Orders
Supplier sees:
- Order ID
- Shop owner
- Products
- Quantities
- Total
- Delivery/service area
- Status

Supplier can update status.

### Product Management
Supplier can:
- Add product
- Edit product
- Remove product
- Update price
- Update minimum order quantity

For prototype, this can use local/API data.

## 6. Analytics

Analytics are secondary.

Shop owner analytics:
- Orders over time
- Total order value
- Top products
- Supplier-wise spending
- Order status distribution

Supplier analytics:
- Orders received
- Order value
- Top products
- Top customers
- Pending vs completed orders

Do not fabricate sophisticated AI analytics that cannot be explained.

## 7. AI Assistant

The AI assistant is a later differentiator, not the core product.

Possible future questions:
- "Which products did I order most this month?"
- "Which supplier did I buy the most from?"
- "What orders are still pending?"
- "Which products may need replenishment?"

For the prototype, the chatbot can be visually demonstrated with controlled sample responses, but it should not be presented as production AI.

## 8. Localization

Initial language options:
- English
- Hindi
- Gujarati

Localization should cover UI labels and core workflows.

Design principles:
- Large touch targets
- Short labels
- Familiar terminology
- Minimal typing
- Mobile-first layout
- Clear icons with text
- Avoid unnecessary English business jargon

Do not translate only the words; simplify the workflow itself.

## 9. Multi-Supplier Order Model

One checkout can contain multiple suppliers.

However, operationally these are separate supplier orders.

Example:

Checkout Session #1001
- Supplier A → Supplier Order #A1001
- Supplier B → Supplier Order #B1001
- Supplier C → Supplier Order #C1001

This model allows future payment/settlement logic without forcing it into the prototype.

## 10. Payments

Prototype:
- No real payment gateway required.
- Use "Cash on Delivery", "Pay Later", or "Request Order" as demo options.

Future:
- Online payments
- Supplier-wise settlement
- Refunds
- Partial refunds
- Commission
- GST/invoice considerations
- Payment reconciliation

These should be treated as a separate product/engineering phase.

