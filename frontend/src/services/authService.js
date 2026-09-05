import { apiRequest } from './api.js'

export function login(credentials) {
  return apiRequest('/auth/login', {
    body: credentials,
    method: 'POST',
  })
}

export function register(credentials) {
  return apiRequest('/auth/register', {
    body: credentials,
    method: 'POST',
  })
}

export function getCurrentUser() {
  return apiRequest('/auth/me')
}

export function logout() {
  return apiRequest('/auth/logout', { method: 'POST' })
}
