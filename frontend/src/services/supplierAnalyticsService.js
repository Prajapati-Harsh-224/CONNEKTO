import { apiRequest } from './api.js'

export function getSupplierAnalytics(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  const query = new URLSearchParams(entries).toString()
  return apiRequest(`/analytics/supplier${query ? `?${query}` : ''}`)
}

