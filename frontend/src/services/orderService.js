import { apiRequest } from './api.js'

export function getOrders() {
  return apiRequest('/orders')
}

export function getOrder(orderId) {
  return apiRequest(`/orders/${orderId}`)
}

export function cancelOrder(orderId, reason = 'Cancelled by shop owner') {
  return apiRequest(`/orders/${encodeURIComponent(orderId)}/cancel`, {
    method: 'POST',
    body: { reason },
  })
}
