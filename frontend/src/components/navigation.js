export const roleNavigation = {
  'shop-owner': [
    { key: 'dashboard', section: 'home' },
    { key: 'suppliers', section: 'suppliers' },
    { key: 'cart', section: 'cart', badge: '0' },
    { key: 'orders', section: 'orders' },
    { key: 'analytics', section: 'analytics' },
  ],
  supplier: [
    { key: 'dashboard', section: 'home' },
    { key: 'orders', section: 'orders' },
    { key: 'products', section: 'products' },
    { key: 'customers', section: 'customers' },
    { key: 'analytics', section: 'analytics' },
  ],
}

export function getRoleNavigation(role) {
  return roleNavigation[role] || roleNavigation['shop-owner']
}
