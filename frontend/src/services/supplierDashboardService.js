import { apiRequest } from './api.js'

export function getSupplierDashboard() {
  return apiRequest('/supplier/dashboard')
}
