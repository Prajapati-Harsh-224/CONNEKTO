import { apiRequest } from './api.js'

export function getGruhUdyogDashboard() {
  return apiRequest('/gruh-udyog/dashboard')
}

export function getGruhUdyogProducts() {
  return apiRequest('/supplier/products')
}

export function getGruhUdyogServiceAreas() {
  return apiRequest('/auth/me').then((res) => {
    const user = res.data?.user || {}
    const area = user.area || 'Ahmedabad'
    return { data: { serviceAreas: [area] } }
  }).catch(() => ({ data: { serviceAreas: [] } }))
}

export function getGruhUdyogOrders() {
  return apiRequest('/gruh-udyog/orders')
}

export function getGruhUdyogCustomers() {
  return apiRequest('/gruh-udyog/customers')
}

export function updateGruhUdyogOrderStatus(orderId, status) {
  return apiRequest(`/supplier/orders/${encodeURIComponent(orderId)}/status`, {
    method: 'PUT',
    body: { status }
  })
}

export function createGruhUdyogProduct(payload) {
  return apiRequest('/supplier/products', {
    method: 'POST',
    body: payload
  })
}

export function updateGruhUdyogProduct(productId, payload) {
  return apiRequest(`/supplier/products/${encodeURIComponent(productId)}`, {
    method: 'PUT',
    body: payload
  })
}

export function deactivateGruhUdyogProduct(productId) {
  return apiRequest(`/supplier/products/${encodeURIComponent(productId)}`, {
    method: 'DELETE'
  })
}

