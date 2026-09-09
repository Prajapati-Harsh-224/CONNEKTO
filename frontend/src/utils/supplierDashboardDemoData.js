export const supplierDashboardDemoData = {
  businessName: 'Narmada Wholesale',
  metrics: [
    {
      label: 'New Orders',
      value: '5',
      detail: '+2 from yesterday',
      accent: 'metric-success',
      icon: '◫',
      actionTo: '/dashboard/supplier/orders?status=New',
    },
    {
      label: 'Pending Orders',
      value: '3',
      detail: 'Awaiting your action',
      accent: 'metric-warning',
      icon: '◍',
      actionTo: '/dashboard/supplier/orders?status=Pending',
    },
    {
      label: "Today's Sales",
      value: '₹8,450',
      detail: '+12% from yesterday',
      accent: 'metric-primary',
      icon: '₹',
      actionTo: '/dashboard/supplier/analytics',
    },
    {
      label: 'Total Products',
      value: '48',
      detail: '42 active · 6 inactive',
      accent: 'metric-neutral',
      icon: '▣',
      actionTo: '/dashboard/supplier/products',
    },
  ],
  recentOrders: [
    { id: 'ORD-1024', shopOwner: 'Shree General Store', items: 8, amount: 2450, status: 'New', date: 'Today, 10:42 AM', location: 'Ahmedabad' },
    { id: 'ORD-1023', shopOwner: 'Patel Kirana', items: 4, amount: 1280, status: 'Processing', date: 'Today, 09:15 AM', location: 'Ahmedabad' },
    { id: 'ORD-1022', shopOwner: 'Jain Provision Store', items: 6, amount: 3120, status: 'Confirmed', date: 'Yesterday, 6:30 PM', location: 'Ahmedabad' },
    { id: 'ORD-1021', shopOwner: 'Mehta Mart', items: 3, amount: 980, status: 'Ready', date: 'Yesterday, 4:12 PM', location: 'Ahmedabad' },
    { id: 'ORD-1020', shopOwner: 'Shakti Stores', items: 5, amount: 2200, status: 'Pending', date: 'Sep 7, 2:18 PM', location: 'Ahmedabad' },
  ],
}
