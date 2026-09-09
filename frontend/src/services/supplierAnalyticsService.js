import { apiRequest } from './api.js'
import { listSupplierAnalyticsDemo } from '../data/supplierAnalyticsDemo.js'

export function getSupplierAnalytics() {
  return apiRequest('/analytics/supplier').catch(() => ({ data: listSupplierAnalyticsDemo() }))
}
