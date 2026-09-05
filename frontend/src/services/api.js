const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.error?.message || 'The Connekto API is unavailable.')
  }
  return payload
}

export async function getHealth() {
  return apiRequest('/health')
}
