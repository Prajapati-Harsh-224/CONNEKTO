import { Link } from 'react-router-dom'
import ProductImage from './ProductImage.jsx'

export default function ProductCard({ product, supplierId }) {
  const unitsPerBox = Math.max(1, Number(product.unitsPerBox || product.minimumQuantity || 1))
  const unitPrice = Number(product.price || 0)
  const boxPrice = unitPrice * unitsPerBox

  return <article className="product-card">
    <Link to={`/dashboard/shop-owner/suppliers/${supplierId}/products/${product.id}`} className="product-image-link" aria-label={`View ${product.name} details`} role="img">
      <ProductImage alt={`${product.name} product`} className="product-image" fallbackText={product.name?.slice(0, 1)?.toUpperCase() || 'P'} src={product.imageUrl || product.imageLabel} />
    </Link>
    <div className="product-card-body">
      <span className="product-category">{product.category}</span>
      <h3>{product.name}</h3>
      <p className="product-brand">{product.brand}</p>
      <div className="product-specs">
        <span>Pack size <strong>{product.packSize}</strong></span>
        <span>Min. order <strong>1 box</strong></span>
      </div>
      <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: '600', margin: '0.2rem 0' }}>
        1 Box = {unitsPerBox} packets (₹{boxPrice.toLocaleString('en-IN')}/box)
      </div>
      <div className="product-card-footer">
        <strong className="product-price">
          ₹{unitPrice.toLocaleString('en-IN')} / packet
        </strong>
        <Link className="button add-to-cart-button" to={`/dashboard/shop-owner/suppliers/${supplierId}/products/${product.id}`}>View product</Link>
      </div>
    </div>
  </article>
}
