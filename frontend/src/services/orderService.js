import { apiRequest } from './api.js'

export function getOrders() {
  return apiRequest('/orders')
}

export function getOrder(orderId) {
  return apiRequest(`/orders/${orderId}`)
}
