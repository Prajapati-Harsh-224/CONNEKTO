import { apiRequest } from './api.js'

export function createCheckoutRequest(paymentMethod, items) {
  return apiRequest('/checkout', {
    body: { paymentMethod, items: items.map(({ productId, supplierId, quantity }) => ({ productId, supplierId, quantity })) },
    method: 'POST',
  })
}
