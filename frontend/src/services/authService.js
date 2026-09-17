import { apiRequest } from './api.js'

const REGISTER_ROUTES = {
  SHOP_OWNER: '/auth/register/shop-owner',
  SUPPLIER: '/auth/register/supplier',
  GRUH_UDYOG: '/auth/register/gruh-udyog',
}

export function login(credentials) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: {
      emailOrPhone: credentials.emailOrPhone,
      password: credentials.password,
      role: credentials.role,
    },
  })
}

export function register(credentials) {
  const route = REGISTER_ROUTES[credentials.role]
  if (!route) {
    return Promise.reject(new Error('Unsupported registration role.'))
  }
  return apiRequest(route, {
    method: 'POST',
    body: credentials,
  })
}

export function getCurrentUser() {
  return apiRequest('/auth/me')
}

export function logout() {
  return apiRequest('/auth/logout', { method: 'POST' })
}

export function updateProfile(profileData) {
  return apiRequest('/auth/profile', {
    method: 'PUT',
    body: profileData,
  })
}
