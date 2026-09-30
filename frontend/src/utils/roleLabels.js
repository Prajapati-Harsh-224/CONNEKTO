const roleLabels = {
  SHOP_OWNER: 'Shop Owner',
  SUPPLIER: 'Supplier',
}

export function getRoleLabel(role) {
  return roleLabels[role] || ''
}
