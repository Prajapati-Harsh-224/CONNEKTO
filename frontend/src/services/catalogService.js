import { apiRequest } from './api.js'

export function getSuppliers() {
  return apiRequest('/suppliers')
}

export function getSupplier(supplierId) {
  return apiRequest(`/suppliers/${encodeURIComponent(supplierId)}`)
}

export function getSupplierProducts(supplierId) {
  return apiRequest(`/suppliers/${encodeURIComponent(supplierId)}/products`)
}

export function getSupplierProduct(supplierId, productId) {
  return apiRequest(`/suppliers/${encodeURIComponent(supplierId)}/products/${encodeURIComponent(productId)}`)
}