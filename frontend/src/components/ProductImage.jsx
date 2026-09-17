import { useEffect, useState } from 'react'
import { normalizeImageUrl, isSafeImageUrl } from '../utils/imageUrl.js'

export default function ProductImage({ src, alt, className = '', fallbackText = 'Product image unavailable', ...props }) {
  const imageUrl = normalizeImageUrl(typeof src === 'string' ? src : '')
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setHasError(false)
  }, [imageUrl])

  if (!imageUrl || !isSafeImageUrl(imageUrl) || hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 text-slate-400 text-xs font-semibold text-center select-none ${className}`.trim()}
        {...props}
      >
        <span className="p-2 line-clamp-2">{fallbackText}</span>
      </div>
    )
  }

  return (
    <img
      {...props}
      alt={alt || 'Product image'}
      className={`object-cover ${className}`.trim()}
      onError={() => {
        setHasError(true)
      }}
      onLoad={() => {
        setHasError(false)
      }}
      referrerPolicy="no-referrer"
      src={imageUrl}
    />
  )
}
