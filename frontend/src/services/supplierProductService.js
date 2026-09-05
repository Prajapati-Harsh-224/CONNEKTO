import { apiRequest } from './api.js'

export function getSupplierProducts() {
  return apiRequest('/supplier/products')
}

export function createSupplierProduct(product) {
  return apiRequest('/supplier/products', { body: product, method: 'POST' })
}

export function updateSupplierProduct(productId, product) {
  return apiRequest(`/supplier/products/${encodeURIComponent(productId)}`, { body: product, method: 'PUT' })
}

export function deactivateSupplierProduct(productId) {
  return apiRequest(`/supplier/products/${encodeURIComponent(productId)}`, { method: 'DELETE' })
}
