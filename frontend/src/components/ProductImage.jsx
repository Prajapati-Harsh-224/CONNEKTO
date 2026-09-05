import { useState } from 'react'

function normalizeImageUrl(value) {
  if (!value || typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  if (trimmed.startsWith('www.')) return `https://${trimmed}`
  if (!/^https?:\/\//i.test(trimmed) && trimmed.includes('.')) return `https://${trimmed}`
  return trimmed
}

function isSafeImageUrl(value) {
  const normalized = normalizeImageUrl(value)
  if (!normalized) return false

  try {
    const parsed = new URL(normalized)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export default function ProductImage({ src, alt, className = '', fallbackText = 'Product image unavailable', ...props }) {
  const [hasError, setHasError] = useState(false)
  const imageUrl = normalizeImageUrl(typeof src === 'string' ? src : '')

  if (!imageUrl || !isSafeImageUrl(imageUrl) || hasError) {
    return (
      <div className={`product-image-fallback ${className}`.trim()} {...props}>
        <span>{fallbackText}</span>
      </div>
    )
  }

  return (
    <img
      {...props}
      alt={alt || 'Product image'}
      className={`product-image-asset ${className}`.trim()}
      loading="lazy"
      onError={() => setHasError(true)}
      src={imageUrl}
    />
  )
}
