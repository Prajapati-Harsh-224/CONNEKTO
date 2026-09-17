import { Link } from 'react-router-dom'
import ProductImage from './ProductImage.jsx'

export default function ProductCard({ product, supplierId }) {
  const unitsPerBox = Math.max(1, Number(product.unitsPerBox || product.minimumQuantity || 1))
  const unitPrice = Number(product.price || 0)
  const boxPrice = unitPrice * unitsPerBox
  const availableStock = Number(product.availableStock ?? product.stock ?? 1)
  const isAvailable = availableStock > 0

  return (
    <article className="group flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 overflow-hidden">
      <Link
        to={`/dashboard/shop-owner/suppliers/${supplierId}/products/${product.id}`}
        className="relative block h-44 sm:h-48 w-full bg-slate-50 overflow-hidden"
        aria-label={`View ${product.name} details`}
      >
        <ProductImage
          alt={`${product.name} product`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          fallbackText={product.name?.slice(0, 1)?.toUpperCase() || 'P'}
          src={product.imageUrl || product.imageLabel}
        />
        <span
          className={`absolute top-2.5 right-2.5 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-xs ${
            isAvailable
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {isAvailable ? 'Available' : 'Unavailable'}
        </span>
      </Link>
      <div className="p-4 flex-1 flex flex-col">
        <span className="text-xs font-semibold text-brand-orange uppercase tracking-wider">{product.category}</span>
        <h3 className="text-base font-bold text-slate-800 line-clamp-1 mt-0.5">{product.name}</h3>
        <p className="text-xs text-slate-500 font-medium mb-3">{product.brand}</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-xl mb-2">
          <div>Pack size <strong className="block text-slate-800 font-semibold">{product.packSize}</strong></div>
          <div>Min. order <strong className="block text-slate-800 font-semibold">1 box</strong></div>
        </div>
        <div className="text-xs text-emerald-700 font-semibold mb-3">
          1 Box = {unitsPerBox} packets (₹{boxPrice.toLocaleString('en-IN')}/box)
        </div>
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <strong className="text-base font-bold text-slate-900">
            ₹{unitPrice.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-500">/ packet</span>
          </strong>
          <Link
            className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-orange text-white hover:bg-orange-700 active:scale-95 transition-all shadow-xs"
            to={`/dashboard/shop-owner/suppliers/${supplierId}/products/${product.id}`}
          >
            View product
          </Link>
        </div>
      </div>
    </article>
  )
}
