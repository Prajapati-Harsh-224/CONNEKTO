import { apiRequest } from './api.js'

// Clean up any legacy demo data from localStorage
try {
  localStorage.removeItem('connekto_supplier_products')
} catch (e) {
  // Ignore in restricted environments
}

export async function getSupplierProducts() {
  return await apiRequest('/supplier/products')
}

export async function getSupplierProduct(productId) {
  return await apiRequest(`/supplier/products/${encodeURIComponent(productId)}`)
}

export async function createSupplierProduct(product) {
  return await apiRequest('/supplier/products', { body: product, method: 'POST' })
}

export async function updateSupplierProduct(productId, product) {
  return await apiRequest(`/supplier/products/${encodeURIComponent(productId)}`, { body: product, method: 'PUT' })
}

export async function deactivateSupplierProduct(productId) {
  return await apiRequest(`/supplier/products/${encodeURIComponent(productId)}`, { method: 'DELETE' })
}

export async function deleteSupplierProduct(productId) {
  return await apiRequest(`/supplier/products/${encodeURIComponent(productId)}`, { method: 'DELETE' })
}
