import { apiRequest } from './api.js'

export function getShopAnalytics() {
  return apiRequest('/analytics/shop')
}
