import { apiRequest } from './api.js'

export function getSupplierOrders() {
  return apiRequest('/supplier/orders')
}

export function getSupplierOrder(orderId) {
  return apiRequest(`/supplier/orders/${encodeURIComponent(orderId)}`)
}

export function updateSupplierOrderStatus(orderId, status) {
  return apiRequest(`/supplier/orders/${encodeURIComponent(orderId)}/status`, {
    body: { status },
    method: 'PUT',
  })
}
