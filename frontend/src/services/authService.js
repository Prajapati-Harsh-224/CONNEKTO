import { getSelectedRole } from '../utils/roleStorage.js'

export function login(credentials) {
  // Demo mode: resolve locally without backend
  const fallbackRole = getSelectedRole() || 'SHOP_OWNER'
  return Promise.resolve({
    data: {
      user: {
        id: 'demo-user',
        name: credentials.emailOrPhone || credentials.identifier || 'Demo User',
        role: fallbackRole,
      },
    },
  })
}

export function register(credentials) {
  // Demo mode: resolve locally without backend
  if (!['SHOP_OWNER', 'SUPPLIER', 'GRUH_UDYOG'].includes(credentials.role)) {
    return Promise.reject(new Error('Unsupported registration role.'))
  }
  return Promise.resolve({ data: { message: 'Account created successfully.' } })
}

export function getCurrentUser() {
  // Demo mode: resolve locally without backend
  const fallbackRole = getSelectedRole() || 'SHOP_OWNER'
  return Promise.resolve({
    data: {
      user: {
        id: 'demo-user',
        name: 'Demo User',
        role: fallbackRole,
      },
    },
  })
}

export function logout() {
  // Demo mode: resolve locally without backend
  return Promise.resolve({ data: { message: 'Logged out.' } })
}
