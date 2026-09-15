import { apiRequest } from './api.js'

export function getGruhUdyogDashboard() {
  return apiRequest('/supplier/dashboard').then((res) => {
    const data = res.data || {}
    return {
      data: {
        businessName: data.businessName || 'Gruh Udyog',
        metrics: data.metrics || [
          { label: 'New orders', value: '00', detail: 'Received this week', accent: 'metric-primary' },
          { label: 'Pending orders', value: '00', detail: 'Awaiting fulfillment', accent: 'metric-warning' },
          { label: 'Completed orders', value: '00', detail: 'Delivered successfully', accent: 'metric-success' },
        ],
        orders: data.recentOrders || []
      }
    }
  })
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
  return apiRequest('/supplier/orders')
}

export function updateGruhUdyogOrderStatus(orderId, status) {
  return apiRequest(`/supplier/orders/${encodeURIComponent(orderId)}/status`, {
    method: 'PUT',
    body: { status }
  })
}

