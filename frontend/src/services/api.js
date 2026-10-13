const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
const DEFAULT_TIMEOUT_MS = 15000

export async function apiRequest(path, options = {}) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || DEFAULT_TIMEOUT_MS)

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      signal: controller.signal,
      ...options,
      ...(options.body !== undefined
        ? { body: typeof options.body === 'string' ? options.body : JSON.stringify(options.body) }
        : {}),
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      const error = new Error(payload?.error?.message || 'The Connekto API is unavailable.')
      error.status = response.status
      error.code = payload?.error?.code
      error.details = payload?.error?.details
      throw error
    }
    return payload
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeoutError = new Error('Request timed out. Please check your internet connection.')
      timeoutError.code = 'TIMEOUT'
      timeoutError.status = 408
      throw timeoutError
    }
    if (err instanceof TypeError && err.message?.toLowerCase().includes('fetch')) {
      const netError = new Error('Unable to reach Connekto servers. Please check your internet connection.')
      netError.code = 'NETWORK_ERROR'
      throw netError
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function getHealth() {
  return apiRequest('/health')
}

