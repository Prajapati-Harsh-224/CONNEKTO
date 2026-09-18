import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiMapPin, FiCheckCircle, FiArrowRight, FiArrowLeft } from 'react-icons/fi'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getSupplier } from '../services/catalogService.js'

function getSupplierInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'S'
}

export default function SupplierDetailPage() {
  const { supplierId } = useParams()
  const { t } = useLocale()
  const [supplier, setSupplier] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    setError('')
    setNotFound(false)
    setSupplier(null)
    getSupplier(supplierId)
      .then((response) => {
        setSupplier(response.data?.supplier || null)
      })
      .catch((requestError) => {
        if (requestError.status === 404) setNotFound(true)
        else setError(requestError.message)
      })
      .finally(() => setIsLoading(false))
  }, [supplierId])

  if (isLoading) return <LoadingState message={t('loadingSupplierCatalog')} />
  if (error) {
    return (
      <section className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl" role="alert">
        {error}
      </section>
    )
  }
  if (notFound || !supplier) return <EmptyState title={t('supplierNotFound')} message={t('supplierCatalogMessage')} />

  const initials = getSupplierInitials(supplier.name)
  const displayLocation = (Array.isArray(supplier.serviceAreas) && supplier.serviceAreas.length > 0) ? supplier.serviceAreas.join(', ') : (supplier.location || '')

  return (
    <section className="space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <span>{t('shopOwner')}</span>
        <span>→</span>
        <Link to="/dashboard/shop-owner/suppliers" className="hover:text-brand-orange transition-colors">{t('suppliers')}</Link>
        <span>→</span>
        <span className="text-slate-800 font-bold truncate">{supplier.name}</span>
      </nav>

      {/* Supplier Profile Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-orange-100 text-brand-orange font-bold text-xl sm:text-2xl flex items-center justify-center shrink-0 shadow-xs border border-orange-200/60">
            {initials}
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-brand-orange bg-orange-50 border border-orange-200 uppercase tracking-wider">
                {supplier.category}
              </span>
              {supplier.isVerified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
                  <FiCheckCircle className="w-3.5 h-3.5" />
                  {t('verifiedSupplier')}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{supplier.name}</h1>

            {displayLocation && (
              <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-600">
                <FiMapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{displayLocation}</span>
              </div>
            )}

            <p className="text-sm text-slate-600 leading-relaxed pt-1">{supplier.description}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-6 border-t border-slate-100">
          <Link
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-brand-orange text-white hover:bg-orange-700 active:scale-95 transition-all shadow-xs"
            to={`/dashboard/shop-owner/suppliers/${supplier.id}/products`}
          >
            <span>{t('viewProducts')}</span>
            <FiArrowRight className="w-4 h-4" />
          </Link>
          <Link
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all"
            to="/dashboard/shop-owner/suppliers"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>{t('backToSuppliers')}</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
