import { apiRequest } from './api.js'

export function createCheckoutRequest(paymentMethod, items, idempotencyKey) {
  return apiRequest('/checkout', {
    body: { paymentMethod, idempotencyKey, items: items.map(({ productId, supplierId, quantity }) => ({ productId, supplierId, quantity })) },
    method: 'POST',
  })
}
