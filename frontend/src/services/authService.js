import { apiRequest } from './api.js'

export function login(credentials) {
  return apiRequest('/auth/login', {
    body: {
      emailOrPhone: credentials.emailOrPhone || credentials.identifier,
      password: credentials.password,
    },
    method: 'POST',
  })
}

export function registerShopOwner(credentials) {
  return apiRequest('/auth/register/shop-owner', {
    body: credentials,
    method: 'POST',
  })
}

export function registerSupplier(credentials) {
  return apiRequest('/auth/register/supplier', {
    body: credentials,
    method: 'POST',
  })
}

export function registerGruhUdyog(credentials) {
  return apiRequest('/auth/register/gruh-udyog', {
    body: credentials,
    method: 'POST',
  })
}

export function register(credentials) {
  if (credentials.role === 'SHOP_OWNER') {
    return registerShopOwner(credentials)
  }
  if (credentials.role === 'SUPPLIER') {
    return registerSupplier(credentials)
  }
  if (credentials.role === 'GRUH_UDYOG') {
    return registerGruhUdyog(credentials)
  }
  throw new Error('Unsupported registration role.')
}

export function getCurrentUser() {
  return apiRequest('/auth/me')
}

export function logout() {
  return apiRequest('/auth/logout', { method: 'POST' })
}
