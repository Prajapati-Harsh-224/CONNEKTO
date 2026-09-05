export const roleNavigation = {
  'shop-owner': [
    { key: 'home', section: 'home' }, { key: 'suppliers', section: 'suppliers' }, { key: 'cart', section: 'cart', badge: '0' }, { key: 'orders', section: 'orders' }, { key: 'analytics', section: 'analytics' }, { key: 'assistant', section: 'assistant' },
  ],
  supplier: [
    { key: 'dashboard', section: 'home' }, { key: 'orders', section: 'orders' }, { key: 'products', section: 'products' }, { key: 'customers', section: 'customers' }, { key: 'analytics', section: 'analytics' },
  ],
  'gruh-udyog': [
    { key: 'dashboard', section: 'home' }, { key: 'products', section: 'products' }, { key: 'serviceAreas', section: 'service-areas' }, { key: 'orders', section: 'orders' },
  ],
}

export function getRoleNavigation(role) {
  return roleNavigation[role] || roleNavigation['shop-owner']
}
