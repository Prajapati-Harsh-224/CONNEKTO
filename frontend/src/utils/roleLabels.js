const roleLabels = {
  SHOP_OWNER: 'Shop Owner',
  SUPPLIER: 'Supplier',
  GRUH_UDYOG: 'Gruh Udyog',
}

export function getRoleLabel(role) {
  return roleLabels[role] || ''
}
