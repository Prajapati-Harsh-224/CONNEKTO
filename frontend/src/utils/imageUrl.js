export function normalizeImageUrl(value) {
  if (!value || typeof value !== 'string') return ''
  let trimmed = value.trim().replace(/^["']|["']$/g, '').trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('blob:')) return trimmed
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  if (trimmed.startsWith('www.')) return `https://${trimmed}`
  if (!/^https?:\/\//i.test(trimmed) && trimmed.includes('.')) return `https://${trimmed}`
  return trimmed
}

export function isSafeImageUrl(value) {
  const normalized = normalizeImageUrl(value)
  if (!normalized) return false

  if (normalized.startsWith('data:image/') || normalized.startsWith('blob:')) {
    return true
  }

  try {
    const parsed = new URL(normalized)
    if (!parsed.hostname || (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost')) {
      return false
    }
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}
