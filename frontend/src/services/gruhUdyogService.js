import { apiRequest } from './api.js'

const demoData = {
  businessName: 'Swad Saman',
  metrics: [
    { label: 'Products live', value: '18', detail: 'Ready for local retailer orders', accent: 'metric-primary' },
    { label: 'Open orders', value: '07', detail: 'Across nearby markets', accent: 'metric-warning' },
    { label: 'Service coverage', value: '06 areas', detail: 'Delivery and pickup zones', accent: 'metric-success' },
    { label: 'Daily demand', value: 'Rs 16,400', detail: 'Average daily demand signal', accent: 'metric-primary' },
  ],
  products: [
    { id: 'gu-01', name: 'Groundnut Chikki', brand: 'Swad Saman', category: 'Snacks', packSize: '250 g', price: 120, minimumQuantity: 10, imageLabel: 'C' },
    { id: 'gu-02', name: 'Sev Mamra Mix', brand: 'Swad Saman', category: 'Snacks', packSize: '500 g', price: 180, minimumQuantity: 8, imageLabel: 'M' },
    { id: 'gu-03', name: 'Masala Khakhra', brand: 'Swad Saman', category: 'Bakery', packSize: '200 g', price: 95, minimumQuantity: 12, imageLabel: 'K' },
    { id: 'gu-04', name: 'Herbal Tea', brand: 'Swad Saman', category: 'Beverages', packSize: '200 g', price: 140, minimumQuantity: 15, imageLabel: 'T' },
  ],
  serviceAreas: ['Maninagar', 'Bapunagar', 'Vastrapur', 'Anand Nagar', 'Naroda', 'Nikol'],
  orders: [
    { id: '#GU-201', shopOwner: 'Asha Mart', area: 'Maninagar', status: 'Pending', amount: 2480, date: 'Today, 9:10 AM' },
    { id: '#GU-202', shopOwner: 'Kutch Foods', area: 'Naroda', status: 'Accepted', amount: 3150, date: 'Today, 8:05 AM' },
    { id: '#GU-203', shopOwner: 'Shree Kirana', area: 'Vastrapur', status: 'Preparing', amount: 1820, date: 'Yesterday' },
    { id: '#GU-204', shopOwner: 'Jalaram Store', area: 'Nikol', status: 'Out for Delivery', amount: 2240, date: 'Yesterday' },
  ],
}

export function getGruhUdyogDashboard() {
  return Promise.resolve({ data: demoData })
}

export function getGruhUdyogProducts() {
  return Promise.resolve({ data: { products: demoData.products } })
}

export function getGruhUdyogServiceAreas() {
  return Promise.resolve({ data: { serviceAreas: demoData.serviceAreas } })
}

export function getGruhUdyogOrders() {
  return Promise.resolve({ data: { orders: demoData.orders } })
}

export function updateGruhUdyogOrderStatus(orderId, status) {
  const nextOrder = demoData.orders.find((order) => order.id === orderId)
  if (!nextOrder) {
    return Promise.reject(new Error('Order not found.'))
  }
  nextOrder.status = status
  return Promise.resolve({ data: { order: nextOrder } })
}

export function apiRequestForGruhUdyog() {
  return apiRequest('/gruh-udyog/demo')
}
