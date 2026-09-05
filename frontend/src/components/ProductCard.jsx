import { Link } from 'react-router-dom'
import ProductImage from './ProductImage.jsx'

export default function ProductCard({ product, supplierId }) {
  return <article className="product-card">
    <Link to={`/dashboard/shop-owner/suppliers/${supplierId}/products/${product.id}`} className="product-image-link" aria-label={`View ${product.name} details`} role="img">
      <ProductImage alt={`${product.name} product`} className="product-image" fallbackText={product.name?.slice(0, 1)?.toUpperCase() || 'P'} src={product.imageUrl || product.imageLabel} />
    </Link>
    <div className="product-card-body">
      <span className="product-category">{product.category}</span>
      <h3>{product.name}</h3>
      <p className="product-brand">{product.brand}</p>
      <div className="product-specs"><span>Pack size <strong>{product.packSize}</strong></span><span>Min. qty <strong>{product.minimumQuantity}</strong></span></div>
      <div className="product-card-footer"><strong className="product-price">{product.price}</strong><Link className="button add-to-cart-button" to={`/dashboard/shop-owner/suppliers/${supplierId}/products/${product.id}`}>View product</Link></div>
    </div>
  </article>
}
