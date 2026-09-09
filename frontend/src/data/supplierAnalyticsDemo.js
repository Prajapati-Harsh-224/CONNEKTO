export const supplierAnalyticsDemo = {
  isDemoData: true,
  metrics: {
    sales: 124580,
    orders: 86,
    customers: 24,
    productsSold: 1542,
    salesGrowth: 12,
    ordersGrowth: 8,
    customersGrowth: 4,
    productsGrowth: 15,
  },
  salesTrend: {
    'Last 6 months': {
      months: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
      values: [25000, 30000, 38000, 47000, 56000, 62000],
    },
    'Last 3 months': {
      months: ['Jul', 'Aug', 'Sep'],
      values: [47000, 56000, 62000],
    },
    'This year': {
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
      values: [18000, 21000, 26000, 32000, 36000, 41000, 47000, 56000, 62000],
    },
  },
  revenueBreakdown: [
    { name: 'FMCG', value: 45, color: '#59c7a0' },
    { name: 'Grocery & Staples', value: 20, color: '#8ec3ff' },
    { name: 'Beverages', value: 12, color: '#f7bc8d' },
    { name: 'Personal Care', value: 8, color: '#d7b4ef' },
    { name: 'Snacks & Packaged Foods', value: 8, color: '#f4a8a8' },
    { name: 'Others', value: 7, color: '#d9d9d9' },
  ],
  topProducts: [
    { rank: 1, name: 'Daily Grain Rice (5 kg)', units: 420, revenue: 17640 },
    { rank: 2, name: 'Sunrise Cooking Oil (1 L)', units: 310, revenue: 10540 },
    { rank: 3, name: 'Tata Tea Premium (250 g)', units: 280, revenue: 7840 },
    { rank: 4, name: 'Maggi 2-Minute Noodles (70 g)', units: 260, revenue: 3640 },
    { rank: 5, name: 'Parle-G Biscuits (800 g)', units: 218, revenue: 3270 },
  ],
  topCustomers: [
    { rank: 1, name: 'Shree General Store', orders: 12, totalSpent: 28450 },
    { rank: 2, name: 'Patel Kirana', orders: 8, totalSpent: 19200 },
    { rank: 3, name: 'Jain Provision Store', orders: 7, totalSpent: 15780 },
    { rank: 4, name: 'Mehta Mart', orders: 6, totalSpent: 12450 },
    { rank: 5, name: 'Shakti Stores', orders: 5, totalSpent: 10220 },
  ],
}

export function listSupplierAnalyticsDemo() {
  return supplierAnalyticsDemo
}
