import { apiRequest } from './api.js'

export function getSupplierAnalytics() {
  return apiRequest('/analytics/supplier')
}
