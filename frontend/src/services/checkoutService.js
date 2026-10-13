import { apiRequest } from './api.js'

export function createCheckoutRequest(paymentMethod, items, idempotencyKey, deliveryArea) {
  return apiRequest('/checkout', {
    body: {
      paymentMethod,
      idempotencyKey,
      deliveryArea,
      items: items.map(({ productId, supplierId, quantity, boxes, boxQuantity }) => ({
        productId,
        supplierId,
        quantity: Number(quantity),
        boxes: Number(boxes || boxQuantity || 1),
      })),
    },
    method: 'POST',
  })
}
