import ProductImage from './ProductImage.jsx'

export default function ProductSummaryCard({ product }) {
  return <article className="product-summary-card"><ProductImage alt={`${product.name} product`} aria-hidden="true" className="product-art" fallbackText={(product.name || 'P').slice(0, 1).toUpperCase()} src={product.imageUrl || product.imageLabel || ''} /><div className="product-summary-copy"><span className="product-category">{product.category}</span><strong>{product.name}</strong><span>{product.brand} · {product.packSize}</span></div><strong className="product-price">{product.price}</strong></article>
}
