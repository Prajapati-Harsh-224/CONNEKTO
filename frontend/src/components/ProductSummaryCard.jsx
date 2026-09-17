import ProductImage from './ProductImage.jsx'

export default function ProductSummaryCard({ product }) {
  return (
    <article className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs">
      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-100">
        <ProductImage
          alt={`${product.name} product`}
          aria-hidden="true"
          className="w-full h-full object-cover"
          fallbackText={(product.name || 'P').slice(0, 1).toUpperCase()}
          src={product.imageUrl || product.imageLabel || ''}
        />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-bold text-brand-orange uppercase tracking-wider block">{product.category}</span>
        <strong className="text-sm font-semibold text-slate-800 block truncate">{product.name}</strong>
        <span className="text-xs text-slate-500 block truncate">{product.brand} · {product.packSize}</span>
      </div>
      <strong className="text-sm font-bold text-slate-900 shrink-0">{product.price}</strong>
    </article>
  )
}
