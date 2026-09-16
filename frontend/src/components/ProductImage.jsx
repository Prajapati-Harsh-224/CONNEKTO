import { useEffect, useState } from 'react'
import { normalizeImageUrl, isSafeImageUrl } from '../utils/imageUrl.js'

export default function ProductImage({ src, alt, className = '', fallbackText = 'Product image unavailable', ...props }) {
  const imageUrl = normalizeImageUrl(typeof src === 'string' ? src : '')
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setHasError(false)
    if (imageUrl && isSafeImageUrl(imageUrl)) {
      setIsLoading(true)
    } else {
      setIsLoading(false)
    }
  }, [imageUrl])

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
      className={`product-image-asset ${isLoading ? 'product-image-loading ' : ''}${className}`.trim()}
      loading="lazy"
      onError={() => {
        setHasError(true)
        setIsLoading(false)
      }}
      onLoad={() => {
        setIsLoading(false)
        setHasError(false)
      }}
      referrerPolicy="no-referrer"
      src={imageUrl}
    />
  )
}

