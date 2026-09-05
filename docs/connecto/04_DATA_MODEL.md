# Connecto — Data Model

This is the conceptual model for the prototype.

## User
Fields:
- id
- name
- email
- phone
- passwordHash
- role
- language
- createdAt

Roles:
- SHOP_OWNER
- SUPPLIER
- GRUH_UDYOG

## Shop
Fields:
- id
- ownerId
- businessName
- address
- city
- area
- phone

## Supplier
Fields:
- id
- userId
- businessName
- description
- category
- serviceAreas
- phone
- minimumOrderValue
- isActive

## Brand
Fields:
- id
- name
- description
- logoUrl

Important:
A brand entity does not imply that Connecto has a formal relationship with that brand.

## Product
Fields:
- id
- supplierId
- brandId
- name
- description
- category
- packSize
- price
- minimumQuantity
- imageUrl
- isActive

## Cart
Fields:
- id
- shopOwnerId
- createdAt
- updatedAt

## CartItem
Fields:
- id
- cartId
- supplierId
- productId
- quantity
- unitPrice

## Checkout
Fields:
- id
- shopOwnerId
- totalAmount
- paymentMethod
- createdAt

## SupplierOrder
Fields:
- id
- checkoutId
- supplierId
- shopOwnerId
- subtotal
- status
- createdAt
- updatedAt

## SupplierOrderItem
Fields:
- id
- supplierOrderId
- productId
- productNameSnapshot
- quantity
- unitPriceSnapshot
- lineTotal

Snapshot fields are useful because product prices/names can change after an order is created.

## Analytics

For the prototype, analytics can be calculated from orders instead of creating a separate analytics database.

