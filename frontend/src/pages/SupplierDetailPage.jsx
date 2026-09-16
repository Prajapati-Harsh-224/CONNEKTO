import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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
  if (error) return <section className="supplier-detail-page"><p className="form-message error" role="alert">{error}</p></section>
  if (notFound || !supplier) return <EmptyState title={t('supplierNotFound')} message={t('supplierCatalogMessage')} />

  const initials = getSupplierInitials(supplier.name)
  const displayLocation = (Array.isArray(supplier.serviceAreas) && supplier.serviceAreas.length > 0) ? supplier.serviceAreas.join(', ') : (supplier.location || '')

  return (
    <section className="supplier-detail-page">
      <div className="supplier-detail-breadcrumb">
        Shop Owner <span>→</span> Suppliers <span>→</span> {supplier.name}
      </div>

      <div className="supplier-profile-panel">
        <div className="supplier-profile-header">
          <div className="supplier-profile-avatar" aria-hidden="true">{initials}</div>

          <div className="supplier-profile-copy">
            <div className="supplier-profile-heading-row">
              <span className="supplier-profile-category">{supplier.category}</span>
              {supplier.isVerified && <span className="supplier-verified-badge">Verified Supplier</span>}
            </div>
            <h1>{supplier.name}</h1>
            {displayLocation && (
              <div className="supplier-profile-location" style={{ fontSize: '0.92rem', color: '#4b5563', marginTop: '0.25rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                📍 {displayLocation}
              </div>
            )}
            <p>{supplier.description}</p>
          </div>
        </div>

        <div className="supplier-profile-actions">
          <Link className="button primary supplier-primary-action" to={`/dashboard/shop-owner/suppliers/${supplier.id}/products`}>
            View products
          </Link>
          <Link className="button secondary supplier-secondary-action" to="/dashboard/shop-owner/suppliers">
            Back to suppliers
          </Link>
        </div>
      </div>
    </section>
  )
}
