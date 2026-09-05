import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getSuppliers } from '../services/catalogService.js'

export default function SupplierListPage() {
  const { t } = useLocale()
  const [suppliers, setSuppliers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getSuppliers().then((response) => setSuppliers(response.data.suppliers)).catch((requestError) => setError(requestError.message)).finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <LoadingState message={t('loadingSupplierCatalog')} />
  if (error) return <section className="catalog-page"><div className="eyebrow">{t('shopOwnerWorkspace')}</div><h1>{t('suppliers')}</h1><p className="form-message error" role="alert">{error}</p></section>
  if (!suppliers.length) return <section className="catalog-page"><div className="eyebrow">{t('shopOwnerWorkspace')}</div><h1>{t('suppliers')}</h1><EmptyState title={t('catalogUnavailable')} message={t('discoverSuppliers')} /></section>

  return (
    <section className="catalog-page">
      <div className="catalog-heading">
        <div>
          <div className="eyebrow">{t('shopOwnerWorkspace')}</div>
          <h1>{t('suppliers')}</h1>
          <p className="muted">{t('discoverSuppliers')}</p>
        </div>
      </div>

      <div className="catalog-grid">
        {suppliers.map((supplier) => (
          <article className="product-card" key={supplier.id}>
            <div className="product-image" aria-hidden="true">{supplier.name.slice(0, 1)}</div>
            <div className="product-card-body">
              <span className="product-category">{supplier.category}</span>
              <h3>{supplier.name}</h3>
              <p className="product-brand">{supplier.description}</p>
              <div className="product-specs">
                <span>
                  {t('serviceAreas')}
                  <strong>{supplier.serviceAreas.length}</strong>
                </span>
                <span>
                  {t('productCount', { count: supplier.productCount })}
                  <strong>{supplier.productCount}</strong>
                </span>
              </div>
              <div className="product-card-footer">
                <span className="product-price">{supplier.minimumOrder}</span>
                <Link className="button secondary add-to-cart-button" to={`/dashboard/shop-owner/suppliers/${supplier.id}`}>
                  {t('browseProducts')}
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
