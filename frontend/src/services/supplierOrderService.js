import { apiRequest } from './api.js'

export function getSupplierOrders() {
  return apiRequest('/supplier/orders')
}

export function getSupplierOrder(orderId) {
  return apiRequest(`/supplier/orders/${encodeURIComponent(orderId)}`)
}

export function updateSupplierOrderStatus(orderId, status, note = '') {
  return apiRequest(`/supplier/orders/${encodeURIComponent(orderId)}/status`, {
    body: { status, note },
    method: 'PUT',
  })
}

export function cancelSupplierOrder(orderId, reason) {
  return apiRequest(`/supplier/orders/${encodeURIComponent(orderId)}/cancel`, {
    body: { reason },
    method: 'POST',
  })
}
