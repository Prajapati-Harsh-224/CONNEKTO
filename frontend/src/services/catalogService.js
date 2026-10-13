import { apiRequest } from './api.js'

export function getSuppliers(params = {}) {
  const query = new URLSearchParams()
  if (params.area) query.set('area', params.area)
  if (params.category) query.set('category', params.category)
  if (params.search) query.set('search', params.search)
  const qs = query.toString()
  return apiRequest(`/suppliers${qs ? `?${qs}` : ''}`)
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